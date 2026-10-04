import assert from 'node:assert/strict'

const base = process.env.SMOKE_URL || 'http://localhost:15173'
for (const path of ['/api/health', '/api/ready', '/api/products', '/api/activities']) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) })
  assert.equal(response.status, 200, path)
  assert.match(response.headers.get('content-type'), /application\/json/, path)
  const body = await response.json()
  if (path === '/api/products') assert.ok(Array.isArray(body.products))
  if (path === '/api/activities') assert.ok(Array.isArray(body.activities))
}
const page = await fetch(base)
assert.equal(page.status, 200)
const html = await page.text()
assert.match(html, /id="root"/)
const script = html.match(/src="(\/assets\/[^" ]+\.js)"/)
assert.ok(script, 'Vite JS bundle missing')
const asset = await fetch(`${base}${script[1]}`)
assert.equal(asset.status, 200)
assert.match(asset.headers.get('cache-control'), /immutable/)
assert.equal((await fetch(`${base}/assets/not-a-real-file.js`)).status, 404)
const unknownApi = await fetch(`${base}/api/not-a-real-route`)
assert.ok([401, 404].includes(unknownApi.status))
assert.match(unknownApi.headers.get('content-type'), /application\/json/)
for (const path of [
  '/images/payments/wave.png',
  '/images/brand/logo.png',
  '/images/products/build-different.jpg',
]) {
  const response = await fetch(`${base}${path}`)
  assert.equal(response.status, 200, path)
  assert.match(response.headers.get('content-type'), /^image\//, path)
}
// Exercise auth through Nginx and PostgreSQL, without external email/payment services.
const response = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'smoke@example.com', password: 'not-a-real-password' }),
})
assert.equal(response.status, 401, 'Unknown account must be rejected')
console.log('Docker smoke: Nginx, API, migrations, database, auth and static assets OK')
