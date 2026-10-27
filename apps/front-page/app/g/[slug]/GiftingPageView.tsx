"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "~/api/apiClient";
import type {
  GiftingConfirmResult,
  GiftingOrder,
  GiftingOrderInput,
  PublicGiftingPage,
} from "~/api/giftingTypes";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
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

// Wish pre-filled for each occasion; the guest can edit or clear it. Keys are the same event
// type codes as OCCASIONS. {name} is replaced with the receiver's name.
const DEFAULT_WISHES: Record<string, string> = {
  "1": "Happy Birthday, {name}! May you grow stronger and happier every year, just like this tree. 🌳",
  "2": "In loving memory of {name}. May these trees keep their memory alive for generations.",
  "3": "A little gift of green for {name}. May this tree bring you joy for years to come.",
  "4": "Congratulations, {name}! May your life together grow and flourish like these trees.",
  "5": "Happy Anniversary, {name}! May your love keep growing, year after year.",
  "6": "Wishing {name} a joyful celebration! May these trees bring light and green into your world.",
  "7": "Happy retirement, {name}! May the years ahead be as peaceful and fruitful as these trees.",
};

// The page may allow short wishes; a default that does not fit is left out rather than cut.
function defaultWish(page: PublicGiftingPage): string {
  const text = (
    DEFAULT_WISHES[page.occasion_type] ?? DEFAULT_WISHES["3"]
  ).replace("{name}", page.recipient_display_name);
  return text.length <= page.message_max_chars ? text : "";
}

// Soft tints so a long run of wishes does not look like a wall of white boxes.
const WISH_TINTS = [
  "bg-emerald-50 ring-emerald-100",
  "bg-amber-50 ring-amber-100",
  "bg-sky-50 ring-sky-100",
  "bg-rose-50 ring-rose-100",
];

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

const INPUT_BASE =
  "mt-1.5 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none transition focus:ring-4";
const INPUT_OK = "border-gray-200 focus:border-green-700 focus:ring-green-100";
const INPUT_BAD = "border-red-400 focus:border-red-500 focus:ring-red-100";

export default function GiftingPageView({ page }: { page: PublicGiftingPage }) {
  const params = useSearchParams();
  const source: "qr" | "link" = params.get("s") === "qr" ? "qr" : "link";

  const defaultCount = page.suggested_counts.includes(5)
    ? 5
    : page.suggested_counts[0] ?? 1;
  const [count, setCount] = useState<number>(defaultCount);
  const [countText, setCountText] = useState<string>(String(defaultCount));
  const [message, setMessage] = useState(() => defaultWish(page));
  const [showName, setShowName] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
  const touchStartX = useRef<number | null>(null);

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
  const recipient = page.recipient_display_name;
  const memorial = page.occasion_type === "2";
  const occasion = OCCASIONS[page.occasion_type] ?? OCCASIONS["3"];
  const verb = memorial ? "Plant" : "Gift";
  const countValid =
    Number.isInteger(count) &&
    count >= 1 &&
    count <= page.max_trees_per_contribution;
  const total = countValid ? count * page.price_per_tree : 0;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > page.max_trees_per_contribution
    ) {
      e.count = `Enter a number between 1 and ${page.max_trees_per_contribution}`;
    }
    if (!name.trim()) e.name = "Please enter your name";
    if (!EMAIL_PATTERN.test(email.trim()))
      e.email = "Please enter a valid email";
    if (!PHONE_PATTERN.test(phone.trim())) {
      e.phone = "Please enter a valid phone number";
    }
    if (!PAN_PATTERN.test(pan.trim().toUpperCase())) {
      e.pan = "Enter a valid PAN (e.g. ABCDE1234F)";
    }
    if (message.length > page.message_max_chars) {
      e.message = `Please keep your wish within ${page.message_max_chars} characters`;
    }
    if (!consent) e.consent = "Please accept to continue";
    return e;
  }, [count, name, email, phone, pan, message, consent, page]);

  const hasErrors = Object.keys(errors).length > 0;

  // The free-text box: digits only, any number up to the page maximum.
  const setCountFromText = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    setCountText(digits);
    setCount(digits ? Number(digits) : 0);
  };

  const pickCount = (n: number) => {
    setCount(n);
    setCountText(String(n));
  };

  // Poll the idempotent confirm endpoint while the payment is still settling.
  const confirmPayment = async (
    contributionId: number,
    razorpayPaymentId: string,
    razorpaySignature: string,
    trees: number
  ) => {
    setPhase({ kind: "confirming" });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    } else if (
      result.outcome === "fulfilled" ||
      result.outcome === "paid" ||
      // The webhook can finish the gift first; the server then says "skipped" for a gift that is done.
      result.status === "Fulfilled" ||
      result.status === "Paid"
    ) {
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

  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const submit = async () => {
    setTouched(true);
    setNotice(null);
    if (phase.kind !== "form") return;
    if (hasErrors) {
      scrollToFirstError();
      return;
    }

    const input: GiftingOrderInput = {
      trees_count: count,
      guest_name: name.trim(),
      guest_email: email.trim(),
      guest_phone: phone.trim(),
      pan_number: pan.trim().toUpperCase(),
      consent,
      message: message.trim() || undefined,
      show_name: showName,
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

  const goTo = (delta: number) =>
    setLightbox((i) =>
      i === null ? i : (i + delta + page.album.length) % page.album.length
    );

  // Lightbox keyboard controls.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") goTo(1);
      if (e.key === "ArrowLeft") goTo(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, page.album.length]);

  const memoriesUrl =
    page.memories_link && process.env.NEXT_PUBLIC_DASHBOARD_URL
      ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/events/${page.memories_link}`
      : null;

  const showForm = phase.kind === "form" || phase.kind === "paying";
  const showGiftBar = showForm && !closed;
  const treesLabel = countValid
    ? `${count} ${count === 1 ? "tree" : "trees"}`
    : "trees";

  return (
    // pt-16 clears the fixed site header (h-16); the bottom padding leaves room for the gift bar.
    <main
      className={`bg-white bg-[radial-gradient(60rem_28rem_at_50%_0%,theme(colors.emerald.100),transparent)] pt-16 ${
        showGiftBar ? "pb-32 lg:pb-20" : "pb-20"
      }`}
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem]">
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.cover_image_url}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-900 via-green-700 to-emerald-500" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div
          aria-hidden
          className="absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-16 -z-10 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl"
        />
        <div className="mx-auto flex min-h-[380px] max-w-3xl flex-col items-center justify-end px-5 pb-14 pt-20 text-center text-white sm:min-h-[480px] sm:pb-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium ring-1 ring-white/30 backdrop-blur">
            <span aria-hidden>{occasion.emoji}</span>
            {occasion.label}
          </span>
          <h1 className="mt-5 text-[2.1rem] font-extrabold leading-[1.1] tracking-tight drop-shadow-lg sm:text-6xl">
            {page.title}
          </h1>
          <p className="mt-4 text-base text-white/90 sm:text-lg">
            {memorial ? "In memory of" : "For"}{" "}
            <span className="font-semibold">{recipient}</span>
          </p>
          <p className="mt-1 text-sm text-white/70">
            {formatDate(page.occasion_date)}
          </p>
          {showGiftBar && (
            <a
              href="#gift"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-bold text-green-900 shadow-xl shadow-black/20 transition hover:bg-green-50 active:scale-[0.97]"
            >
              {verb} a tree <span aria-hidden>↓</span>
            </a>
          )}
        </div>
      </section>

      {page.description && (
        <section className="relative z-10 mx-auto -mt-8 max-w-3xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-green-900/10 ring-1 ring-black/5 sm:p-8">
            <span
              aria-hidden
              className="absolute -top-2 left-4 font-serif text-8xl leading-none text-green-100"
            >
              “
            </span>
            <p className="relative whitespace-pre-line text-[17px] leading-relaxed text-gray-700 sm:text-lg">
              {page.description}
            </p>
          </div>
        </section>
      )}

      <div
        className={`mx-auto grid max-w-5xl gap-10 px-4 lg:grid-cols-[1fr_420px] lg:items-start ${
          page.description ? "mt-8" : "mt-6"
        }`}
      >
        {/* ── Gift panel (first on mobile, sticky on desktop) ─── */}
        <div className="order-1 lg:sticky lg:top-24 lg:order-2" id="gift">
          {phase.kind === "success" && (
            <Panel tone="green">
              <div className="text-6xl" aria-hidden>
                🌳
              </div>
              <h2 className="mt-3 text-2xl font-extrabold text-gray-900">
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
                <div className="mt-5 rounded-2xl border border-green-200 bg-white/80 p-4 text-left text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">
                    Your memory for the event
                  </p>
                  {photo && photoUpload === "uploading" && (
                    <p className="mt-1 flex items-center gap-2">
                      <Spinner small /> Adding your photo…
                    </p>
                  )}
                  {photo && photoUpload === "done" && (
                    <p className="mt-1">
                      Your photo was added. It will appear on the event page
                      once we have reviewed it.
                    </p>
                  )}
                  {photo && photoUpload === "failed" && (
                    <p className="mt-1">
                      We could not add your photo, but your gift is safe.{" "}
                      <button
                        type="button"
                        onClick={() => uploadPhoto()}
                        className="font-semibold text-green-800 underline"
                      >
                        Try again
                      </button>
                    </p>
                  )}
                  {!photo && photoTarget.current && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span>Want to add a photo to the event?</span>
                      <label className="cursor-pointer rounded-full bg-green-800 px-4 py-2 font-semibold text-white shadow hover:bg-green-900">
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

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={sharePage}
                  className="min-h-12 rounded-full bg-green-800 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-900/20 transition hover:bg-green-900 active:scale-[0.98]"
                >
                  {shared ? "Link copied ✓" : "Invite others to gift a tree"}
                </button>
              </div>
            </Panel>
          )}

          {phase.kind === "confirming" && (
            <Panel tone="gray">
              <Spinner />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
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
                <div className="text-5xl" aria-hidden>
                  🌱
                </div>
                <p className="mt-3 font-medium text-gray-800">{closed}</p>
                {memoriesUrl && (
                  <a
                    href={memoriesUrl}
                    className="mt-4 inline-block text-sm font-semibold text-green-800 underline"
                  >
                    See the event page
                  </a>
                )}
              </Panel>
            ) : (
              <form
                id="gift-form"
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                noValidate
              >
                {/* 1. Trees */}
                <StepCard
                  n={1}
                  title={`How many trees for ${recipient}?`}
                  hint={`${rupees(
                    page.price_per_tree
                  )} per tree · planted and cared for by 14 Trees`}
                >
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
                    {page.suggested_counts.slice(0, 4).map((n) => {
                      const selected = count === n;
                      return (
                        <button
                          type="button"
                          key={n}
                          onClick={() => pickCount(n)}
                          aria-pressed={selected}
                          className={`rounded-2xl border-2 px-2 py-3 text-center transition active:scale-[0.97] ${
                            selected
                              ? "border-green-800 bg-green-800 text-white shadow-lg shadow-green-900/20"
                              : "border-gray-200 bg-white hover:border-green-600"
                          }`}
                        >
                          <span className="block text-2xl font-extrabold leading-none">
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
                            className={`mt-0.5 block text-xs font-semibold ${
                              selected ? "text-white" : "text-green-800"
                            }`}
                          >
                            {rupees(n * page.price_per_tree)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <label
                    htmlFor="gift-count"
                    className="mt-4 block text-sm font-medium text-gray-700"
                  >
                    Or enter the number of trees
                  </label>
                  <input
                    id="gift-count"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    placeholder="e.g. 7"
                    value={countText}
                    onChange={(e) => setCountFromText(e.target.value)}
                    aria-invalid={touched && !!errors.count}
                    className={`${INPUT_BASE} ${
                      touched && errors.count ? INPUT_BAD : INPUT_OK
                    }`}
                  />
                  {touched && errors.count ? (
                    <Err text={errors.count} />
                  ) : (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Up to {page.max_trees_per_contribution} trees in one gift
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {countValid
                        ? `${count} × ${rupees(page.price_per_tree)}`
                        : "Choose a number of trees"}
                    </span>
                    <span className="text-2xl font-extrabold text-green-900">
                      {rupees(total)}
                    </span>
                  </div>
                </StepCard>

                {/* 2. Wish + memory */}
                <StepCard
                  n={2}
                  title={`A wish for ${recipient}`}
                  optional
                  hint="Shown on the event page after a quick review."
                >
                  <textarea
                    id="gift-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-invalid={touched && !!errors.message}
                    className={`${INPUT_BASE} resize-none ${
                      touched && errors.message ? INPUT_BAD : INPUT_OK
                    }`}
                    placeholder="Write a few warm words…"
                  />
                  <div className="mt-1 flex justify-end text-xs">
                    <span
                      className={`tabular-nums ${
                        message.length > page.message_max_chars
                          ? "font-semibold text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {message.length}/{page.message_max_chars}
                    </span>
                  </div>
                  {touched && errors.message && <Err text={errors.message} />}

                  <div className="mt-4 rounded-2xl border border-dashed border-green-300 bg-green-50/60 p-4">
                    <p className="flex items-center gap-2 font-semibold text-gray-900">
                      <span aria-hidden>📸</span> Add a memory to the event
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Share a photo that goes with your wish. We add it after
                      your payment, and it appears on the event page once
                      reviewed.
                    </p>
                    {message.trim() ? (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {photoPreview && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoPreview}
                            alt="Your photo"
                            className="h-14 w-14 rounded-xl object-cover ring-1 ring-green-200"
                          />
                        )}
                        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-white px-5 text-sm font-semibold text-green-800 shadow-sm ring-1 ring-green-200 hover:bg-green-50">
                          {photo ? "Change photo" : "Choose a photo"}
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
                            className="min-h-11 text-sm text-gray-500 underline hover:text-gray-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        Write your wish above to add a photo to it.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      JPEG, PNG or WebP · up to 5 MB
                    </p>
                    {photoError && <Err text={photoError} />}
                  </div>
                </StepCard>

                {/* 3. Details */}
                <StepCard n={3} title="Your details">
                  <div className="grid gap-4">
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
                      inputMode="email"
                      value={email}
                      onChange={setEmail}
                      error={touched ? errors.email : undefined}
                      autoComplete="email"
                    />
                    <Field
                      id="gift-phone"
                      label="Phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={setPhone}
                      error={touched ? errors.phone : undefined}
                      autoComplete="tel"
                    />
                    <div>
                      <Field
                        id="gift-pan"
                        label="PAN"
                        value={pan}
                        maxLength={10}
                        autoComplete="off"
                        onChange={(v) => setPan(v.toUpperCase())}
                        error={touched ? errors.pan : undefined}
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        Needed for your 80G tax receipt.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <Check
                      checked={showName}
                      onChange={setShowName}
                      label="Show my name with my wish (otherwise “Anonymous”)"
                    />
                    <div>
                      <Check
                        checked={consent}
                        onChange={setConsent}
                        invalid={touched && !!errors.consent}
                        label={`I agree that 14 Trees Foundation may use my details to process this gift, send me a receipt and share my wish with ${recipient}.`}
                      />
                      {touched && errors.consent && (
                        <Err text={errors.consent} />
                      )}
                    </div>
                  </div>
                </StepCard>

                {notice && (
                  <p
                    role="alert"
                    className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200"
                  >
                    {notice}
                  </p>
                )}

                {/* Desktop submit; on mobile the sticky bar below does this. */}
                <div className="hidden lg:block">
                  <button
                    type="submit"
                    disabled={phase.kind === "paying"}
                    className="min-h-14 w-full rounded-full bg-green-800 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-green-900/25 transition hover:bg-green-900 disabled:opacity-60"
                  >
                    {phase.kind === "paying"
                      ? "Opening secure payment…"
                      : `${verb} ${treesLabel} · ${rupees(total)}`}
                  </button>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <LockIcon /> Secure payment by Razorpay · UPI, netbanking and
                  more
                </p>
              </form>
            ))}
        </div>

        {/* ── Story, wishes, album ───────────────────────────── */}
        <div className="order-2 min-w-0 space-y-12 lg:order-1">
          <section>
            <SectionTitle eyebrow="Simple and sweet">How it works</SectionTitle>
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
                  `${recipient} is told about the trees you gave, with your wish.`,
                ],
              ].map(([icon, title, body], i) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:block"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                    <span aria-hidden>{icon}</span>
                  </div>
                  <div className="sm:mt-3">
                    <p className="font-bold text-gray-900">
                      <span className="mr-1.5 text-green-700">{i + 1}.</span>
                      {title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {page.messages.length > 0 && (
            <section>
              <SectionTitle eyebrow="Kind words">
                Wishes for {recipient}
              </SectionTitle>
              <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
                {page.messages.map((m, i) => (
                  <li
                    key={i}
                    className={`relative w-[82%] shrink-0 snap-center rounded-3xl p-5 shadow-sm ring-1 sm:w-auto ${
                      WISH_TINTS[i % WISH_TINTS.length]
                    }`}
                  >
                    <span
                      aria-hidden
                      className="absolute right-5 top-2 font-serif text-6xl leading-none text-green-100"
                    >
                      ”
                    </span>
                    <p className="relative whitespace-pre-line text-gray-800">
                      {m.message}
                    </p>
                    <div className="mt-4 flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-200 text-xs font-bold text-green-900">
                        {initials(m.name)}
                      </span>
                      <span className="text-sm font-semibold text-gray-600">
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
              <SectionTitle eyebrow="From the celebration">
                Memories
              </SectionTitle>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {page.album.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    aria-label={`Open photo ${i + 1}`}
                    className={`group overflow-hidden rounded-2xl ${
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
              className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-5 text-white shadow-lg shadow-green-900/20 transition active:scale-[0.99]"
            >
              <span>
                <span className="block text-lg font-bold">
                  See the event page
                </span>
                <span className="text-sm text-green-100">
                  Photos, wishes and the trees planted so far
                </span>
              </span>
              <span aria-hidden className="text-3xl">
                →
              </span>
            </a>
          )}
        </div>
      </div>

      {/* ── Sticky gift bar (mobile) ─────────────────────────── */}
      {showGiftBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="min-w-0 leading-tight">
              <p className="text-xs text-gray-500">{treesLabel}</p>
              <p className="text-xl font-extrabold text-green-900">
                {rupees(total)}
              </p>
            </div>
            <button
              type="submit"
              form="gift-form"
              disabled={phase.kind === "paying"}
              className="min-h-12 flex-1 rounded-full bg-green-800 px-5 py-3 text-base font-bold text-white shadow-lg shadow-green-900/25 transition active:scale-[0.98] disabled:opacity-60"
            >
              {phase.kind === "paying" ? "Opening payment…" : `${verb} now`}
            </button>
          </div>
        </div>
      )}

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 50 && page.album.length > 1)
              goTo(dx < 0 ? 1 : -1);
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.album[lightbox].image_url}
            alt=""
            className="max-h-full max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {page.album.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white hover:bg-white/30 sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(-1);
                }}
              >
                ‹
              </button>
              <button
                aria-label="Next photo"
                className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 rounded-full bg-white/20 text-2xl text-white hover:bg-white/30 sm:block"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(1);
                }}
              >
                ›
              </button>
              <p className="absolute bottom-5 left-0 right-0 text-center text-sm text-white/70">
                {lightbox + 1} / {page.album.length}
              </p>
            </>
          )}
          <button
            aria-label="Close"
            className="absolute right-3 top-3 h-11 w-11 rounded-full bg-white/20 text-xl text-white hover:bg-white/30"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

function SectionTitle({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
        {children}
      </h2>
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
      className={`rounded-3xl p-6 text-center shadow-xl shadow-green-900/5 ring-1 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

function StepCard({
  n,
  title,
  hint,
  optional,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="relative overflow-hidden rounded-3xl bg-white p-5 pt-6 shadow-lg shadow-green-900/5 ring-1 ring-black/5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-green-700 via-emerald-500 to-lime-400"
      />
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-700 to-emerald-500 text-sm font-bold text-white shadow">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-snug text-gray-900">
            {title}
            {optional && (
              <span className="ml-2 align-middle text-xs font-medium text-gray-400">
                optional
              </span>
            )}
          </h2>
          {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
        </div>
      </div>
      {children}
    </fieldset>
  );
}

function Check({
  checked,
  onChange,
  label,
  invalid,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  invalid?: boolean;
}) {
  return (
    <label className="flex min-h-6 cursor-pointer items-start gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        className="mt-0.5 h-5 w-5 shrink-0 accent-green-800"
      />
      <span>{label}</span>
    </label>
  );
}

function Err({ text }: { text: string }) {
  return <p className="mt-1.5 text-sm text-red-600">{text}</p>;
}

function Spinner({ small }: { small?: boolean }) {
  return (
    <div
      className={`animate-spin rounded-full border-green-100 border-t-green-700 ${
        small ? "inline-block h-4 w-4 border-2" : "mx-auto h-10 w-10 border-4"
      }`}
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
  inputMode?: "text" | "email" | "tel" | "numeric";
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
          <span className="ml-1.5 text-xs font-normal text-gray-400">
            optional
          </span>
        )}
      </label>
      <input
        id={props.id}
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        value={props.value}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        aria-invalid={!!props.error}
        onChange={(e) => props.onChange(e.target.value)}
        className={`${INPUT_BASE} ${props.error ? INPUT_BAD : INPUT_OK}`}
      />
      {props.error && <Err text={props.error} />}
    </div>
  );
}
