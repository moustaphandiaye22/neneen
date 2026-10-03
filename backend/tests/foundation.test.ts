import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import express from 'express'
import { z } from 'zod'
import { parseEnvironment } from '../src/config/environment.js'
import { handleError } from '../src/errors/handleError.js'
import { httpError } from '../src/errors/httpError.js'

const validEnvironment = {
  DATABASE_URL: 'postgresql://user:password@localhost/neneen',
  JWT_SECRET: 'a'.repeat(32),
}

test('configuration : valeurs par défaut et port valide', () => {
  assert.equal(parseEnvironment(validEnvironment).PORT, 4000)
  assert.equal(parseEnvironment({ ...validEnvironment, PORT: '8080' }).PORT, 8080)
})

test('configuration : rejette les protocoles et ports invalides sans exposer les secrets', () => {
  for (const override of [
    { PORT: '65536' },
    { PORT: '0' },
    { PORT: 'abc' },
    { DATABASE_URL: 'https://secret.example' },
    { FRONTEND_URL: 'ftp://localhost' },
    { JWT_SECRET: 'secret' },
  ]) {
    assert.throws(
      () => parseEnvironment({ ...validEnvironment, ...override }),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /Configuration invalide/)
        assert.ok(!error.message.includes('secret'))
        return true
      },
    )
  }
})

test('erreurs métier : statuts HTTP contrôlés', () => {
  assert.equal(httpError(409, 'Complet').status, 409)
  for (const status of [200, 600, NaN, 400.5]) {
    assert.throws(() => httpError(status, 'Erreur'), RangeError)
  }
})

test('HTTP : erreurs métier, validation, JSON, taille et erreurs internes', async () => {
  const app = express()
  app.use(express.json({ limit: '1kb' }))
  app.post('/json', (_req, res) => res.json({ ok: true }))
  app.get('/business', () => {
    throw httpError(409, 'Activité complète.')
  })
  app.get('/validation', () => {
    z.string().parse(42)
  })
  app.get('/internal', () => {
    throw Object.assign(new Error('secret interne'), { status: 200 })
  })
  app.use(handleError)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const base = `http://127.0.0.1:${address.port}`
  try {
    const business = await fetch(`${base}/business`)
    assert.equal(business.status, 409)
    assert.deepEqual(await business.json(), { message: 'Activité complète.' })
    assert.equal((await fetch(`${base}/validation`)).status, 400)
    const internal = await fetch(`${base}/internal`)
    assert.equal(internal.status, 500)
    assert.deepEqual(await internal.json(), { message: 'Erreur interne du serveur.' })
    for (const [body, expectedStatus] of [
      ['{', 400],
      [JSON.stringify({ text: 'x'.repeat(2000) }), 413],
    ] as const) {
      const response = await fetch(`${base}/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      assert.equal(response.status, expectedStatus)
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    )
  }
})
