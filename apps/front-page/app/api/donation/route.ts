import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const donationData = await req.json();

    // Validate required fields
    const requiredFields = ['request_id', 'user_id', 'category', 'created_by'];
    const missingFields = requiredFields.filter(field => !donationData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_TOKEN}`
      },
      body: JSON.stringify(donationData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Donation creation failed");
    }

    return NextResponse.json(await response.json());

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Donation processing failed" },
      { status: 500 }
    );
  }
}