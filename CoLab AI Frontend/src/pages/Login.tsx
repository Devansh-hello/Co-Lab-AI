"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Header } from "../components/header"
import { sendLogin } from "../functions/send"
import { useAuth } from "../context/AuthContext"
import toast, { Toaster } from "react-hot-toast"
import { Mail, Lock, LogIn, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"

const TOAST_ERROR_STYLE = {
  style: { border: "1px solid #713200", padding: "16px", color: "#713200", background: "#FFFAEE" },
  iconTheme: { primary: "#713200", secondary: "#FFFAEE" },
} as const

const TOAST_SUCCESS_STYLE = {
  style: { border: "1px solid #059669", padding: "16px", color: "#059669", background: "#FFFAEE" },
  iconTheme: { primary: "#059669", secondary: "#FFFAEE" },
} as const

function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const passRef = useRef<HTMLInputElement>(null)

  async function handleinput() {
    if (!email || !password) {
      toast.error("Please fill in all fields", TOAST_ERROR_STYLE)
      return
    }

    setIsLoading(true)

    try {
      const response = await sendLogin(email.trim(), password)

      if (response && response.status == 200) {
        toast.success("Login successful!", TOAST_SUCCESS_STYLE)
        await refresh()
        setTimeout(() => {
          navigate("/projects")
        }, 1000)
      } else {
        toast.error(response?.res?.message || "Login failed", TOAST_ERROR_STYLE)
      }
    } catch (err) {
      console.error("[login]", err)
      toast.error("An error occurred. Please try again.", TOAST_ERROR_STYLE)
    } finally {
      setIsLoading(false)
    }
  }

  function onInputKeyHandler(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      passRef.current?.focus()
    }
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleinput()
    }
  }

  return (
    <div className="flex flex-col grow p-6 gap-6 items-center align-middle min-h-screen w-screen bg-background bg-grainy">
      <Toaster position="bottom-right" reverseOrder={false} />
      <Header />

      <div className="flex flex-col w-full h-full items-center justify-center">
        <Card className="w-full max-w-md shadow-gold-glow border-primary/20 bg-card/90 backdrop-blur-sm rounded-[2.5rem]">
          <CardHeader className="flex flex-col items-center gap-2 pb-8 pt-8">
            <div className="flex items-center gap-3">
              <LogIn className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl font-bold tracking-wide text-foreground">Welcome Back</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-background/50 focus-visible:ring-primary h-12 font-mono text-base rounded-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyUp={onInputKeyHandler}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-background/50 focus-visible:ring-primary h-12 font-mono text-base rounded-full"
                  ref={passRef}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={onInputKey}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button
              className="w-full h-12 text-lg shadow-gold-glow hover:bg-gold-600 transition-bouncy hover:scale-105 hover:-translate-y-1 font-bold rounded-full"
              onClick={handleinput}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:text-gold-400 font-bold transition-colors">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login
