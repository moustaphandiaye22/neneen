import { api } from './api'
export async function uploadImage(token: string, folder: 'activities' | 'products', file: File) {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)
    throw new Error('Choisissez une image de moins de 5 Mo.')
  const signature = await api<{
    cloudName: string
    apiKey: string
    folder: string
    timestamp: number
    signature: string
  }>('/admin/uploads/sign', token, { method: 'POST', body: JSON.stringify({ folder }) })
  const form = new FormData()
  form.set('file', file)
  form.set('api_key', signature.apiKey)
  form.set('timestamp', String(signature.timestamp))
  form.set('folder', signature.folder)
  form.set('signature', signature.signature)
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    { method: 'POST', body: form },
  )
  if (!response.ok) throw new Error('Impossible de charger l’image.')
  const result = (await response.json()) as { secure_url?: string }
  if (!result.secure_url?.startsWith(`https://res.cloudinary.com/${signature.cloudName}/`))
    throw new Error('URL de l’image invalide.')
  return result.secure_url
}
