"use client"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Sparkles, Menu, LogOut } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Separator } from "./ui/separator"

export function Header() {
  const { user, profile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const isHomePage = location.pathname === "/"

  function handleHashLink(hash: string) {
    setOpen(false)
    if (isHomePage) {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate("/" + hash)
    }
  }

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate("/")
  }

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-header">
      <div className="container mx-auto flex md:grid md:grid-cols-3 h-14 md:h-16 items-center justify-between px-4 md:px-6">
        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2 group w-fit">
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
          </div>
          <span className="text-base md:text-lg font-bold tracking-tight text-foreground">
            Co-Lab <span className="text-gold">AI</span>
          </span>
        </Link>

        {/* Center — Desktop Nav */}
        <nav className="hidden md:flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">Home</Link>
          </Button>
          {user === true && (
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link to="/projects">Projects</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => handleHashLink("#features")}
          >
            Features
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => handleHashLink("#agents")}
          >
            Agents
          </Button>
        </nav>

        {/* Right — Desktop Auth */}
        <div className="hidden md:flex items-center gap-3 justify-end">
          {user === false ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" className="font-semibold" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          ) : user === true ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={profile?.avatar} alt={profile?.username} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 overflow-hidden bg-card border-border/60 !rounded-xl">
                {/* User info */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground truncate">{profile?.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
                <Separator className="bg-border/40" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-sm"
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
            <Button size="sm" className="font-semibold text-xs h-8 px-3" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          ) : user === true ? (
            <Link to="/projects">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar} alt={profile?.username} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : null}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border/40 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile menu header */}
                <div className="flex items-center px-5 pt-5 pb-4 border-b border-border/40">
                  {user === true && profile ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile.avatar} alt={profile.username} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{profile.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-base font-bold text-foreground">
                      Co-Lab <span className="text-gold">AI</span>
                    </span>
                  )}
                </div>

                {/* Mobile nav links */}
                <nav className="flex flex-col py-4">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    Home
                  </Link>
                  {user === true && (
                    <Link
                      to="/projects"
                      onClick={() => setOpen(false)}
                      className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      Projects
                    </Link>
                  )}
                  <button
                    onClick={() => handleHashLink("#features")}
                    className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => handleHashLink("#agents")}
                    className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-left"
                  >
                    Agents
                  </button>
                </nav>

                {/* Mobile bottom section */}
                <div className="mt-auto border-t border-border/40 p-5 space-y-3">
                  {user === false ? (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                      </Button>
                      <Button className="w-full font-semibold" asChild>
                        <Link to="/signup" onClick={() => setOpen(false)}>Get Started</Link>
                      </Button>
                    </>
                  ) : user === true ? (
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
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
