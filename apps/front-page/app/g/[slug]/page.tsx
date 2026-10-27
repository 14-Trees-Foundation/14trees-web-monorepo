import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PublicGiftingPage } from "~/api/giftingTypes";
import GiftingPageView from "./GiftingPageView";

// Unlisted page: reachable only through its QR code / link. Rendered on demand
// and cached for a minute, matching the backend's own 60 s cache, so a burst of
// guests scanning a QR never fans out to the API.
export const revalidate = 60;

async function loadPage(slug: string): Promise<PublicGiftingPage | null> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${base}/gifting-pages/by-slug/${encodeURIComponent(slug.toLowerCase())}`,
    { next: { revalidate: 60 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Gifting page request failed (${res.status})`);
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await loadPage(params.slug).catch(() => null);
  if (!page) return { title: "Gift a tree | 14 Trees", robots: { index: false, follow: false } };
  const description = `Gift a tree to celebrate ${page.recipient_display_name}. Each tree is planted and cared for by 14 Trees Foundation.`;
  return {
    title: `${page.title} | 14 Trees`,
    description,
    // Never indexed: the link is meant to be shared, not discovered.
    robots: { index: false, follow: false },
    openGraph: {
      title: page.title,
      description,
      type: "website",
      images: page.cover_image_url ? [{ url: page.cover_image_url }] : undefined,
    },
  };
}

export default async function GiftingPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await loadPage(params.slug);
  if (!page) notFound();
  return (
    <Suspense fallback={null}>
      <GiftingPageView page={page} />
    </Suspense>
  );
}
