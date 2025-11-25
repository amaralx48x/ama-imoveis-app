import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function POST(req: Request) {
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
    console.error('create-checkout-session error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
