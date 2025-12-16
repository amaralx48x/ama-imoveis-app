
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('CRITICAL: STRIPE_SECRET_KEY is not set in the environment.');
}

const stripe = new Stripe(stripeSecretKey!, { apiVersion: '2024-06-20' });

export async function POST(req: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe secret key not configured on the server.' }, { status: 500 });
  }

  try {
    const { customerId } = await req.json();

    if (!customerId) {
        return NextResponse.json({ error: 'customerId é obrigatório' }, { status: 400 });
    }

    const headers = req.headers;
    const protocol = headers.get('x-forwarded-proto') || 'http';
    const host = headers.get('host');
    const returnUrl = `${protocol}://${host}/meu-plano`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (err: any) {
    console.error('create-portal-session error:', err);
    return NextResponse.json({ error: `Stripe API Error: ${err.message}` }, { status: 500 });
  }
}
