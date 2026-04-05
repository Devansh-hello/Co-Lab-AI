"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { Menu, LogOut } from "lucide-react"
import Logo from "./Logo"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

/* Shared link class */
const navLink =
  "px-3 py-1.5 text-[13px] font-medium text-white/50 hover:text-white/80 transition-colors rounded-md"

export function Header() {
  const { user, profile, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isHomePage = pathname === "/"

  function handleHashLink(hash: string) {
    setOpen(false)
    if (isHomePage) {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/" + hash)
    }
  }

  async function handleLogout() {
    setOpen(false)
    await logout()
    router.push("/")
  }

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex h-14 items-center px-4 md:px-8">
        {/* Left — Logo */}
        <Link href="/" className="flex items-center shrink-0 mr-8">
          <Logo size="sm" />
        </Link>

        {/* Center — Desktop Nav (takes remaining space, centered) */}
        <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
          <Link href="/" className={navLink}>
            Home
          </Link>
          {user === true && (
            <Link href="/projects" className={navLink}>
              Projects
            </Link>
          )}
          <button onClick={() => handleHashLink("#features")} className={`${navLink} cursor-pointer`}>
            Features
          </button>
          <button onClick={() => handleHashLink("#agents")} className={`${navLink} cursor-pointer`}>
            Agents
          </button>
        </nav>

        {/* Right — Desktop Auth */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user === false ? (
            <>
              <Link href="/login" className={navLink}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="h-8 px-4 inline-flex items-center justify-center text-[13px] font-bold text-gold-500 bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 hover:border-gold-500/50 rounded-md transition-[background,border-color] duration-150"
              >
                Get Started
              </Link>
            </>
          ) : user === true ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
                  <Avatar className="h-8 w-8 hover:ring-2 hover:ring-gold-500/50 transition-all duration-200 rounded-full">
                    <AvatarImage src={profile?.avatar} alt={profile?.username} />
                    <AvatarFallback className="bg-white/[0.06] text-white/60 text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 overflow-hidden bg-card border-white/[0.08] !rounded-xl">
                <div className="px-4 py-3">
                  <p className="text-[13px] font-medium text-white/80 truncate">{profile?.username}</p>
                  <p className="text-[12px] text-white/40 truncate">{profile?.email}</p>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10 rounded-md text-[13px]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* Mobile — Hamburger + Avatar */}
        <div className="flex md:hidden items-center gap-2">
          {user === false ? (
            <Link
              href="/signup"
              className="h-8 px-3 inline-flex items-center justify-center text-[12px] font-bold text-gold-500 bg-gold-500/15 border border-gold-500/30 rounded-md"
            >
              Get Started
            </Link>
          ) : user === true ? (
            <Link href="/projects">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar} alt={profile?.username} />
                <AvatarFallback className="bg-white/[0.06] text-white/60 text-[10px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : null}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-colors cursor-pointer">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-white/[0.06] p-0">
              <div className="flex flex-col h-full">
                {/* Mobile menu header */}
                <div className="flex items-center px-5 pt-5 pb-4 border-b border-white/[0.06]">
                  {user === true && profile ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile.avatar} alt={profile.username} />
                        <AvatarFallback className="bg-white/[0.06] text-white/60 text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white/80 truncate">{profile.username}</p>
                        <p className="text-[12px] text-white/40 truncate">{profile.email}</p>
                      </div>
                    </div>
                  ) : (
                    <Logo size="md" />
                  )}
                </div>

                {/* Mobile nav links */}
                <nav className="flex flex-col py-2">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 text-[14px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                  >
                    Home
                  </Link>
                  {user === true && (
                    <Link
                      href="/projects"
                      onClick={() => setOpen(false)}
                      className="px-5 py-3 text-[14px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                    >
                      Projects
                    </Link>
                  )}
                  <button
                    onClick={() => handleHashLink("#features")}
                    className="px-5 py-3 text-[14px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => handleHashLink("#agents")}
                    className="px-5 py-3 text-[14px] text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                  >
                    Agents
                  </button>
                </nav>

                {/* Mobile bottom section */}
                <div className="mt-auto border-t border-white/[0.06] p-5 space-y-3">
                  {user === false ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="w-full h-9 inline-flex items-center justify-center text-[13px] font-medium text-white/60 border border-white/[0.1] hover:border-white/[0.2] rounded-md transition-colors"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setOpen(false)}
                        className="w-full h-9 inline-flex items-center justify-center text-[13px] font-bold text-gold-500 bg-gold-500/15 border border-gold-500/30 rounded-md"
                      >
                        Get Started
                      </Link>
                    </>
                  ) : user === true ? (
                    <button
                      onClick={handleLogout}
                      className="w-full h-9 inline-flex items-center justify-center gap-2 text-[13px] font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
