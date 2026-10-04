import { cp, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const value = process.env.RENDER_API_ORIGIN
if (!value) throw new Error('Configurez RENDER_API_ORIGIN avec l’origine HTTPS du backend Render.')
const origin = new URL(value)
if (
  origin.protocol !== 'https:' ||
  origin.pathname !== '/' ||
  origin.search ||
  origin.hash ||
  origin.username ||
  origin.password
) {
  throw new Error(
    'RENDER_API_ORIGIN doit être une origine HTTPS, sans chemin /api ni identifiants.',
  )
}
execFileSync('npm', ['--workspace', '@neneen/contracts', 'run', 'build'], { stdio: 'inherit' })
execFileSync('npm', ['--prefix', 'frontend', 'run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: '/api' },
})
await mkdir('.vercel/output', { recursive: true })
await cp('frontend/dist', '.vercel/output/static', { recursive: true })
await writeFile(
  '.vercel/output/config.json',
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '/api/(.*)', dest: `${origin.origin}/api/$1` },
        {
          src: '/assets/(.*)',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        { src: '/index.html', headers: { 'Cache-Control': 'no-cache' }, continue: true },
        { handle: 'filesystem' },
        { src: '/assets/.*', status: 404 },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2,
  ) + '\n',
)
console.log('Vercel : frontend et proxy /api préparés.')
