import { api } from './api'
export const getContent = (slug: string) =>
  api<{ content: { slug: string; title: string; body: string } }>(`/content/${slug}`, null)
export const subscribeNewsletter = (email: string) =>
  api('/newsletter', null, { method: 'POST', body: JSON.stringify({ email }) })
