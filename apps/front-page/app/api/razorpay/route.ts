import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action, ...requestData } = await req.json();

    // Handle payment creation
    if (action === 'create') {
      const {
        amount,
        donorType,
        panNumber,
        fullName,
        email,
        phone,
        numberOfTrees,
        treeLocation
      } = requestData;

      // 1. Create Razorpay order
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_TOKEN}`
        },
        body: JSON.stringify({
          amount: amount * 100,
          donor_type: donorType,
          pan_number: panNumber,
          customer_details: { fullName, email, phone },
          metadata: { treeCount: numberOfTrees, location: treeLocation }
        })
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || "Payment creation failed");
      }

      const orderData = await orderResponse.json();
      return NextResponse.json({
        orderId: orderData.order_id,
        //razorpayKey: process.env.RAZORPAY_KEY_ID
      });
    }

    // Handle payment verification
    if (action === 'verify') {
      const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_TOKEN}`
        },
        body: JSON.stringify(requestData)
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.message || "Verification failed");
      }
      return NextResponse.json({ success: true });
    }

    throw new Error("Invalid action");

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Processing failed" },
      { status: err.message === "Invalid action" ? 400 : 500 }
    );
  }
}