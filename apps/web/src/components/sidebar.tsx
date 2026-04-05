"use client";

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from "react"
import useContent from "../hooks/useContent"
import {
  Plus,
  Home,
  FolderOpen,
  ChevronLeft,
  User,
  LogIn,
  Search,
  X,
  LogOut,
  Hash,
  MessageSquare,
  Plug,
  Settings,
} from "lucide-react"
import { ScrollArea } from "../components/ui/scroll-area"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { useStorageUsage } from "../hooks/useStorageUsage"
import Logo from "./Logo"
import gsap from "gsap"

const COLLAPSED_W = 56
const EXPANDED_W = 260

// ── Tooltip ────────────────────────────────────────────────────

function Tooltip({ label, children, show }: { label: string; children: ReactNode; show: boolean }) {
  if (!show) return <>{children}</>
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-white/[0.08] text-[12px] text-white/80 font-medium whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
        {label}
      </div>
    </div>
  )
}

// ── Logo ────────────────────────────────────────────────────
// Heavy typographic wordmark using Outfit 900 (Black weight).
// Tight letter-spacing, lowercase, gold on dark.

const LOGO_STYLE: React.CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 900,
  letterSpacing: '-0.04em',
  lineHeight: 1,
  color: '#D4AF37',
}

function CoLabWordmark() {
  return (
    <span className="flex items-baseline gap-1.5 select-none">
      <span style={{ ...LOGO_STYLE, fontSize: '20px' }}>
        co-lab
      </span>
      <span style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: '13px',
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.3)',
        lineHeight: 1,
      }}>
        AI
      </span>
    </span>
  )
}

function CoLabIcon() {
  return (
    <span className="select-none" style={{ ...LOGO_STYLE, fontSize: '18px' }}>
      c
    </span>
  )
}

// ── Main Sidebar ─────────────────────────────────────────────

export function Sidebar() {
  // `collapsed` = target state (what user clicked toward)
  // `layout` = visual layout state (switches when GSAP finishes)
  const [collapsed, setCollapsed] = useState(false)
  const [layout, setLayout] = useState<"expanded" | "collapsed">("expanded")
  const [searchQuery, setSearchQuery] = useState("")
  const { projects } = useContent()
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, logout } = useAuth()
  const storage = useStorageUsage()

  const sidebarRef = useRef<HTMLDivElement>(null)
  const isFirst = useRef(true)

  // Derived: use expanded layout while animating toward collapsed,
  // switch to collapsed layout only after animation completes.
  // Vice versa for expanding.
  const isCollapsedLayout = layout === "collapsed"

  const projectId = useMemo(() => {
    if (!pathname?.startsWith("/chat/")) return undefined
    return pathname.split("/")[2] || undefined
  }, [pathname])

  const handleLogout = useCallback(async () => {
    await logout()
    router.push("/")
  }, [logout, router])

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p: any) => p.name?.toLowerCase().includes(q))
  }, [projects, searchQuery])

  useEffect(() => {
    for (const route of ["/", "/projects", "/plugins", "/settings", "/login"]) {
      router.prefetch(route)
    }
    for (const p of projects.slice(0, 8)) {
      const id = p._id || p.id
      if (id) router.prefetch(`/chat/${id}`)
    }
  }, [router, projects])

  useEffect(() => {
    if (collapsed) setSearchQuery("")
  }, [collapsed])

  // ── GSAP animation ──────────────────────────────────────────
  useEffect(() => {
    const el = sidebarRef.current
    if (!el) return

    if (isFirst.current) {
      isFirst.current = false
      gsap.set(el, { width: EXPANDED_W, minWidth: EXPANDED_W })
      return
    }

    const dur = 0.3
    const ease = "power3.inOut"

    gsap.killTweensOf(el)

    if (collapsed) {
      // COLLAPSING: keep expanded layout during animation, switch at end
      gsap.to(el, {
        width: COLLAPSED_W,
        minWidth: COLLAPSED_W,
        duration: dur,
        ease,
        onComplete: () => setLayout("collapsed"),
      })
    } else {
      // EXPANDING: switch to expanded layout immediately (at start),
      // then animate width open
      setLayout("expanded")
      gsap.to(el, {
        width: EXPANDED_W,
        minWidth: EXPANDED_W,
        duration: dur,
        ease,
      })
    }
  }, [collapsed])

  const showSearch = !collapsed && projects.length > 3

  return (
    <div
      ref={sidebarRef}
      className="flex flex-col h-full bg-[#060606] border-r border-white/[0.06] overflow-hidden flex-shrink-0 relative z-10"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center border-b border-white/[0.06] flex-shrink-0 h-14 px-2 overflow-hidden">
        {isCollapsedLayout ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-white/[0.04] cursor-pointer mx-auto"
            title="Expand sidebar"
          >
            <CoLabIcon />
          </button>
        ) : (
          <>
            <Link href="/" className="flex items-center flex-1 min-w-0 ml-3">
              <CoLabWordmark />
            </Link>
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/55 hover:bg-white/[0.06] flex-shrink-0 cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 border-b border-white/[0.06] flex-shrink-0 py-2 px-2">
        <NavLink icon={<Home className="w-4 h-4" />} label="Home" href="/" active={pathname === "/"} collapsed={isCollapsedLayout} />
        {user === true && (
          <>
            <NavLink icon={<FolderOpen className="w-4 h-4" />} label="Projects" href="/projects" active={pathname === "/projects"} collapsed={isCollapsedLayout} badge={projects.length} />
            <NavLink icon={<Plug className="w-4 h-4" />} label="Plugins" href="/plugins" active={pathname === "/plugins"} collapsed={isCollapsedLayout} />
            <NavLink icon={<Settings className="w-4 h-4" />} label="Settings" href="/settings" active={pathname === "/settings"} collapsed={isCollapsedLayout} />
          </>
        )}
        {user === true && (
          <>
            <div className="h-px bg-white/[0.04] my-1" />
            <NavLink icon={<Plus className="w-4 h-4" />} label="New Project" href="/projects" active={false} collapsed={isCollapsedLayout} />
          </>
        )}
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      {showSearch && (
        <div className="px-2.5 pt-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white/65 placeholder:text-white/25 focus:outline-none focus:border-gold-500/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Projects ───────────────────────────────────────── */}
      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col py-2 px-2 gap-0.5">
          {!collapsed && (
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-white/35 px-3 pt-3 pb-1 block select-none">
              Recent
            </span>
          )}

          {filteredProjects.length === 0 && !collapsed && (
            <div className="px-3 py-6 text-center">
              <Hash className="w-5 h-5 text-white/[0.06] mx-auto mb-2" />
              <p className="text-[12px] text-white/30">{searchQuery ? "No matches" : "No projects yet"}</p>
            </div>
          )}

          {filteredProjects.map((project: any, index: number) => {
            const id = project._id || project.id
            const isActive = id === projectId

            if (isCollapsedLayout) {
              return (
                <Tooltip key={id || index} label={project.name} show>
                  <Link href={`/chat/${id}`} className="w-full">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
                      ${isActive ? "bg-gold-500/[0.1] border border-gold-500/20" : "hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]"}`}>
                      <div className={`w-2 h-2 rounded-full ${isActive ? "bg-gold-500 shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "bg-white/20"}`} />
                    </div>
                  </Link>
                </Tooltip>
              )
            }

            return (
              <Link key={id || index} href={`/chat/${id}`}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg group cursor-pointer
                  ${isActive ? "bg-gold-500/[0.06] text-white/85" : "text-white/45 hover:text-white/70 hover:bg-white/[0.03]"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${isActive ? "bg-gold-500 shadow-[0_0_6px_rgba(212,175,55,0.4)]" : "bg-white/15 group-hover:bg-white/25"}`} />
                  <span className="text-[13px] font-medium truncate flex-1">{project.name}</span>
                  {isActive && <MessageSquare className="w-3.5 h-3.5 text-gold-500/40 flex-shrink-0" />}
                </div>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] flex-shrink-0 p-2 overflow-hidden">
        {user === true ? (
          <>
            {!isCollapsedLayout && storage.isAvailable && storage.databases.length > 0 && (
              <div className="px-2 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-white/35">Storage</span>
                  <span className="text-[11px] font-mono text-white/40">{storage.usedMB} / {storage.limitMB} MB</span>
                </div>
                <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min(storage.percentage, 100)}%`,
                    backgroundColor: storage.percentage > 85 ? "rgba(212,175,55,0.9)" : storage.percentage > 60 ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.3)",
                  }} />
                </div>
              </div>
            )}
            <div className="flex items-center">
              {/* Avatar — fixed w-9 h-9 cell, never changes size/position */}
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/[0.08]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gold-500/[0.08] border border-gold-500/15 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-gold-500/50" />
                  </div>
                )}
              </div>
              {!isCollapsedLayout && (
                <>
                  <div className="flex-1 min-w-0 ml-1.5 overflow-hidden whitespace-nowrap">
                    <p className="text-[13px] font-medium text-white/65 truncate">{profile?.username || 'Account'}</p>
                    <p className="text-[11px] text-white/35 font-mono">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={handleLogout} title="Sign out" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-red-400/70 hover:bg-red-500/[0.06] cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center">
            <Link href="/login" prefetch className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full hover:bg-white/[0.04] group">
              <LogIn className="w-4 h-4 text-white/30 group-hover:text-gold-500/60" />
            </Link>
            {!isCollapsedLayout && (
              <span className="text-[13px] text-white/45 font-medium ml-1.5">Sign in</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Nav Link ────────────────────────────────────────────────

function NavLink({ icon, label, href, active, collapsed, badge }: {
  icon: ReactNode; label: string; href: string; active: boolean; collapsed: boolean; badge?: number
}) {
  // Icon always sits in a fixed 36x36 centered cell — position never changes between states
  return (
    <Tooltip label={label} show={collapsed}>
      <Link
        href={href}
        prefetch
        className={`flex items-center rounded-lg group relative w-full overflow-hidden
          ${active ? "bg-gold-500/[0.08] text-gold-500" : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"}`}
      >
        <span className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${active ? "text-gold-500" : "group-hover:text-white/70"}`}>
          {icon}
        </span>
        {!collapsed && (
          <>
            <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1 text-left">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="text-[10px] font-mono text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded-md mr-2">{badge}</span>
            )}
          </>
        )}
      </Link>
    </Tooltip>
  )
}
