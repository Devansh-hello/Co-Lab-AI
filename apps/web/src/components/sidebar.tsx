"use client";

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from "react"
import useContent from "../hooks/useContent"
import {
  Plus,
  Home,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
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
import Logo, { LogoMark } from "./Logo"
import gsap from "gsap"

const COLLAPSED_W = 56
const EXPANDED_W = 260

// ── Tooltip ────────────────────────────────────────────────────

function Tooltip({ label, children, show }: { label: string; children: ReactNode; show: boolean }) {
  if (!show) return <>{children}</>
  return (
    <div className="relative group/tip">
      {children}
      <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 rounded-lg bg-[#141414] border border-white/[0.08] text-[11px] text-white/75 font-medium whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 shadow-elevation-2">
        {label}
      </div>
    </div>
  )
}

// ── Main Sidebar ─────────────────────────────────────────────

export function Sidebar({ mobile, onMobileClose }: { mobile?: boolean; onMobileClose?: () => void }) {
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

  const isCollapsedLayout = mobile ? false : layout === "collapsed"
  const isMobileMode = !!mobile

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

  // ── GSAP animation (desktop only) ──────────────────────────
  useEffect(() => {
    if (isMobileMode) return
    const el = sidebarRef.current
    if (!el) return

    if (isFirst.current) {
      isFirst.current = false
      gsap.set(el, { width: EXPANDED_W, minWidth: EXPANDED_W })
      return
    }

    const dur = 0.38
    const ease = "power2.inOut"

    gsap.killTweensOf(el)

    const labels = el.querySelectorAll(".sidebar-label")

    if (collapsed) {
      gsap.to(labels, {
        opacity: 0,
        duration: dur * 0.35,
        ease: "power2.in",
      })
      gsap.to(el, {
        width: COLLAPSED_W,
        minWidth: COLLAPSED_W,
        duration: dur,
        ease,
        delay: dur * 0.1,
        onComplete: () => setLayout("collapsed"),
      })
    } else {
      setLayout("expanded")
      gsap.set(labels, { opacity: 0 })
      gsap.to(el, {
        width: EXPANDED_W,
        minWidth: EXPANDED_W,
        duration: dur,
        ease,
      })
      gsap.to(labels, {
        opacity: 1,
        duration: dur * 0.5,
        ease: "power2.out",
        delay: dur * 0.5,
      })
    }
  }, [collapsed, isMobileMode])

  const showSearch = !isCollapsedLayout && projects.length > 3

  // Mobile link handler — navigate then close
  const handleMobileNav = useCallback((href: string) => {
    if (isMobileMode && onMobileClose) {
      router.push(href)
      onMobileClose()
    }
  }, [isMobileMode, onMobileClose, router])

  return (
    <div
      ref={sidebarRef}
      className="flex flex-col h-full overflow-hidden flex-shrink-0 relative z-10"
      style={{
        background: "linear-gradient(180deg, #141414 0%, #111111 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center border-b border-white/[0.05] flex-shrink-0 h-[52px] px-2 overflow-hidden">
        {isCollapsedLayout ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-white/[0.04] cursor-pointer mx-auto transition-[background-color] duration-[180ms]"
            title="Expand sidebar"
          >
            <LogoMark size={20} />
          </button>
        ) : (
          <>
            {isMobileMode ? (
              <div className="sidebar-label flex items-center flex-1 min-w-0 ml-3 cursor-pointer" onClick={() => handleMobileNav("/")}>
                <Logo size="sm" />
              </div>
            ) : (
              <Link href="/" className="sidebar-label flex items-center flex-1 min-w-0 ml-3">
                <Logo size="sm" />
              </Link>
            )}
            {isMobileMode ? (
              <button
                onClick={onMobileClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/55 hover:bg-white/[0.06] flex-shrink-0 cursor-pointer transition-[color,background-color] duration-[180ms]"
                title="Close sidebar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/[0.05] flex-shrink-0 cursor-pointer transition-[color,background-color] duration-[180ms]"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 border-b border-white/[0.05] flex-shrink-0 py-2 px-2">
        <NavLink icon={<Home className="w-4 h-4" />} label="Home" href="/" active={pathname === "/"} collapsed={isCollapsedLayout} mobile={isMobileMode} onMobileNav={handleMobileNav} />
        {user === true && (
          <>
            <NavLink icon={<FolderOpen className="w-4 h-4" />} label="Projects" href="/projects" active={pathname === "/projects"} collapsed={isCollapsedLayout} badge={projects.length} mobile={isMobileMode} onMobileNav={handleMobileNav} />
            <NavLink icon={<Plug className="w-4 h-4" />} label="Plugins" href="/plugins" active={pathname === "/plugins"} collapsed={isCollapsedLayout} mobile={isMobileMode} onMobileNav={handleMobileNav} />
            <NavLink icon={<Settings className="w-4 h-4" />} label="Settings" href="/settings" active={pathname === "/settings"} collapsed={isCollapsedLayout} mobile={isMobileMode} onMobileNav={handleMobileNav} />
          </>
        )}
        {user === true && (
          <>
            <div className="h-px bg-white/[0.04] my-1 mx-1" />
            <NavLink icon={<Plus className="w-4 h-4" />} label="New Project" href="/projects" active={false} collapsed={isCollapsedLayout} mobile={isMobileMode} onMobileNav={handleMobileNav} />
          </>
        )}
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      {showSearch && (
        <div className="px-2.5 pt-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/15 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-white/[0.025] border border-white/[0.05] text-[12px] text-white/60 placeholder:text-white/20 focus:outline-none focus:border-gold-500/25 focus:bg-white/[0.04] transition-[border-color,background-color] duration-[180ms]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/40 cursor-pointer transition-colors duration-[180ms]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Projects ───────────────────────────────────────── */}
      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col py-2 px-2 gap-0.5">
          {!isCollapsedLayout && (
            <span className="sidebar-label text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/25 px-3 pt-3 pb-1.5 block select-none whitespace-nowrap">
              Recent
            </span>
          )}

          {filteredProjects.length === 0 && !collapsed && (
            <div className="px-3 py-6 text-center">
              <Hash className="w-4 h-4 text-white/[0.05] mx-auto mb-2" />
              <p className="text-[11px] text-white/25">{searchQuery ? "No matches" : "No projects yet"}</p>
            </div>
          )}

          {filteredProjects.map((project: any, index: number) => {
            const id = project._id || project.id
            const isActive = id === projectId

            if (isCollapsedLayout) {
              return (
                <Tooltip key={id || index} label={project.name} show>
                  <Link href={`/chat/${id}`} prefetch className="w-full">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer mx-auto transition-[background-color,border-color] duration-[180ms]
                      ${isActive ? "bg-gold-500/[0.08] border border-gold-500/15" : "hover:bg-white/[0.04] border border-transparent hover:border-white/[0.05]"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-[background-color,box-shadow] duration-[180ms] ${isActive ? "bg-gold-500 shadow-[0_0_6px_rgba(230,179,62,0.35)]" : "bg-white/15"}`} />
                    </div>
                  </Link>
                </Tooltip>
              )
            }

            const content = (
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg group cursor-pointer transition-[background-color,color] duration-[180ms]
                ${isActive
                  ? "bg-gold-500/[0.05] text-white/85"
                  : "text-white/40 hover:text-white/65 hover:bg-white/[0.025]"
                }`}
                style={isActive ? { boxShadow: "inset 0 1px 0 rgba(230,179,62,0.04)" } : undefined}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-[background-color,box-shadow] duration-[180ms]
                  ${isActive ? "bg-gold-500 shadow-[0_0_5px_rgba(230,179,62,0.3)]" : "bg-white/12 group-hover:bg-white/20"}`} />
                <span className="sidebar-label text-[13px] font-medium truncate flex-1">{project.name}</span>
                {isActive && <MessageSquare className="w-3 h-3 text-gold-500/30 flex-shrink-0" />}
              </div>
            )

            if (isMobileMode) {
              return (
                <div key={id || index} onClick={() => handleMobileNav(`/chat/${id}`)}>
                  {content}
                </div>
              )
            }

            return (
              <Link key={id || index} href={`/chat/${id}`} prefetch>
                {content}
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="border-t border-white/[0.05] flex-shrink-0 p-2 overflow-hidden">
        {user === true ? (
          <>
            {/* Storage bar */}
            {!isCollapsedLayout && storage.isAvailable && storage.databases.length > 0 && (
              <div className="px-2 py-2 mb-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/25">Storage</span>
                  <span className="text-[10px] font-mono text-white/30 tabular-nums">{storage.usedMB} / {storage.limitMB} MB</span>
                </div>
                <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width,background-color] duration-500"
                    style={{
                      width: `${Math.min(storage.percentage, 100)}%`,
                      backgroundColor: storage.percentage > 85 ? "rgba(230,179,62,0.8)" : storage.percentage > 60 ? "rgba(230,179,62,0.45)" : "rgba(230,179,62,0.25)",
                      boxShadow: storage.percentage > 60 ? "0 0 6px rgba(230,179,62,0.15)" : "none",
                    }}
                  />
                </div>
              </div>
            )}

            {/* User row */}
            <div className="flex items-center rounded-lg hover:bg-white/[0.02] transition-[background-color] duration-[180ms]">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-white/[0.06]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gold-500/[0.06] border border-gold-500/10 flex items-center justify-center">
                    <User className="w-3 h-3 text-gold-500/40" />
                  </div>
                )}
              </div>
              {!isCollapsedLayout && (
                <>
                  <div className="flex-1 min-w-0 ml-1 overflow-hidden whitespace-nowrap">
                    <p className="text-[12px] font-medium text-white/55 truncate">{profile?.username || 'Account'}</p>
                    <p className="text-[10px] text-white/25 font-mono tabular-nums">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={handleLogout} title="Sign out" className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400/60 hover:bg-red-500/[0.05] cursor-pointer transition-[color,background-color] duration-[180ms]">
                    <LogOut className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center">
            {isMobileMode ? (
              <div onClick={() => handleMobileNav("/login")} className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full hover:bg-white/[0.04] group cursor-pointer">
                <LogIn className="w-4 h-4 text-white/25 group-hover:text-gold-500/50" />
              </div>
            ) : (
              <Link href="/login" prefetch className="w-9 h-9 flex items-center justify-center flex-shrink-0 rounded-full hover:bg-white/[0.04] group">
                <LogIn className="w-4 h-4 text-white/25 group-hover:text-gold-500/50" />
              </Link>
            )}
            {!isCollapsedLayout && (
              <span className="sidebar-label text-[12px] text-white/40 font-medium ml-1.5">Sign in</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Nav Link ────────────────────────────────────────────────

function NavLink({ icon, label, href, active, collapsed, badge, mobile, onMobileNav }: {
  icon: ReactNode; label: string; href: string; active: boolean; collapsed: boolean; badge?: number; mobile?: boolean; onMobileNav?: (href: string) => void
}) {
  const inner = (
    <>
      <span className={`w-9 h-9 flex items-center justify-center flex-shrink-0 transition-colors duration-[180ms] ${active ? "text-gold-500" : "group-hover:text-white/60"}`}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="sidebar-label text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1 text-left">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="sidebar-label text-[9px] font-mono text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded mr-2 tabular-nums">{badge}</span>
          )}
        </>
      )}
    </>
  )

  const cls = `flex items-center rounded-lg group relative w-full overflow-hidden transition-[background-color,color] duration-[180ms]
    ${active
      ? "bg-gold-500/[0.06] text-gold-500"
      : "text-white/35 hover:text-white/65 hover:bg-white/[0.03]"
    }`

  const style = active ? { boxShadow: "inset 0 1px 0 rgba(230,179,62,0.04)" } as React.CSSProperties : undefined

  return (
    <Tooltip label={label} show={collapsed}>
      {mobile && onMobileNav ? (
        <div className={cls} style={style} onClick={() => onMobileNav(href)}>
          {inner}
        </div>
      ) : (
        <Link href={href} prefetch className={cls} style={style}>
          {inner}
        </Link>
      )}
    </Tooltip>
  )
}
