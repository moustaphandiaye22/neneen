import assert from 'node:assert/strict'
import test from 'node:test'
import { createPaymentService } from '../src/domains/payments/paymentService.js'
import { createAuthService } from '../src/domains/auth/authService.js'
import { createNotificationService } from '../src/domains/notifications/notificationService.js'
import { createContentService } from '../src/domains/content/contentService.js'
import {
  assertCancellationAllowed,
  assertOrderTransition,
  mergeCartLines,
} from '../src/domains/commerce/commercePolicy.js'
import type { paymentRepository } from '../src/domains/payments/paymentRepository.js'
import type { authRepository } from '../src/domains/auth/authRepository.js'
import type { notificationRepository } from '../src/domains/notifications/notificationRepository.js'
import type { contentRepository } from '../src/domains/content/contentRepository.js'
import type { PaymentProvider } from '../src/domains/payments/paymentProvider.js'

test('policy: cancellation boundary, order transitions and cart merge', () => {
  assert.doesNotThrow(() => assertCancellationAllowed(new Date(Date.now() + 8 * 86400000)))
  assert.throws(() => assertCancellationAllowed(new Date(Date.now() + 6 * 86400000)))
  assert.doesNotThrow(() => assertOrderTransition('PAID', 'PROCESSING', false))
  assert.throws(() => assertOrderTransition('PENDING', 'SHIPPED', false))
  assert.deepEqual(
    mergeCartLines(
      [{ productId: 'a', size: 'M', quantity: 2 }],
      [{ productId: 'a', size: 'M', quantity: 3 }],
    ),
    [{ productId: 'a', size: 'M', quantity: 5 }],
  )
})
test('payment service: same idempotency key returns existing checkout without calling provider twice', async () => {
  const payment = { id: 'one', amount: 5000, status: 'PENDING' }
  let calls = 0
  const repository = {
    prepare: async () => ({ payment, created: false }),
  } as unknown as typeof paymentRepository
  const provider = {
    create: async () => {
      calls++
      return { reference: 'ref', url: null }
    },
  } as unknown as PaymentProvider
  const service = createPaymentService(repository, {
    WAVE: provider,
    ORANGE_MONEY: provider,
    CARD: provider,
    CASH: provider,
  })
  const input = {
    bookingId: 'b',
    method: 'WAVE' as const,
    idempotencyKey: 'cc07fb0e-dda6-465f-809c-84452265d0dd',
  }
  assert.deepEqual(await service.initiate('u', input), payment)
  assert.equal(calls, 0)
})
test('auth service: unknown address gets the same password-reset response path', async () => {
  const repository = { findByEmail: async () => null } as unknown as typeof authRepository
  const passwords = { hash: async () => 'hash', verify: async () => false }
  const service = createAuthService(repository, passwords, 'x'.repeat(32), 'http://localhost:5173')
  await assert.doesNotReject(service.forgot('unknown@example.com'))
})
test('notification service: failed provider is retried and does not block next message', async () => {
  const events: string[] = []
  const repository = {
    releaseStuck: async () => undefined,
    claim: async () => [
      { id: '1', channel: 'EMAIL', attempts: 1, recipient: 'a', subject: 'a', body: 'a' },
      { id: '2', channel: 'EMAIL', attempts: 1, recipient: 'b', subject: 'b', body: 'b' },
    ],
    sent: async (id: string) => {
      events.push(`sent:${id}`)
    },
    retry: async (id: string) => {
      events.push(`retry:${id}`)
    },
  } as unknown as typeof notificationRepository
  const service = createNotificationService(repository, {
    EMAIL: {
      send: async (input) => {
        if (input.recipient === 'a') throw new Error('offline')
      },
    },
  })
  assert.equal(await service.dispatch(), 2)
  assert.deepEqual(events, ['retry:1', 'sent:2'])
})
test('content service: unpublished page is not returned', async () => {
  const repository = { get: async () => null } as unknown as typeof contentRepository
  const service = createContentService(repository)
  await assert.rejects(service.get('private'))
})
