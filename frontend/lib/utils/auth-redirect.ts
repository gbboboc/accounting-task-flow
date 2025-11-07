/**
 * Get the redirect URL for Supabase auth callbacks
 * Uses NEXT_PUBLIC_SITE_URL if set, otherwise falls back to window.location.origin
 * 
 * @param next - The path to redirect to after authentication (default: "/dashboard")
 * @returns The full redirect URL including the callback route
 */
export function getAuthRedirectUrl(next: string = "/dashboard"): string {
  if (typeof window !== "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    return `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`
}

