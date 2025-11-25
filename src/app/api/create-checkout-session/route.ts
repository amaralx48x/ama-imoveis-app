import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Check for the secret key at the module level
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('CRITICAL: STRIPE_SECRET_KEY is not set in the environment.');
}

const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2024-06-20' });

export async function POST(req: Request) {
  // Explicitly check for the key within the request handler as well
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe secret key not configured on the server.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { priceId, customerEmail, userId } = body; 

    if (!priceId) {
      return NextResponse.json({ error: 'priceId é obrigatório' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/meu-plano`,
      metadata: { 
          userId: userId // Pass the userId to the webhook
      }, 
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('create-checkout-session error:', err);
    // Return a more structured error message
    return NextResponse.json({ error: `Stripe API Error: ${err.message}` }, { status: 500 });
  }
}
