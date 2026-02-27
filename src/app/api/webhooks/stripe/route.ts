import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const TIER_MAP: Record<string, 'STARTER' | 'PRO' | 'ENTERPRISE'> = {
  [process.env.STRIPE_STARTER_PRICE_ID || '']: 'STARTER',
  [process.env.STRIPE_PRO_PRICE_ID || '']: 'PRO',
  [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'ENTERPRISE',
};

const TIER_LIMITS: Record<string, { maxUsers: number; maxTendersMonth: number }> = {
  STARTER: { maxUsers: 1, maxTendersMonth: 5 },
  PRO: { maxUsers: 5, maxTendersMonth: 25 },
  ENTERPRISE: { maxUsers: 999, maxTendersMonth: 9999 },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      const org = await db.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (org) {
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id || '';
        const tier = TIER_MAP[priceId] || 'STARTER';
        const limits = TIER_LIMITS[tier];

        await db.organization.update({
          where: { id: org.id },
          data: {
            tier,
            subscriptionId,
            subscriptionEnd: new Date(subscription.current_period_end * 1000),
            maxUsers: limits.maxUsers,
            maxTendersMonth: limits.maxTendersMonth,
          },
        });

        // Update all org users' tier
        await db.user.updateMany({
          where: { organizationId: org.id },
          data: { tier },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price.id || '';
      const tier = TIER_MAP[priceId] || 'STARTER';
      const limits = TIER_LIMITS[tier];

      await db.organization.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          tier,
          subscriptionEnd: new Date(subscription.current_period_end * 1000),
          maxUsers: limits.maxUsers,
          maxTendersMonth: limits.maxTendersMonth,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await db.organization.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          tier: 'FREE',
          subscriptionId: null,
          subscriptionEnd: null,
          maxUsers: 5,
          maxTendersMonth: 2,
        },
      });

      // Downgrade users
      const org = await db.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        await db.user.updateMany({
          where: { organizationId: org.id },
          data: { tier: 'FREE' },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
