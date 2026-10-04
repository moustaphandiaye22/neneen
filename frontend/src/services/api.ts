const apiBase = import.meta.env.VITE_API_URL || '/api'
export function apiUrl(path: string) {
  return `${apiBase}${path}`
}
let refreshPromise: Promise<string | null> | null = null
async function refreshAccess() {
  if (!refreshPromise)
    refreshPromise = fetch(apiUrl('/auth/refresh'), { method: 'POST', credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return null
        const result = (await response.json()) as { token: string; user: unknown }
        localStorage.setItem('neneen_token', result.token)
        localStorage.setItem('neneen_user', JSON.stringify(result.user))
        dispatchEvent(new Event('neneen-session'))
        return result.token
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  return refreshPromise
}
export async function api<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const execute = (sessionToken: string | null) =>
    fetch(apiUrl(path), {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...options.headers,
      },
    })
  let response: Response
  try {
    response = await execute(token)
    if (response.status === 401 && token && !path.startsWith('/auth/')) {
      const refreshed = await refreshAccess()
      if (refreshed) response = await execute(refreshed)
    }
  } catch {
    throw new Error('Le serveur est injoignable. Vérifiez que l’API est démarrée et réessayez.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const issues = Array.isArray(body.issues)
      ? body.issues
          .map((issue: { message?: unknown }) => issue.message)
          .filter((message: unknown): message is string => typeof message === 'string')
      : []
    throw new Error(
      issues.length
        ? [...new Set(issues)].join('\n')
        : typeof body.message === 'string'
          ? body.message
          : 'La demande n’a pas pu aboutir. Réessayez.',
    )
  }
  return body as T
}
