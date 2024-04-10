import { Orders } from "razorpay/dist/types/orders";
import { z } from "zod";

// Assuming ObjectId can be treated as a string for simplicity.
const ObjectIdSchema = z.string();

const ProjectSchema = z.object({
  id: z.string(),
  image: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
});

const OneTimeContributionSchema = z.object({
  captured: z.boolean(),
  orderId: z.string(),
  type: z.literal("one-time"),
  amount: z.number(),
  trees: z.number(),
});

const RecurringContributionSchema = z.object({
  captured: z.boolean(),
  orderId: z.string(),
  type: z.literal("recurring"),
  amount: z.number(),
  trees: z.number(),
});

const LargeContributionSchema = z.object({
  captured: z.boolean(),
  type: z.literal("large"),
  notes: z.string(),
  trees: z.number(),
});

const CsrContributionSchema = z.object({
  type: z.literal("csr"),
  notes: z.string(),
});

const BaseOrderSchema = z.object({
  currency: z.union([z.literal("INR"), z.literal("USD")]),
  date: z.date(),
  status: z.union([z.literal("created"), z.literal("captured")]),
});

const ContributionTypeSchema = z.union([
  OneTimeContributionSchema,
  RecurringContributionSchema,
  LargeContributionSchema,
  CsrContributionSchema,
]);

const ContributionSchema = z.object({
  campaign: z.string(),
  source: z.string(),
  plantation: z.union([
    z.literal("foundation"),
    z.literal("public"),
    z.literal("farmland"),
  ]),
  purpose: z.string(),
  emailSent: z.boolean(),
  assignment_names: z.array(z.string()).optional(),
  order: z.nullable(ContributionTypeSchema.and(BaseOrderSchema)),
  donor: ObjectIdSchema.optional(),
});

const ContributionUserSchema = z.object({
  name: z.string(),
  userid: z.string(),
  phone: z.string(),
  email: z.string(),
  pan: z.string(),
  org: z.string().optional(),
  dob: z.date().optional(),
  comms: z.object({
    visit: z.boolean(),
    volunteer: z.boolean(),
    updates: z.boolean(),
  }),
  parent: ObjectIdSchema.optional(),
});

const DonorSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  pan: ContributionUserSchema.shape.pan,
  email_id: ContributionUserSchema.shape.email,
  phone: ContributionUserSchema.shape.phone,
  comms: ContributionUserSchema.shape.comms,
});

const VerificationResponseSchema = z.object({
  status: z.union([
    z.literal("success"),
    z.literal("failed"),
    z.literal("invalid"),
  ]),
  message: z.string(),
  emailSent: ContributionSchema.shape.emailSent,
  orderId: z.string().optional(),
  userid: ContributionUserSchema.shape.userid.optional(),
  paymentId: z.string().optional(),
});

const ContributeRequestSchema = z.object({
  contribution: ContributionSchema,
  donor: DonorSchema,
});

// For PaymentOrder, assuming Orders.RazorpayOrder can be represented or validated separately.
const PaymentOrderSchema = z.object({
  status: z.union([
    z.literal("created"),
    z.literal("captured"),
    z.literal("failed"),
  ]),
  emailStatus: z.union([z.literal("sent"), z.literal("not sent")]),
  order: z.any(), // You might need a specific schema or validation for RazorpayOrder.
  contribution: ContributionSchema,
  donor: DonorSchema,
});

const RazorpayResponseSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
});

type ContributeRequest = z.infer<typeof ContributeRequestSchema>;
type ContributionUser = z.infer<typeof ContributionUserSchema>;
type Contribution = z.infer<typeof ContributionSchema>;
type PaymentOrder = z.infer<typeof PaymentOrderSchema>;
type VerificationResponse = z.infer<typeof VerificationResponseSchema>;
type RazorpayResponse = z.infer<typeof RazorpayResponseSchema>;
type Donor = z.infer<typeof DonorSchema>;
type Project = z.infer<typeof ProjectSchema>;
type ContributionType = z.infer<typeof ContributionTypeSchema>;

export type {
  Donor,
  Project,
  Contribution,
  ContributionType,
  ContributeRequest,
  ContributionUser,
  VerificationResponse,
  PaymentOrder,
  RazorpayResponse,
};
