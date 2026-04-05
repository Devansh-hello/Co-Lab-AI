import { useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { sendGoogleAuth } from "../functions/send"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

const TOAST_ERROR_STYLE = {
  style: { border: "1px solid #713200", padding: "16px", color: "#713200", background: "#FFFAEE" },
  iconTheme: { primary: "#713200", secondary: "#FFFAEE" },
} as const

const TOAST_SUCCESS_STYLE = {
  style: { border: "1px solid #059669", padding: "16px", color: "#059669", background: "#FFFAEE" },
  iconTheme: { primary: "#059669", secondary: "#FFFAEE" },
} as const

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            ux_mode?: 'popup' | 'redirect'
            login_uri?: string
          }) => void
          prompt: () => void
          renderButton: (
            element: HTMLElement,
            config: Record<string, unknown>
          ) => void
        }
      }
    }
  }
}

/**
 * Google auth hook that renders the official Google Sign-In button
 * into a container element via a ref callback.
 *
 * The official button handles all browser-specific flows internally
 * (FedCM on Chrome, popup on Firefox) without breaking on /gsi/transform.
 */
export function useGoogleAuth() {
  const router = useRouter()
  const { refresh } = useAuth()
  const initializedRef = useRef(false)
  const mountedRef = useRef<HTMLDivElement | null>(null)

  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    try {
      const result = await sendGoogleAuth(response.credential)

      if (result && result.status === 200) {
        toast.success("Signed in with Google!", TOAST_SUCCESS_STYLE)
        await refresh()
        setTimeout(() => router.push("/projects"), 1000)
      } else {
        toast.error(result?.res?.message || "Google sign-in failed", TOAST_ERROR_STYLE)
      }
    } catch {
      toast.error("Google sign-in failed. Please try again.", TOAST_ERROR_STYLE)
    }
  }, [router, refresh])

  /**
   * Ref callback — attach to a visible container div.
   * Uses redirect mode so COOP: same-origin (needed for WebContainers)
   * doesn't block the auth flow. Google redirects the entire page to
   * its auth screen and then POSTs back to our backend callback.
   */
  const googleButtonRef = useCallback((node: HTMLDivElement | null) => {
    if (!node || mountedRef.current === node) return
    mountedRef.current = node

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    const tryRender = () => {
      if (!window.google) return false

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          ux_mode: "redirect",
          login_uri: `${window.location.origin}/api/v1/auth/google/redirect`,
        })
        initializedRef.current = true
      }

      window.google.accounts.id.renderButton(node, {
        type: "standard",
        size: "large",
        theme: "filled_black",
        text: "continue_with",
        shape: "pill",
        width: node.offsetWidth,
      })
      return true
    }

    /* Google's script loads async — retry briefly if not ready yet */
    if (!tryRender()) {
      const interval = setInterval(() => {
        if (tryRender()) clearInterval(interval)
      }, 200)
      setTimeout(() => clearInterval(interval), 5000)
    }
  }, [handleGoogleResponse])

  return { googleButtonRef }
}
