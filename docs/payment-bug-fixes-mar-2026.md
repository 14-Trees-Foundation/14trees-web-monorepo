# Payment Status Bug Fixes — March 2026

## Overview

This document describes payment status bugs found in the 14Trees donation and gift card flows, what caused them, what was fixed, how each fix was tested, and what remains to be done.

It is written for both **non-technical readers** (product, ops, finance) who need to understand what was going wrong and what is now safe, and **technical readers** (developers) who need to understand the exact code changes made.

---

## Background — How Payments Work on 14Trees

When a user donates or gifts trees, the following happens:

1. The user fills out a form and clicks "Pay"
2. Our server creates a payment order with **Razorpay** (the payment gateway)
3. Razorpay's checkout dialog opens in the browser
4. The user enters card/UPI details and pays
5. Razorpay confirms the payment to the browser
6. Our browser code calls our server to update the database

The database stores whether a donation is `PendingPayment` or `Paid`. The backoffice team uses this status to process tree assignments, send acknowledgements, and issue 80G receipts.

---

## Problems Found

Two types of wrong data were observed in the database:

| Problem | What it means for the organisation |
|---|---|
| Razorpay shows payment captured, DB shows `PendingPayment` | Money was received but the system never processed it. Backoffice misses it. No 80G issued. Donor gets no acknowledgement. |
| DB shows `Paid`, but Razorpay never captured the payment | System processed a donation that was never actually paid. Trees may be assigned for free. Fake 80G may be issued. |

---

## Root Causes — Explained

### Bug 1 — System marked donations as paid even when payment verification failed

**What happened (non-technical):**
When Razorpay confirms a payment to the browser, our code was supposed to first check with our server: "Is this payment legitimate?" If the server said yes, it would then update the database. But due to a coding mistake, the database update happened *regardless* of what the server said — even if the verification failed or threw an error.

**What happened (technical):**
In `donate/page.tsx`, the success dialog and the `/donations/requests/payment-success` API call were placed **outside** the `try/catch` block wrapping `verifyRazorpayPayment()`. Any error thrown during verification was caught and logged, but execution continued, always showing success and always calling payment-success.

```ts
// BEFORE — broken
try {
    await verifyRazorpayPayment(response);  // if this throws...
} catch (err) {
    console.error("Verification error:", err); // ...error is swallowed
}
// these always run, even if verification failed ↓
setShowSuccessDialog(true);
await fetch('.../donations/requests/payment-success', { ... });

// AFTER — fixed
try {
    await verifyRazorpayPayment(response);
    setShowSuccessDialog(true);             // only runs if verification succeeded
    await fetch('.../donations/requests/payment-success', { ... });
} catch (err) {
    alert('Payment verification failed. Please contact support.');
}
```

**Affected pages:** `/donate` (both payment flows on that page)

---

### Bug 2 — Gift card page showed success before verification even started

**What happened (non-technical):**
On the gift trees page (`/plant-memory`), the "Payment Successful" screen was being shown to the user *before* the system even asked the server to verify the payment. It was like printing the receipt before the cashier checked the money.

**What happened (technical):**
In `plant-memory/page.tsx`, `setRpPaymentSuccess(true)` and `setShowSuccessDialog(true)` were called at the very start of the Razorpay handler, *before* the `await` for verification. This means the UI showed success unconditionally.

```ts
// BEFORE — broken
handler: async (response) => {
    setRpPaymentSuccess(true);    // ← set before verification even starts
    try {
        setShowSuccessDialog(true); // ← shown before awaiting anything
        const verificationResponse = await fetch('.../payments/verify', { ... });
        if (!verificationResponse.ok) throw new Error("Verification failed");
    } catch (err) {
        console.error("Verification error:", err); // error swallowed, dialog already shown
    }
    await fetch('.../gift-cards/requests/payment-success', { ... }); // always runs
}

// AFTER — fixed
handler: async (response) => {
    try {
        const res = await fetch('.../gift-cards/requests/payment-success', {
            body: JSON.stringify({
                gift_request_id: responseData.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                user_email: formData.email,
            })
        });
        if (!res.ok) throw new Error("Payment verification failed");
        setRpPaymentSuccess(true);    // only set after server confirms
        setShowSuccessDialog(true);   // only shown after server confirms
    } catch (err) {
        alert('Payment verification failed. Please contact support.');
    }
}
```

---

### Bug 3 — Second gift card payment handler sent wrong data to the server

**What happened (non-technical):**
The gift trees page has two different payment flows (one for new requests, one for re-paying an existing request). The second flow was sending the wrong field names to the server when verifying the payment. The server never received the right data, so verification always failed silently. More critically, this flow never called the endpoint that marks the gift request as paid — so a successful payment through this path would always leave the gift request stuck in "Unverified" state permanently.

**What happened (technical):**
The second Razorpay handler in `plant-memory/page.tsx` sent `payment_id` and `signature` but the server reads `razorpay_payment_id` and `razorpay_signature`. Both fields arrived as `undefined` on the server.

```ts
// BEFORE — wrong field names, no payment-success call
body: JSON.stringify({
    payment_id: response.razorpay_payment_id,   // ← server reads razorpay_payment_id
    signature: response.razorpay_signature,      // ← server reads razorpay_signature
})
// no gift-cards/requests/payment-success call at all ← gift request never updated

// AFTER — correct field names, payment-success included
body: JSON.stringify({
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_order_id: response.razorpay_order_id,
    razorpay_signature: response.razorpay_signature,
    gift_request_id: responseData.id,
    user_email: formData.email,
})
```

---

### Bug 4 — Bank transfer payment records stored with missing payment method

**What happened (non-technical):**
When a donor pays via bank transfer (for large donations above ₹5 lakh), the system records the payment method as "Bank Transfer" in the database. Due to a variable name mismatch, this was always being saved as blank/null — making it impossible to tell how the payment was made by looking at the record.

**What happened (technical):**
`apiClient.ts` sent `payment_type` in the POST body, but `paymentController.ts` read `req.body.payment_method`. The mismatch meant `payment_method` was always `null` in the database.

```ts
// BEFORE — wrong key name
async createPaymentHistory(payment_id, payment_type, amount, payment_proof) {
    await this.api.post('/payments/history', { payment_id, payment_type, amount, payment_proof });
    //                                                    ↑ server expects payment_method
}

// AFTER — correct key name
async createPaymentHistory(payment_id, payment_method, amount, payment_proof) {
    await this.api.post('/payments/history', { payment_id, payment_method, amount, payment_proof });
}
```

---

### Bug 5 — Gift card server crashed when Razorpay credentials were wrong

**What happened (non-technical):**
When creating a new gift card request, the server tried to update the Razorpay order details in the background but used the wrong account credentials. This caused Razorpay to reject the call, which triggered an error that then tried to send a second error response to the user — but the response had already been sent. This double-response crashed the server process (nodemon restarted it).

**What happened (technical):**
In `createGiftCardRequest`, `res.json()` was called at line 265 to send the response. The `updateOrder` call below it used `new RazorpayService()` without a user email, causing a 401 from Razorpay. This 401 propagated to the outer `catch` which tried to call `res.json()` again → `ERR_HTTP_HEADERS_SENT` crash.

```ts
// BEFORE — post-response operations inside the main try/catch
try {
    // ...create gift card...
    res.status(200).json(giftCards);  // ← response sent here

    // if this throws, catch block tries to send another response ↓
    const razorpayService = new RazorpayService();  // wrong credentials → 401
    await razorpayService.updateOrder(...);

} catch (error) {
    res.status(500).json({ message: '...' });  // ← ERR_HTTP_HEADERS_SENT crash
}

// AFTER — post-response operations in setImmediate with their own error handling
try {
    // ...create gift card...
    res.status(200).json(giftCards);  // ← response sent, try/catch is done
} catch (error) {
    res.status(500).json({ message: '...' });  // ← only reachable before response
}

setImmediate(async () => {
    // background operations — each has its own try/catch, cannot affect response
    try {
        const userResp = await UserRepository.getUsers(...);
        const razorpayService = new RazorpayService(userResp.results[0]?.email);
        await razorpayService.updateOrder(...);
    } catch (error) {
        console.log("[ERROR]", "updateRazorpayOrder", error); // logged, not thrown
    }
});
```

---

### Bug 6 — Gift card payments always used production Razorpay account

**What happened (non-technical):**
14Trees has two Razorpay accounts — a test account (for internal testing) and a production account (for real donations). The system is supposed to use the test account when an internal team member (`@14trees.org` email) is testing. For gift card payments, this routing was broken — it always used the production account, even for test users. As a result, `getPayments()` always returned an authentication error for test users, `amountReceived` stayed 0, and gift requests were never marked as paid.

**What happened (technical):**
`new RazorpayService()` was called without a `userEmail` argument in both `paymentSuccessForGiftRequest` and `createGiftCardRequest`. The `getRazorpayConfig()` function requires the email to determine test vs production credentials.

```ts
// BEFORE — no email, always uses production credentials
const razorpayService = new RazorpayService();
const payments = await razorpayService.getPayments(payment.order_id); // 401 for test users

// AFTER — look up user email first, pass to service
const userResp = await UserRepository.getUsers(0, 1, [
    { columnField: 'id', operatorValue: 'equals', value: giftRequest.user_id }
]);
const userEmail = userResp.results[0]?.email;
const razorpayService = new RazorpayService(userEmail); // uses correct account
const payments = await razorpayService.getPayments(payment.order_id); // works correctly
```

---

### Bug 7 — Payment verification and DB update were two separate browser calls (race condition)

**What happened (non-technical):**
After a payment was completed, the browser was making two separate calls to our server: first to verify the payment, then to update the database. There was a window of time between these two calls where if the user's internet dropped, their browser crashed, or they closed the tab, the payment would be captured by Razorpay but our database would never be updated. The money would be received but the system would show the donation as unpaid.

**What happened (technical):**
The client called `POST /payments/verify` followed by `POST /donations/requests/payment-success`. These were two separate HTTP calls. The fix merges them: the payment-success endpoint now accepts and verifies the Razorpay signature itself, so the client only needs to make one call.

```ts
// BEFORE — two calls, gap between them is the risk window
await verifyRazorpayPayment(response);                  // Call 1: verify
await fetch('.../donations/requests/payment-success');  // Call 2: update DB
// ← if browser dies between call 1 and call 2, DB is never updated

// AFTER — one call does both
await fetch('.../donations/requests/payment-success', {
    body: JSON.stringify({
        donation_id: donId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        user_email: formData.email,
    })
});
// server verifies the signature first, then updates DB atomically
```

**Server-side verification added to `paymentSuccessForDonation` and `paymentSuccessForGiftRequest`:**
```ts
// New block added at the top of both endpoints
if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
    const razorpay = new RazorpayService(sponsorUser.email);
    if (!razorpay.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        res.status(400).json({ message: 'Payment verification failed' });
        return; // ← DB is never touched if signature is invalid
    }
}
// only reaches here if signature is valid (or bank transfer with no signature)
```

---

### Bug 8 — Bank transfer payment history rows were counted as received before admin verification

**What happened (non-technical):**
For large donations paid via bank transfer, a finance team member needs to manually verify that the money actually arrived in the bank account. Until then, the donation should stay in a "pending verification" state. However, the system was counting any bank transfer record — regardless of whether it had been verified — as money received. This could cause a donation to be marked as "Paid" before the funds were actually confirmed.

**What happened (technical):**
The `addPaymentHistory` endpoint inserted rows with no `status` field (null). The reconciliation filter `payment.status !== 'payment_not_received'` treated `null` as "received" since `null !== 'payment_not_received'` is `true` in JavaScript.

Two changes were made:

**Change 1 — Default status on insert:**
```ts
// BEFORE — no status set, null treated as received
const data: PaymentHistoryCreationAttributes = {
    payment_id: req.body.payment_id,
    amount: req.body.amount,
    payment_method: req.body.payment_method,
    // status not set → null
}

// AFTER — explicit pending status
const data: PaymentHistoryCreationAttributes = {
    payment_id: req.body.payment_id,
    amount: req.body.amount,
    payment_method: req.body.payment_method,
    status: 'pending_verification', // ← admin must flip to 'payment_received'
}
```

**Change 2 — Allowlist filter in reconciliation:**
```ts
// BEFORE — denylist: null, undefined, and any unknown status counted as received
if (payment.status !== 'payment_not_received') amountReceived += payment.amount;

// AFTER — allowlist: only explicitly confirmed rows count
if (payment.status === 'payment_received') amountReceived += payment.amount;
```

---

## Summary of All Files Changed

| File | What Changed |
|---|---|
| `apps/front-page/app/donate/page.tsx` | Bugs 1, 7 — Fail-closed verification, single atomic payment-success call (2 handlers) |
| `apps/front-page/app/plant-memory/page.tsx` | Bugs 2, 3, 7 — Fail-closed, wrong field names fixed, missing payment-success added, atomic call (2 handlers) |
| `apps/front-page/src/api/apiClient.ts` | Bug 4 — `payment_type` → `payment_method` |
| `apps/api/src/controllers/giftCardController.ts` | Bugs 5, 6, 7 — Crash fix, correct Razorpay account, atomic verification |
| `apps/api/src/controllers/donationsController.ts` | Bugs 7, 8 — Atomic verification, allowlist filter |
| `apps/api/src/controllers/paymentController.ts` | Bug 8 — Default `pending_verification` status on insert |

---

## Testing Done

Each fix was tested locally using Razorpay test keys (`rzp_test_...`) with the following scenarios:

| Test | Expected | Result |
|---|---|---|
| Donate happy path — valid card, complete payment | DB status = `Paid`, success dialog shown | ✅ Pass |
| Donate failure path — force verification to fail | Alert shown, no success dialog, DB stays `PendingPayment` | ✅ Pass |
| Gift card happy path — valid card, complete payment | `sponsorship_type = 'Donation Received'`, `amount_received` correct | ✅ Pass |
| Gift card failure path — force verification to fail | Alert shown, no success dialog, DB unchanged | ✅ Pass |
| Verify + DB update atomic (Fix 7) — force signature invalid on server | Server returns 400, DB never updated | ✅ Pass |
| Post-fix regression — full happy paths re-run after all fixes | Both donate and gift card flows paid correctly | ✅ Pass |

---

## What Is Still Pending (TODOs)

### TODO 1 — Gift card exact amount validation *(Low priority enhancement)*

**Who is at risk:** Backoffice team could accidentally process a gift request as fully paid when only a partial test/advance payment was recorded.

**What the problem is:**
The donation flow only marks a donation as `Paid` when the amount received exactly equals the amount pledged. The gift card flow marks a request as `'Donation Received'` if *any* amount greater than zero is recorded — even ₹1 against a ₹20,000 request.

**When this matters:**
- When bank transfer partial advances are recorded manually
- When test transactions are run against real gift requests
- When partial refund/credit scenarios arise in future

**What needs to change (`giftCardController.ts`):**
```ts
// CURRENT — any non-zero amount marks as fully received
if (amountReceived > 0) {
    sponsorshipType = 'Donation Received';
}

// PROPOSED — must match exact expected amount
const expectedAmount = (giftRequest.category === 'Public' ? 2000 : 3000) * giftRequest.no_of_cards;
if (amountReceived === expectedAmount) {
    sponsorshipType = 'Donation Received';
}
```

---

### TODO 2 — Razorpay Webhook for automatic recovery *(High priority)*

**Who is at risk:** Any donor whose browser crashes, tab closes, or internet drops after Razorpay captures the payment but before the browser finishes calling our server. Their money is taken but our system shows `PendingPayment`. Backoffice has no automated way to detect or recover these cases today.

**What the problem is:**
Even with the atomic fix (Bug 7), there is still a small window where the browser could fail between Razorpay confirming the payment and our server receiving the call. The only complete solution is for Razorpay to call our server directly when a payment is captured — a "webhook."

**How common is this?**
Rare in normal conditions, but more likely on mobile networks, slow connections, or when users navigate away quickly. Each occurrence means a donor has paid but their donation is stuck in pending indefinitely with no automatic resolution.

**What needs to be built:**
A new API endpoint `POST /api/payments/razorpay-webhook` that:

1. Razorpay calls this endpoint directly when any payment is captured (no browser involved)
2. The server verifies the call is genuinely from Razorpay using a webhook secret
3. Finds the donation or gift request linked to that payment
4. Runs the same reconciliation logic to mark it as paid

```ts
// New endpoint to be added in paymentRoutes.ts
routes.post('/razorpay-webhook', async (req, res) => {
    // 1. Verify the webhook signature from Razorpay
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    // verify HMAC...

    // 2. Handle payment.captured event
    if (req.body.event === 'payment.captured') {
        const orderId = req.body.payload.payment.entity.order_id;
        // find donation or gift request by order_id
        // run reconciliation → mark as Paid
    }

    res.status(200).send(); // must respond 200 or Razorpay will retry
});
```

**Configuration needed in Razorpay Dashboard:**
1. Go to Dashboard → Settings → Webhooks
2. Add URL: `https://api.14trees.org/api/payments/razorpay-webhook`
3. Select event: `payment.captured`
4. Copy the webhook secret and add to server `.env` as `RAZORPAY_WEBHOOK_SECRET`

**Why this is required even after all other fixes:**
All previous fixes depend on the browser successfully completing its job. The webhook is the server-to-server safety net that works even when the browser fails entirely.

---

## Glossary

| Term | Meaning |
|---|---|
| `PendingPayment` | Donation/gift request exists in DB but payment not yet confirmed |
| `Paid` | Payment confirmed and recorded |
| `Donation Received` | Gift card equivalent of Paid |
| `pending_verification` | Bank transfer recorded but not yet confirmed by finance team |
| `payment_received` | Bank transfer confirmed by finance team, counted towards amount |
| HMAC signature | A cryptographic proof from Razorpay that a payment response is genuine and untampered |
| Reconciliation | The process of calculating how much has been received and updating the donation/gift request status accordingly |
| Webhook | A server-to-server HTTP call — Razorpay calls our server directly when an event happens, no browser needed |
