"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "~/api/apiClient";
import PostCard from "./PostCard";
import type {
  GiftingConfirmResult,
  GiftingOrder,
  GiftingOrderInput,
  PublicGiftingPage,
} from "~/api/giftingTypes";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const NICKNAME_MAX = 40;
const NAME_MAX = 100;
const CONFIRM_POLLS = 8;
const CONFIRM_POLL_MS = 3000;
const RAZORPAY_GREEN = "#166534";
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Phase =
  | { kind: "form" }
  | { kind: "paying" }
  | { kind: "confirming" }
  | { kind: "success"; trees: number }
  | { kind: "processing" }
  | { kind: "problem" };

type PhotoUpload = "idle" | "uploading" | "done" | "failed";

// Event type codes shared with the dashboard (utils/eventTypes).
const OCCASIONS: Record<string, { label: string; emoji: string }> = {
  "1": { label: "Birthday", emoji: "🎂" },
  "2": { label: "In loving memory", emoji: "🕊️" },
  "3": { label: "A gift of trees", emoji: "🌳" },
  "4": { label: "Wedding", emoji: "💐" },
  "5": { label: "Anniversary", emoji: "💞" },
  "6": { label: "Celebration", emoji: "🪔" },
  "7": { label: "Retirement", emoji: "🌿" },
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDate = (isoDate: string) =>
  new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const initials = (name: string | null) =>
  (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

// Why the page cannot take gifts right now, or null when it can.
function closedReason(page: PublicGiftingPage): string | null {
  if (page.accepting) return null;
  if (page.status === "closed")
    return "This page is no longer accepting gifts.";
  const now = Date.now();
  if (page.starts_at && new Date(page.starts_at).getTime() > now) {
    return `Gifting opens on ${formatDate(page.starts_at)}.`;
  }
  if (page.ends_at && new Date(page.ends_at).getTime() < now) {
    return "Gifting on this page has ended.";
  }
  return "This page is not accepting gifts right now.";
}

export default function GiftingPageView({ page }: { page: PublicGiftingPage }) {
  const params = useSearchParams();
  const source: "qr" | "link" = params.get("s") === "qr" ? "qr" : "link";

  const defaultCount = page.suggested_counts.includes(5)
    ? 5
    : page.suggested_counts[0] ?? 1;
  const [count, setCount] = useState<number>(defaultCount);
  const [countText, setCountText] = useState<string>(String(defaultCount));
  const [message, setMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [showName, setShowName] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wants80g, setWants80g] = useState(false);
  const [pan, setPan] = useState("");
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [notice, setNotice] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  // One optional photo. It stays in the browser until the payment is confirmed, then is uploaded.
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoUpload, setPhotoUpload] = useState<PhotoUpload>("idle");
  const photoTarget = useRef<{ contributionId: number; token: string } | null>(
    null
  );

  // An unpaid order can be reused if the guest retries with the same details,
  // instead of creating another pending order each time.
  const orderCache = useRef<{ key: string; order: GiftingOrder } | null>(null);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const choosePhoto = (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Please choose a JPEG, PNG or WebP photo");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError("Please choose a photo smaller than 5 MB");
      return;
    }
    setPhoto(file);
    setPhotoUpload("idle");
  };

  // Runs once the payment is confirmed (and again on "Try again"). The wish is already safe, so
  // a failed photo never undoes the gift.
  const uploadPhoto = async (file: File | null = photo) => {
    const target = photoTarget.current;
    if (!file || !target) return;
    setPhotoUpload("uploading");
    try {
      await apiClient.uploadGiftingPhoto(
        page.slug,
        target.contributionId,
        target.token,
        file
      );
      setPhotoUpload("done");
      photoTarget.current = null;
    } catch (err: any) {
      if (err.code === "photo_exists") {
        setPhotoUpload("done");
        photoTarget.current = null;
      } else {
        setPhotoUpload("failed");
      }
    }
  };

  const closed = closedReason(page);
  const total = count * page.price_per_tree;
  const recipient = page.recipient_display_name;
  const memorial = page.occasion_type === "2";
  const occasion = OCCASIONS[page.occasion_type] ?? OCCASIONS["3"];
  const verb = memorial ? "Plant" : "Gift";

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > page.max_trees_per_contribution
    ) {
      e.count = `Choose between 1 and ${page.max_trees_per_contribution} trees`;
    }
    if (!name.trim()) e.name = "Please enter your name";
    if (!EMAIL_PATTERN.test(email.trim()))
      e.email = "Please enter a valid email";
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      e.phone = "Please enter a valid phone number";
    }
    if (wants80g && !PAN_PATTERN.test(pan.trim().toUpperCase())) {
      e.pan = "Enter a valid PAN (e.g. ABCDE1234F)";
    }
    if (message.length > page.message_max_chars) {
      e.message = `Please keep your message within ${page.message_max_chars} characters`;
    }
    if (!consent) e.consent = "Please accept to continue";
    return e;
  }, [count, name, email, phone, wants80g, pan, message, consent, page]);

  const hasErrors = Object.keys(errors).length > 0;

  const setCountFromText = (text: string) => {
    setCountText(text);
    const n = Number(text);
    setCount(Number.isInteger(n) ? n : 0);
  };

  const pickCount = (n: number) => {
    const bounded = Math.max(1, Math.min(page.max_trees_per_contribution, n));
    setCount(bounded);
    setCountText(String(bounded));
  };

  // Poll the idempotent confirm endpoint while the payment is still settling.
  const confirmPayment = async (
    contributionId: number,
    razorpayPaymentId: string,
    razorpaySignature: string,
    trees: number
  ) => {
    setPhase({ kind: "confirming" });
    let result: GiftingConfirmResult | null = null;
    for (let attempt = 0; attempt < CONFIRM_POLLS; attempt++) {
      try {
        result = await apiClient.confirmGiftingContribution(page.slug, {
          contribution_id: contributionId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
        });
      } catch (err: any) {
        // A bad signature will never succeed; anything else (network) retries.
        if (err.code === "bad_signature") {
          setPhase({ kind: "problem" });
          return;
        }
      }
      if (result && result.outcome !== "pending") break;
      await wait(CONFIRM_POLL_MS);
    }

    if (!result || result.outcome === "pending") {
      // Money was taken; the server finishes the job from Razorpay's webhook.
      setPhase({ kind: "processing" });
    } else if (result.outcome === "fulfilled" || result.outcome === "paid") {
      if (result.photo_upload_token) {
        photoTarget.current = {
          contributionId,
          token: result.photo_upload_token,
        };
        void uploadPhoto();
      }
      setPhase({ kind: "success", trees });
    } else {
      setPhase({ kind: "problem" });
    }
  };

  const openCheckout = (order: GiftingOrder) => {
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) {
      setPhase({ kind: "form" });
      setNotice("Payment could not be loaded. Please refresh and try again.");
      return;
    }
    const rzp = new Razorpay({
      key: order.razorpay_key_id,
      amount: order.amount * 100,
      currency: order.currency,
      name: "14 Trees Foundation",
      description: `${verb} ${order.trees_count} tree${
        order.trees_count > 1 ? "s" : ""
      } for ${recipient}`,
      order_id: order.order_id,
      prefill: {
        name: name.trim(),
        email: email.trim(),
        contact: phone.trim(),
      },
      theme: { color: RAZORPAY_GREEN },
      modal: {
        ondismiss: () => {
          setPhase((current) =>
            current.kind === "paying" ? { kind: "form" } : current
          );
        },
      },
      handler: (response: any) => {
        confirmPayment(
          order.contribution_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          order.trees_count
        );
      },
    });
    rzp.on("payment.failed", (response: any) => {
      setPhase({ kind: "form" });
      setNotice(
        `Payment failed: ${response?.error?.description ?? "please try again"}.`
      );
    });
    rzp.open();
  };

  const submit = async () => {
    setTouched(true);
    setNotice(null);
    if (hasErrors || phase.kind !== "form") return;

    const input: GiftingOrderInput = {
      trees_count: count,
      guest_name: name.trim(),
      guest_email: email.trim(),
      guest_phone: phone.trim() || undefined,
      wants_80g: wants80g,
      pan_number: wants80g ? pan.trim().toUpperCase() : undefined,
      consent,
      message: message.trim() || undefined,
      show_name: showName,
      recipient_nickname: nickname.trim() || undefined,
      source,
    };

    setPhase({ kind: "paying" });
    try {
      const key = JSON.stringify(input);
      let order =
        orderCache.current?.key === key ? orderCache.current.order : null;
      if (!order) {
        order = await apiClient.createGiftingOrder(page.slug, input);
        orderCache.current = { key, order };
      }
      openCheckout(order);
    } catch (err: any) {
      setPhase({ kind: "form" });
      setNotice(
        err.code === "not_accepting"
          ? "This page has stopped accepting gifts."
          : err.message
      );
    }
  };

  const sharePage = async () => {
    const url = window.location.origin + window.location.pathname;
    const text = `${verb} a tree for ${recipient}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: page.title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {
      // the guest dismissed the share sheet
    }
  };

  // Lightbox keyboard controls.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight")
        setLightbox((i) => (i === null ? i : (i + 1) % page.album.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) =>
          i === null ? i : (i - 1 + page.album.length) % page.album.length
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, page.album.length]);

  const memoriesUrl =
    page.memories_link && process.env.NEXT_PUBLIC_DASHBOARD_URL
      ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/events/${page.memories_link}`
      : null;

  const progress =
    page.target_trees && page.target_trees > 0
      ? Math.min(100, Math.round((page.trees_so_far / page.target_trees) * 100))
      : null;

  const wishText = message
    .trim()
    .replace(/\{recipient\}/gi, nickname.trim() || recipient);
  const postCardFrom = showName && name.trim() ? name.trim() : null;
  const postCardGreeting = `Dear ${nickname.trim() || recipient},`;

  const showForm = phase.kind === "form" || phase.kind === "paying";

  return (
    // pt-16 clears the fixed site header (h-16) so the cover starts below it.
    <main className="bg-gradient-to-b from-green-50 via-white to-white pb-20 pt-16">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.cover_image_url}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-800 via-green-700 to-emerald-600" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="mx-auto flex min-h-[320px] max-w-5xl flex-col items-center justify-end px-5 pb-10 pt-16 text-center text-white sm:min-h-[420px] sm:pb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            <span aria-hidden>{occasion.emoji}</span>
            {occasion.label}
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight drop-shadow sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-3 text-base text-white/90 sm:text-lg">
            {memorial ? "In memory of" : "A tree for"}{" "}
            <span className="font-semibold">{recipient}</span>
            <span className="mx-2 opacity-60">·</span>
            {formatDate(page.occasion_date)}
          </p>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-6 max-w-3xl px-4">
        <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl bg-white py-4 text-center shadow-lg ring-1 ring-black/5">
          <Stat value={String(page.trees_so_far)} label="trees gifted" />
          <Stat value={rupees(page.price_per_tree)} label="per tree" />
          <Stat
            value={page.target_trees ? String(page.target_trees) : "∞"}
            label={page.target_trees ? "tree goal" : "every tree counts"}
          />
        </div>
        {progress !== null && (
          <div className="mt-4 px-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-green-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-600 to-emerald-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-sm text-gray-600">
              {progress}% of the way there
            </p>
          </div>
        )}
      </section>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 px-4 lg:grid-cols-[1fr_420px] lg:items-start">
        {/* ── Checkout (first on mobile, sticky on desktop) ──── */}
        <div className="order-1 lg:sticky lg:top-24 lg:order-2">
          {phase.kind === "success" && (
            <Panel tone="green">
              <div className="text-5xl" aria-hidden>
                🌳
              </div>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">
                Thank you, {name.trim().split(" ")[0] || "friend"}!
              </h2>
              <p className="mt-2 text-gray-700">
                {phase.trees === 1
                  ? "Your tree is"
                  : `Your ${phase.trees} trees are`}{" "}
                being planted for {recipient}. A confirmation is on its way to{" "}
                <span className="font-medium">{email.trim()}</span>.
              </p>
              {(photo || photoTarget.current) && (
                <div className="mt-4 rounded-xl border border-green-200 bg-white/70 p-3 text-left text-sm text-gray-700">
                  {photo && photoUpload === "uploading" && (
                    <p className="flex items-center gap-2">
                      <Spinner /> Uploading your photo…
                    </p>
                  )}
                  {photo && photoUpload === "done" && (
                    <p>
                      Your photo was added. It will appear on the memories page
                      once we have reviewed it.
                    </p>
                  )}
                  {photo && photoUpload === "failed" && (
                    <p>
                      We could not upload your photo, but your gift is safe.{" "}
                      <button
                        type="button"
                        onClick={() => uploadPhoto()}
                        className="font-medium text-green-800 underline"
                      >
                        Try again
                      </button>
                    </p>
                  )}
                  {!photo && photoTarget.current && (
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Want to add a photo to your wish?</span>
                      <label className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-1.5 font-medium text-green-800 hover:bg-green-50">
                        Choose photo
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            choosePhoto(file);
                            if (
                              file &&
                              PHOTO_TYPES.includes(file.type) &&
                              file.size <= PHOTO_MAX_BYTES
                            ) {
                              void uploadPhoto(file);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  )}
                  {photoError && <Err text={photoError} />}
                </div>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <button
                  onClick={sharePage}
                  className="rounded-xl bg-green-800 px-5 py-3 font-medium text-white shadow hover:bg-green-900"
                >
                  {shared ? "Link copied ✓" : "Invite others to gift a tree"}
                </button>
                {memoriesUrl && (
                  <a
                    href={memoriesUrl}
                    className="rounded-xl border border-green-800 px-5 py-3 text-center font-medium text-green-800 hover:bg-green-50"
                  >
                    See the memories page
                  </a>
                )}
              </div>
            </Panel>
          )}

          {phase.kind === "confirming" && (
            <Panel tone="gray">
              <Spinner />
              <h2 className="mt-3 text-lg font-semibold text-gray-900">
                Confirming your payment…
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Please don&apos;t close this page.
              </p>
            </Panel>
          )}

          {phase.kind === "processing" && (
            <Panel tone="amber">
              <h2 className="text-lg font-semibold text-gray-900">
                Your payment is being confirmed
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                It went through but the bank is still confirming it.
                There&apos;s no need to pay again; you&apos;ll get an email once
                it&apos;s complete.
              </p>
            </Panel>
          )}

          {phase.kind === "problem" && (
            <Panel tone="red">
              <h2 className="text-lg font-semibold text-gray-900">
                We couldn&apos;t confirm your payment
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                If money was deducted, please write to contact@14trees.org with
                your name and email and we&apos;ll sort it out.
              </p>
            </Panel>
          )}

          {showForm &&
            (closed ? (
              <Panel tone="gray">
                <div className="text-4xl" aria-hidden>
                  🌱
                </div>
                <p className="mt-3 font-medium text-gray-800">{closed}</p>
                {memoriesUrl && (
                  <a
                    href={memoriesUrl}
                    className="mt-4 inline-block text-sm font-medium text-green-800 underline"
                  >
                    See the memories page
                  </a>
                )}
              </Panel>
            ) : (
              <form
                className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                noValidate
              >
                <div className="bg-green-800 px-5 py-4 text-white">
                  <h2 className="text-lg font-semibold">
                    {verb} trees for {recipient}
                  </h2>
                  <p className="text-sm text-green-100">
                    {rupees(page.price_per_tree)} per tree · planted and cared
                    for by 14 Trees
                  </p>
                </div>

                <div className="space-y-6 p-5">
                  {/* 1. Trees */}
                  <Step n={1} title="How many trees?">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                      {page.suggested_counts.map((n) => {
                        const selected = count === n;
                        return (
                          <button
                            type="button"
                            key={n}
                            onClick={() => pickCount(n)}
                            className={`rounded-xl border px-2 py-3 text-center transition ${
                              selected
                                ? "border-green-800 bg-green-800 text-white shadow"
                                : "border-gray-200 bg-white hover:border-green-600"
                            }`}
                          >
                            <span className="block text-xl font-bold leading-none">
                              {n}
                            </span>
                            <span
                              className={`mt-1 block text-xs ${
                                selected ? "text-green-100" : "text-gray-500"
                              }`}
                            >
                              {n === 1 ? "tree" : "trees"}
                            </span>
                            <span
                              className={`block text-xs font-medium ${
                                selected ? "text-white" : "text-green-800"
                              }`}
                            >
                              {rupees(n * page.price_per_tree)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <span className="text-sm text-gray-600">
                        Or choose your own
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="One less"
                          onClick={() => pickCount((count || 1) - 1)}
                          className="h-8 w-8 rounded-full border bg-white text-lg leading-none hover:bg-gray-100"
                        >
                          −
                        </button>
                        <input
                          aria-label="Number of trees"
                          inputMode="numeric"
                          value={countText}
                          onChange={(e) =>
                            setCountFromText(e.target.value.replace(/\D/g, ""))
                          }
                          className="h-8 w-14 rounded-lg border bg-white text-center"
                        />
                        <button
                          type="button"
                          aria-label="One more"
                          onClick={() => pickCount((count || 0) + 1)}
                          className="h-8 w-8 rounded-full border bg-white text-lg leading-none hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {touched && errors.count && <Err text={errors.count} />}
                  </Step>

                  {/* 2. Wish */}
                  <Step n={2} title={`A wish for ${recipient}`} optional>
                    <textarea
                      id="gift-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      placeholder="Write a few warm words…"
                    />
                    <div className="mt-1 flex items-start justify-between gap-3 text-xs text-gray-500">
                      <span>
                        Printed on their gift card and shown on the memories
                        page after review. Use {"{recipient}"} for their name.
                      </span>
                      <span
                        className={`shrink-0 tabular-nums ${
                          message.length > page.message_max_chars
                            ? "font-semibold text-red-600"
                            : ""
                        }`}
                      >
                        {message.length}/{page.message_max_chars}
                      </span>
                    </div>
                    {touched && errors.message && <Err text={errors.message} />}

                    <label
                      className="mt-3 block text-sm font-medium text-gray-700"
                      htmlFor="gift-nickname"
                    >
                      What do you call {recipient}?{" "}
                      <span className="font-normal text-gray-400">
                        optional
                      </span>
                    </label>
                    <input
                      id="gift-nickname"
                      value={nickname}
                      maxLength={NICKNAME_MAX}
                      onChange={(e) => setNickname(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
                      placeholder="e.g. Didi, Mama, Rahul"
                    />

                    {message.trim() && (
                      <div className="mt-3">
                        <PostCard
                          photoUrl={photoPreview}
                          greeting={postCardGreeting}
                          text={wishText}
                          from={postCardFrom}
                        />
                      </div>
                    )}

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Add a photo{" "}
                        <span className="font-normal text-gray-400">
                          optional
                        </span>
                      </p>
                      {message.trim() ? (
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <label className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-50">
                            {photo ? "Change photo" : "Choose photo"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              onChange={(e) => {
                                choosePhoto(e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {photo && (
                            <button
                              type="button"
                              onClick={() => setPhoto(null)}
                              className="text-sm text-gray-500 underline hover:text-gray-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Write a wish above to add a photo to it.
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Uploaded after your payment and shown on the memories
                        page only once we have reviewed it. JPEG, PNG or WebP,
                        up to 5 MB.
                      </p>
                      {photoError && <Err text={photoError} />}
                    </div>
                  </Step>

                  {/* 3. Details */}
                  <Step n={3} title="Your details">
                    <div className="grid gap-3">
                      <Field
                        id="gift-name"
                        label="Your name"
                        value={name}
                        maxLength={NAME_MAX}
                        onChange={setName}
                        error={touched ? errors.name : undefined}
                        autoComplete="name"
                      />
                      <Field
                        id="gift-email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        error={touched ? errors.email : undefined}
                        autoComplete="email"
                      />
                      <Field
                        id="gift-phone"
                        label="Phone"
                        optional
                        type="tel"
                        value={phone}
                        onChange={setPhone}
                        error={touched ? errors.phone : undefined}
                        autoComplete="tel"
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      <Check
                        checked={showName}
                        onChange={setShowName}
                        label="Show my name with my wish (otherwise “Anonymous”)"
                      />
                      <Check
                        checked={wants80g}
                        onChange={setWants80g}
                        label="I'd like an 80G tax receipt"
                      />
                      {wants80g && (
                        <div className="ml-6 max-w-xs">
                          <Field
                            id="gift-pan"
                            label="PAN"
                            value={pan}
                            maxLength={10}
                            onChange={(v) => setPan(v.toUpperCase())}
                            error={touched ? errors.pan : undefined}
                          />
                        </div>
                      )}
                      <div>
                        <Check
                          checked={consent}
                          onChange={setConsent}
                          label={`I agree that 14 Trees Foundation may use my details to process this gift, send me a receipt and share my wish with ${recipient}.`}
                        />
                        {touched && errors.consent && (
                          <Err text={errors.consent} />
                        )}
                      </div>
                    </div>
                  </Step>

                  {notice && (
                    <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      {notice}
                    </p>
                  )}

                  <div>
                    <div className="mb-3 flex items-baseline justify-between rounded-xl bg-green-50 px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {count > 0 ? count : 0} × {rupees(page.price_per_tree)}
                      </span>
                      <span className="text-xl font-bold text-green-900">
                        {rupees(total > 0 ? total : 0)}
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={phase.kind === "paying"}
                      className="w-full rounded-xl bg-green-800 px-5 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-green-900 disabled:opacity-60"
                    >
                      {phase.kind === "paying"
                        ? "Opening secure payment…"
                        : `${verb} ${count > 0 ? count : ""} ${
                            count === 1 ? "tree" : "trees"
                          } · ${rupees(total > 0 ? total : 0)}`}
                    </button>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <LockIcon /> Secure payment by Razorpay · UPI, cards,
                      netbanking
                    </p>
                  </div>
                </div>
              </form>
            ))}
        </div>

        {/* ── Story, wishes, album ───────────────────────────── */}
        <div className="order-2 space-y-10 lg:order-1">
          {page.description && (
            <section>
              <p className="whitespace-pre-line text-lg leading-relaxed text-gray-700">
                {page.description}
              </p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold text-gray-900">How it works</h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                [
                  "🌱",
                  "You gift",
                  `Choose how many trees and add a wish for ${recipient}.`,
                ],
                [
                  "🌳",
                  "We plant",
                  "Your trees are planted and looked after by the 14 Trees team.",
                ],
                [
                  "💌",
                  "They receive",
                  "A gift card for their tree, carrying your wish.",
                ],
              ].map(([icon, title, body]) => (
                <li
                  key={title}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="text-2xl" aria-hidden>
                    {icon}
                  </div>
                  <p className="mt-2 font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm text-gray-600">{body}</p>
                </li>
              ))}
            </ol>
          </section>

          {page.messages.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                Wishes for {recipient}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {page.messages.map((m, i) => (
                  <li
                    key={i}
                    className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                  >
                    <span
                      aria-hidden
                      className="absolute right-4 top-1 font-serif text-5xl leading-none text-green-100"
                    >
                      ”
                    </span>
                    <p className="whitespace-pre-line text-gray-800">
                      {m.message}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-800">
                        {initials(m.name)}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {m.name ?? "Anonymous"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {page.album.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900">Album</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {page.album.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className={`group overflow-hidden rounded-xl ${
                      i === 0 && page.album.length > 2
                        ? "col-span-2 row-span-2"
                        : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt=""
                      loading="lazy"
                      className="aspect-square h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {memoriesUrl && (
            <a
              href={memoriesUrl}
              className="flex items-center justify-between rounded-2xl bg-green-800 px-5 py-4 text-white shadow hover:bg-green-900"
            >
              <span>
                <span className="block font-semibold">
                  See the memories page
                </span>
                <span className="text-sm text-green-100">
                  Photos, wishes and the trees planted so far
                </span>
              </span>
              <span aria-hidden className="text-2xl">
                →
              </span>
            </a>
          )}
        </div>
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.album[lightbox].image_url}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {page.album.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox(
                    (lightbox - 1 + page.album.length) % page.album.length
                  );
                }}
              >
                ‹
              </button>
              <button
                aria-label="Next photo"
                className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white hover:bg-white/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lightbox + 1) % page.album.length);
                }}
              >
                ›
              </button>
            </>
          )}
          <button
            aria-label="Close"
            className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/20 text-xl text-white hover:bg-white/30"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <p className="text-xl font-bold text-green-900 sm:text-2xl">{value}</p>
      <p className="text-xs text-gray-500 sm:text-sm">{label}</p>
    </div>
  );
}

function Panel({
  tone,
  children,
}: {
  tone: "green" | "gray" | "amber" | "red";
  children: React.ReactNode;
}) {
  const tones = {
    green: "bg-green-50 ring-green-200",
    gray: "bg-white ring-gray-200",
    amber: "bg-amber-50 ring-amber-200",
    red: "bg-red-50 ring-red-200",
  };
  return (
    <div
      className={`rounded-2xl p-6 text-center shadow-lg ring-1 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

function Step({
  n,
  title,
  optional,
  children,
}: {
  n: number;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-800 text-xs font-bold text-white">
          {n}
        </span>
        <span className="font-semibold text-gray-900">{title}</span>
        {optional && <span className="text-xs text-gray-400">optional</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-green-800"
      />
      <span>{label}</span>
    </label>
  );
}

function Err({ text }: { text: string }) {
  return <p className="mt-1 text-sm text-red-600">{text}</p>;
}

function Spinner() {
  return (
    <div
      className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-green-100 border-t-green-700"
      role="status"
      aria-label="Loading"
    />
  );
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
    </svg>
  );
}

function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  maxLength?: number;
  autoComplete?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium text-gray-700"
        htmlFor={props.id}
      >
        {props.label}
        {props.optional && (
          <span className="ml-1 font-normal text-gray-400">optional</span>
        )}
      </label>
      <input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        onChange={(e) => props.onChange(e.target.value)}
        className={`mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 ${
          props.error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-gray-200 focus:border-green-700 focus:ring-green-100"
        }`}
      />
      {props.error && <Err text={props.error} />}
    </div>
  );
}
