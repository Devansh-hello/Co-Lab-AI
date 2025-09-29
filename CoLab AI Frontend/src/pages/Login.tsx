"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Header } from "../components/header"
import { sendLogin } from "../functions/send"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"
import { Mail, Lock, LogIn, Loader2 } from "lucide-react"

function Login() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  async function handleinput() {
    const email = emailRef.current?.value ?? ""
    const password = passRef.current?.value ?? ""

    if (!email || !password) {
      toast.error("Please fill in all fields", {
        style: {
          border: "1px solid #713200",
          padding: "16px",
          color: "#713200",
          background: "#FFFAEE",
        },
        iconTheme: {
          primary: "#713200",
          secondary: "#FFFAEE",
        },
      })
      return
    }

    setIsLoading(true)

    try {
      const { res, status } = await sendLogin(email, password)

      console.log(status)

      if (status == 200) {
        toast.success("Login successful!", {
          style: {
            border: "1px solid #059669",
            padding: "16px",
            color: "#059669",
            background: "#FFFAEE",
          },
          iconTheme: {
            primary: "#059669",
            secondary: "#FFFAEE",
          },
        })
        setTimeout(() => {
          window.location.href = "/"
        }, 1000)
      } else {
        toast.error(res.message, {
          style: {
            border: "1px solid #713200",
            padding: "16px",
            color: "#713200",
            background: "#FFFAEE",
          },
          iconTheme: {
            primary: "#713200",
            secondary: "#FFFAEE",
          },
        })
      }
    } catch (err) {
      console.log(err)
      toast.error("An error occurred. Please try again.", {
        style: {
          border: "1px solid #713200",
          padding: "16px",
          color: "#713200",
          background: "#FFFAEE",
        },
        iconTheme: {
          primary: "#713200",
          secondary: "#FFFAEE",
        },
      })
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
    <div className="flex flex-col grow p-6 gap-10 items-center align-middle h-screen w-screen bg-gradient-to-br from-[#ECEEDF] via-[#E8EAD8] to-[#E4E6D1]">
      <Toaster position="bottom-right" reverseOrder={false} />
      <Header />

      <div className="flex flex-col w-full h-full items-center justify-center">
        <div className="flex flex-col font-mono justify-between items-center w-full max-w-md h-auto gap-8 p-8 bg-[#D9C4B0]/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#CFAB8D]/30">
          <div className="flex items-center gap-3">
            <LogIn className="w-6 h-6 text-[#8B7355]" />
            <h1 className="text-3xl font-bold text-[#5D4E37] text-balance">Welcome Back</h1>
          </div>

          <div className="flex flex-col gap-6 items-center justify-center text-base w-full">
            <div className="flex flex-row bg-[#CFAB8D]/70 backdrop-blur-sm rounded-xl items-center justify-start px-4 py-3 text-base w-full border border-[#B8A082]/30 hover:bg-[#CFAB8D]/90 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#8B7355]/30">
              <Mail className="w-5 h-5 text-[#8B7355] mr-3 flex-shrink-0" />
              <div className="flex flex-col flex-1">
                <label className="text-sm text-[#8B7355] font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="focus:outline-0 bg-transparent text-[#5D4E37] placeholder-[#8B7355]/60 w-full"
                  ref={emailRef}
                  onKeyUp={onInputKeyHandler}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-row bg-[#CFAB8D]/70 backdrop-blur-sm rounded-xl items-center justify-start px-4 py-3 text-base w-full border border-[#B8A082]/30 hover:bg-[#CFAB8D]/90 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#8B7355]/30">
              <Lock className="w-5 h-5 text-[#8B7355] mr-3 flex-shrink-0" />
              <div className="flex flex-col flex-1">
                <label className="text-sm text-[#8B7355] font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="focus:outline-0 bg-transparent text-[#5D4E37] placeholder-[#8B7355]/60 w-full"
                  ref={passRef}
                  onKeyUp={onInputKey}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <button
            className="cursor-pointer bg-gradient-to-r from-[#CFAB8D] to-[#B8A082] hover:from-[#B8A082] hover:to-[#A69070] disabled:from-[#CFAB8D]/50 disabled:to-[#B8A082]/50 disabled:cursor-not-allowed rounded-xl px-8 py-3 items-center justify-center w-full h-fit font-semibold text-[#5D4E37] shadow-lg hover:shadow-xl transition-all duration-200 flex gap-2 backdrop-blur-sm border border-[#B8A082]/30"
            onClick={handleinput}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
