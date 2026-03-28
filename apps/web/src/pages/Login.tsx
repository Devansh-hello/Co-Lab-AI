import type React from "react"
import { useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { sendLogin } from "../functions/send"
import { useAuth } from "../context/AuthContext"
import { useGoogleAuth } from "../hooks/use-google-auth"
import toast from "react-hot-toast"
import { Loader2 } from "lucide-react"
import { AuthLayout } from "../components/AuthLayout"

const INPUT_CLS = "w-full h-11 px-4 rounded-xl glass-input text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:shadow-input-focus focus:!border-[#D4AF37]/40"

function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const passRef = useRef<HTMLInputElement>(null)
  const { googleButtonRef } = useGoogleAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await sendLogin(email.trim(), password)
      if (response && response.status == 200) {
        toast.success("Login successful!")
        await refresh()
        setTimeout(() => navigate("/projects"), 1000)
      } else {
        toast.error(response?.res?.message || "Login failed")
      }
    } catch (err) {
      console.error("[login]", err)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      label="Sign in"
      title="Welcome back"
      subtitle="Sign in to continue building"
      artSrc="/ART/golden-door.jpg"
      footer={
        <p className="text-[13px]">
          <span className="text-white/30">Don't have an account?</span>{" "}
          <Link to="/signup" className="text-[#D4AF37]/80 hover:text-[#D4AF37] font-semibold transition-colors">
            Create one
          </Link>
        </p>
      }
    >
      {/* Google OAuth — renders Google's official button (handles FedCM + popup compat) */}
      <div className="auth-stagger" style={{ "--i": 2 } as React.CSSProperties}>
        <div className="relative w-full h-11 rounded-xl overflow-hidden">
          {/* Visual layer — our styled button */}
          <div className="absolute inset-0 glass-input hover:bg-white/[0.08] flex items-center justify-center gap-3 text-[13px] text-white/70 font-medium pointer-events-none z-0">
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </div>
          {/* Functional layer — Google's real button (invisible, receives clicks) */}
          <div
            ref={googleButtonRef}
            className="absolute inset-0 z-10 opacity-[0.01] cursor-pointer [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="auth-stagger flex items-center gap-4 my-6" style={{ "--i": 3 } as React.CSSProperties}>
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-bold font-mono">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="auth-stagger" style={{ "--i": 4 } as React.CSSProperties}>
          <label htmlFor="email" className="block text-[11px] font-mono font-bold text-white/40 tracking-[0.1em] uppercase mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyUp={(e) => { if (e.key === "Enter") passRef.current?.focus() }}
            disabled={isLoading}
            className={INPUT_CLS}
          />
        </div>

        <div className="auth-stagger" style={{ "--i": 5 } as React.CSSProperties}>
          <label htmlFor="password" className="block text-[11px] font-mono font-bold text-white/40 tracking-[0.1em] uppercase mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Your password"
            ref={passRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className={INPUT_CLS}
          />
        </div>

        {/* Submit */}
        <div className="auth-stagger" style={{ "--i": 6 } as React.CSSProperties}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 rounded-xl bg-[#D4AF37] hover:bg-[#E0C050] text-black font-bold text-[13px] tracking-[-0.01em] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shine-gold glow-gold-strong"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

export default Login
