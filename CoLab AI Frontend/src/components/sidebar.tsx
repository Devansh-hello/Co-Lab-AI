"use client"

import { useState, useMemo, type ReactNode } from "react"
import useContent from "../hooks/useContent"
import {
  Plus,
  Home,
  FolderOpen,
  ChevronRight,
  User,
  LogIn,
  Sparkles,
  Search,
  X,
  Settings,
  LogOut,
  Hash,
  MessageSquare,
} from "lucide-react"
import { ScrollArea } from "../components/ui/scroll-area"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const COLLAPSED_W = 52
const EXPANDED_W = 260

// ── Sidebar Section ──────────────────────────────────────────

function SidebarSection({ label, collapsed, children }: {
  label: string
  collapsed: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 px-3 pt-3 pb-1 select-none">
          {label}
        </span>
      )}
      {children}
    </div>
  )
}

// ── Nav Item ──────────────────────────────────────────────────

function NavItem({ icon, label, collapsed, onClick, active, badge }: {
  icon: ReactNode
  label: string
  collapsed: boolean
  onClick: () => void
  active?: boolean
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg w-full transition-all group relative
        ${collapsed ? "justify-center px-0 py-2 h-9" : "px-3 py-2"}
        ${active
          ? "bg-primary/10 text-primary"
          : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
        }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-white/50"}`}>
        {icon}
      </span>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            key="label"
            className="text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1 text-left"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {badge !== undefined && badge > 0 && !collapsed && (
        <span className="text-[10px] font-mono text-white/30 bg-white/[0.05] px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      )}
    </button>
  )
}

// ── Project Item (compact) ───────────────────────────────────

function ProjectItem({ id, name, isActive }: {
  id: string
  name: string
  isActive: boolean
}) {
  return (
    <Link to={`/chat/${id}`}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group cursor-pointer
          ${isActive
            ? "bg-primary/8 text-white/80"
            : "text-white/40 hover:text-white/65 hover:bg-white/[0.03]"
          }`}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all
          ${isActive
            ? "bg-primary shadow-[0_0_6px_rgba(212,175,55,0.5)]"
            : "bg-white/15 group-hover:bg-white/25"
          }`}
        />
        <span className="text-[13px] font-medium truncate flex-1">{name}</span>
        {isActive && (
          <MessageSquare className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
        )}
      </div>
    </Link>
  )
}

// ── Main Sidebar ─────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const projects = useContent()
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p: any) => p.name?.toLowerCase().includes(q))
  }, [projects, searchQuery])

  return (
    <motion.div
      className="flex flex-col h-full bg-[#060606] border-r border-white/[0.05] overflow-hidden flex-shrink-0 relative z-10"
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.6 }}
      style={{ minWidth: collapsed ? COLLAPSED_W : EXPANDED_W }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-white/[0.05] flex-shrink-0 ${collapsed ? "flex-col py-3 gap-2" : "px-4 py-3 gap-2.5"}`}>
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary/70" />
        </div>

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="brand"
              className="flex items-center gap-1.5 flex-1 min-w-0"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <span className="text-sm font-bold text-white/65 font-mono tracking-wide whitespace-nowrap">
                CoLab
              </span>
              <span className="text-[10px] text-primary/50 font-mono font-bold">AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(c => !c)}
          className={`w-7 h-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all flex-shrink-0 ${collapsed ? "" : "ml-auto"}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <div className={`flex flex-col gap-0.5 border-b border-white/[0.05] flex-shrink-0 ${collapsed ? "py-2 px-1.5" : "py-2 px-2.5"}`}>
        <NavItem
          icon={<Home className="w-4 h-4" />}
          label="Home"
          collapsed={collapsed}
          onClick={() => navigate("/")}
        />
        {user === true && (
          <NavItem
            icon={<FolderOpen className="w-4 h-4" />}
            label="Projects"
            collapsed={collapsed}
            onClick={() => navigate("/projects")}
            badge={projects.length}
          />
        )}
      </div>

      {/* ── Search (expanded only) ─────────────────────────── */}
      <AnimatePresence>
        {!collapsed && projects.length > 3 && (
          <motion.div
            className="px-2.5 pt-2.5 flex-shrink-0"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full h-8 pl-8 pr-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white/60 placeholder:text-white/20 focus:outline-none focus:border-white/[0.12] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Projects ───────────────────────────────────────── */}
      <ScrollArea className="flex-1 w-full">
        <div className={`flex flex-col ${collapsed ? "py-2 px-1.5 gap-1" : "py-1 px-2.5 gap-0.5"}`}>
          {/* New Project button */}
          {collapsed ? (
            <button
              onClick={() => navigate("/projects")}
              title="New Project"
              className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/[0.04] hover:bg-primary/10 text-white/25 hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="w-full flex items-center gap-2.5 rounded-lg hover:bg-primary/8 text-white/35 hover:text-primary h-8 px-3 text-[13px] font-medium transition-all group"
              onClick={() => navigate("/projects")}
            >
              <Plus className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
              <span>New Project</span>
            </button>
          )}

          {/* Project list */}
          <SidebarSection label="Recent" collapsed={collapsed}>
            {filteredProjects.length === 0 && !collapsed && (
              <div className="px-3 py-6 text-center">
                <Hash className="w-5 h-5 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/20">
                  {searchQuery ? "No matches" : "No projects yet"}
                </p>
              </div>
            )}
            {filteredProjects.map((project: any, index: number) => {
              const id = project._id || project.id
              const isActive = id === projectId

              if (collapsed) {
                return (
                  <Link key={id || index} to={`/chat/${id}`}>
                    <div
                      title={project.name}
                      className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center cursor-pointer transition-all
                        ${isActive ? "bg-primary/10" : "hover:bg-white/[0.04]"}`}
                    >
                      <div className={`w-2 h-2 rounded-full transition-all ${isActive ? "bg-primary shadow-[0_0_6px_rgba(212,175,55,0.4)]" : "bg-white/15"}`} />
                    </div>
                  </Link>
                )
              }

              return (
                <motion.div
                  key={id || index}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.02 }}
                >
                  <ProjectItem id={id} name={project.name} isActive={isActive} />
                </motion.div>
              )
            })}
          </SidebarSection>
        </div>
      </ScrollArea>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className={`border-t border-white/[0.05] flex-shrink-0 ${collapsed ? "py-2 px-1.5" : "p-2.5"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            {user === true ? (
              <>
                <button
                  onClick={() => { setCollapsed(false); setShowSettings(true) }}
                  title="Settings"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/40 hover:bg-white/[0.04] transition-all"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <div
                  title="Account"
                  className="w-8 h-8 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center"
                >
                  <User className="w-3.5 h-3.5 text-primary/50" />
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/Login")}
                title="Login"
                className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.06] transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-white/30" />
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="footer-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-1"
            >
              {user === true ? (
                <>
                  {/* Settings panel */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-1 overflow-hidden"
                      >
                        <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2 flex flex-col gap-0.5">
                          <button
                            onClick={() => navigate("/projects")}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-white/35 hover:text-white/55 hover:bg-white/[0.04] transition-all w-full text-left"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Manage Projects
                          </button>
                          <button
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-destructive/40 hover:text-destructive/70 hover:bg-destructive/[0.06] transition-all w-full text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User row */}
                  <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                    <div className="w-7 h-7 rounded-full bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-primary/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/55 truncate">Account</p>
                      <p className="text-[11px] text-white/25">
                        {projects.length} project{projects.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSettings(s => !s)}
                      className={`w-7 h-7 rounded-md flex items-center justify-center transition-all
                        ${showSettings ? "bg-white/[0.06] text-white/45" : "text-white/20 hover:text-white/40 hover:bg-white/[0.04]"}`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate("/Login")}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all group"
                >
                  <LogIn className="w-4 h-4 text-white/25 group-hover:text-primary/60 transition-colors" />
                  <span className="text-[13px] text-white/35 group-hover:text-white/55 font-medium">Sign in</span>
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
