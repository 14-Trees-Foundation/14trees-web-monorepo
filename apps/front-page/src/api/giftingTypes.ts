// Public gifting page contract (14trees-backend GET /gifting-pages/by-slug/:slug).
export interface PublicGiftingPage {
  slug: string;
  status: "draft" | "active" | "closed";
  accepting: boolean;
  title: string;
  occasion_type: string;
  description: string | null;
  cover_image_url: string | null;
  recipient_display_name: string;
  occasion_date: string;
  starts_at: string | null;
  ends_at: string | null;
  price_per_tree: number;
  suggested_counts: number[];
  max_trees_per_contribution: number;
  message_max_chars: number;
  // Keys of the sections to render; set by the backend per page.
  sections: string[];
  target_trees: number | null;
  trees_so_far: number;
  album: { image_url: string }[];
  messages: { name: string | null; message: string }[];
  memories_link: string | null;
}

export interface GiftingOrderInput {
  trees_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  pan_number: string;
  consent: boolean;
  message?: string;
  show_name: boolean;
  source: "qr" | "link";
}

export interface GiftingOrder {
  contribution_id: number;
  payment_id: number;
  order_id: string;
  amount: number;
  currency: "INR";
  trees_count: number;
  price_per_tree: number;
  razorpay_key_id: string;
}

export type GiftingOutcome =
  | "fulfilled"
  | "paid"
  | "pending"
  | "mismatch"
  | "skipped";

export interface GiftingConfirmResult {
  contribution_id: number;
  status: string;
  trees_count: number;
  amount: number;
  outcome: GiftingOutcome;
  // Present once the payment is confirmed and no photo is attached yet.
  photo_upload_token?: string;
}
