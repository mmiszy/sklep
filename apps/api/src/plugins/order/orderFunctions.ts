import type { Request } from '@hapi/hapi';
import type { InputJsonObject } from '@prisma/client';
import type Stripe from 'stripe';

import { Enums } from '../../models';

export async function createOrder(
  request: Request,
  {
    cartJson,
    cartTotal,
    paymentIntentId,
  }: {
    readonly cartJson: InputJsonObject;
    readonly cartTotal: number;
    readonly paymentIntentId: string;
  },
) {
  const order = await request.server.app.db.order.create({
    data: {
      cart: cartJson,
      total: cartTotal,
      stripePaymentIntentId: paymentIntentId,
      status: Enums.OrderStatus.PENDING,
    },
  });

  request.server.events.emit('order:order:created', order);

  return order;
}

const stripeWebhookEventToOrderStatus = {
  'payment_intent.created': Enums.OrderStatus.PENDING,
  'payment_intent.processing': Enums.OrderStatus.PROCESSING,
  'payment_intent.succeeded': Enums.OrderStatus.COMPLETED,
  'payment_intent.canceled': Enums.OrderStatus.CANCELLED,
  'payment_intent.requires_action': Enums.OrderStatus.ON_HOLD,
  'payment_intent.payment_failed': Enums.OrderStatus.FAILED,
} as const;

export function updateOrderStatusForStripeEvent(
  request: Request,
  paymentIntent: Stripe.PaymentIntent,
  eventType: keyof typeof stripeWebhookEventToOrderStatus,
) {
  const orderStatus = stripeWebhookEventToOrderStatus[eventType];

  if (!orderStatus) {
    return;
  }

  return request.server.app.db.order.update({
    data: {
      status: orderStatus,
    },
    where: {
      stripePaymentIntentId: paymentIntent.id,
    },
  });
}

export function handleStripeEvent(request: Request, event: Stripe.Event) {
  const eventType = event.type;
  switch (eventType) {
    case 'payment_intent.created':
    case 'payment_intent.processing':
    case 'payment_intent.succeeded':
    case 'payment_intent.canceled':
    case 'payment_intent.requires_action':
      return updateOrderStatusForStripeEvent(
        request,
        event.data.object as Stripe.PaymentIntent,
        eventType,
      );
  }
  return null;
}