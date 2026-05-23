/** True when the browser is on the public kiosk page (/kiosk). */
export function isPublicKioskPage(): boolean {
  return typeof window !== 'undefined' && window.location.pathname === '/kiosk'
}

/** Fetch with kiosk-view header so server prefers kiosk plugin access over login session. */
export function kioskAwareFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (!isPublicKioskPage()) return fetch(input, init)
  const headers = new Headers(init.headers)
  headers.set('X-SD-Kiosk-View', '1')
  return fetch(input, {
    ...init,
    credentials: init.credentials ?? 'same-origin',
    headers,
  })
}

export const kioskFetch: RequestInit = {
  cache: 'no-store',
  credentials: 'same-origin',
}

export function kioskPageFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-SD-Kiosk-View', '1')
  return fetch(input, {
    ...init,
    cache: init.cache ?? 'no-store',
    credentials: init.credentials ?? 'same-origin',
    headers,
  })
}
