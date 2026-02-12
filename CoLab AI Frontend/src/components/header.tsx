"use client"

import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Home, FolderOpen, LogIn, User } from "lucide-react"
import { Button } from "./ui/button"

export function Header() {
  const { user } = useAuth()

  return (
    <div className="flex flex-row gap-3.5 justify-between border-2 border-border p-4 rounded-full bg-card w-full h-auto min-h-[4rem] flex-shrink-0 items-center shadow-directional">
      <div className="flex flex-row gap-3.5">
        <Button variant="outline" className="group rounded-full border-border hover:border-primary/50 text-foreground transition-bouncy hover:scale-105 hover:-translate-y-0.5" asChild>
          <Link to="/" aria-label="Go to home page">
            <Home size={16} className="text-primary group-hover:text-primary-foreground mr-2" />
            Home
          </Link>
        </Button>

        {user === true ? (
          <Button variant="outline" className="group rounded-full border-border hover:border-primary/50 text-foreground transition-bouncy hover:scale-105 hover:-translate-y-0.5" asChild>
            <Link to="/projects" aria-label="View your projects">
              <FolderOpen size={16} className="text-primary group-hover:text-primary-foreground mr-2" />
              Projects
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-row justify-center items-center font-semibold font-sans text-xl text-foreground gap-2">
        <h1 className="text-balance text-primary tracking-wide">Colab Minds AI</h1>
      </div>

      <div className="justify-center items-center">
        {user === false ? (
          <Button className="font-semibold" asChild>
            <Link to="/login" aria-label="Sign in to your account">
              <LogIn size={16} />
              Login
            </Link>
          </Button>
        ) : user === true ? (
          <Button variant="outline" size="icon" className="rounded-full border-primary/50 hover:border-primary shadow-gold-glow">
            <User size={20} className="text-primary" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
