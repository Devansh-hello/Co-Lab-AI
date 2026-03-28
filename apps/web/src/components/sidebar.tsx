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
  LogOut,
  Hash,
  MessageSquare,
  Plug,
  Cpu,
} from "lucide-react"
import { ScrollArea } from "../components/ui/scroll-area"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useStorageUsage } from "../hooks/useStorageUsage"

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
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-white/35 px-3 pt-3 pb-1 select-none">
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
          ? "bg-[#D4AF37]/[0.08] text-[#D4AF37]"
          : "text-white/50 hover:text-white/75 hover:bg-white/[0.04]"
        }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? "text-[#D4AF37]" : "group-hover:text-white/60"}`}>
        {icon}
      </span>
      {!collapsed && (
        <span className="text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1 text-left sidebar-label">
          {label}
        </span>
      )}
      {badge !== undefined && badge > 0 && !collapsed && (
        <span className="text-[10px] font-mono text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
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
            ? "bg-[#D4AF37]/[0.06] text-white/85"
            : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
          }`}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all
          ${isActive
            ? "bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.4)]"
            : "bg-white/12 group-hover:bg-white/20"
          }`}
        />
        <span className="text-[13px] font-medium truncate flex-1">{name}</span>
        {isActive && (
          <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]/40 flex-shrink-0" />
        )}
      </div>
    </Link>
  )
}

// ── Main Sidebar ─────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { projects } = useContent()
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const storage = useStorageUsage()

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase()
    return projects.filter((p: any) => p.name?.toLowerCase().includes(q))
  }, [projects, searchQuery])

  const w = collapsed ? COLLAPSED_W : EXPANDED_W

  return (
    <div
      className="flex flex-col h-full bg-[#060606] border-r border-white/[0.05] overflow-hidden flex-shrink-0 relative z-10"
      style={{ width: w, minWidth: w, transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)" }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-white/[0.05] flex-shrink-0 ${collapsed ? "flex-col py-3 gap-2" : "px-4 py-3 gap-2.5"}`}>
        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/[0.06] border border-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[#D4AF37]/60" />
        </div>

        {!collapsed && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0 sidebar-label">
            <span className="text-sm font-bold text-white/75 font-mono tracking-wide whitespace-nowrap">
              CoLab
            </span>
            <span className="text-[10px] text-[#D4AF37]/50 font-mono font-bold">AI</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(c => !c)}
          className={`w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/55 hover:bg-white/[0.05] transition-all flex-shrink-0 ${collapsed ? "" : "ml-auto"}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}
          />
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
          <>
            <NavItem
              icon={<FolderOpen className="w-4 h-4" />}
              label="Projects"
              collapsed={collapsed}
              onClick={() => navigate("/projects")}
              badge={projects.length}
            />
            <NavItem
              icon={<Plug className="w-4 h-4" />}
              label="Plugins"
              collapsed={collapsed}
              onClick={() => navigate("/plugins")}
            />
            <NavItem
              icon={<Cpu className="w-4 h-4" />}
              label="Settings"
              collapsed={collapsed}
              onClick={() => navigate("/settings")}
            />
          </>
        )}
      </div>

      {/* ── Search (expanded only, 4+ projects) ───────────── */}
      {!collapsed && projects.length > 3 && (
        <div className="px-2.5 pt-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/15 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white/65 placeholder:text-white/25 focus:outline-none focus:border-[#D4AF37]/25 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Projects ───────────────────────────────────────── */}
      <ScrollArea className="flex-1 w-full">
        <div className={`flex flex-col ${collapsed ? "py-2 px-1.5 gap-1" : "py-1 px-2.5 gap-0.5"}`}>
          {/* New Project button */}
          {collapsed ? (
            <button
              onClick={() => navigate("/projects")}
              title="New Project"
              className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-white/[0.03] hover:bg-[#D4AF37]/[0.08] text-white/35 hover:text-[#D4AF37]/70 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="w-full flex items-center gap-2.5 rounded-lg hover:bg-[#D4AF37]/[0.06] text-white/45 hover:text-[#D4AF37]/80 h-8 px-3 text-[13px] font-medium transition-all group"
              onClick={() => navigate("/projects")}
            >
              <Plus className="w-3.5 h-3.5 group-hover:text-[#D4AF37]/60 transition-colors" />
              <span>New Project</span>
            </button>
          )}

          {/* Project list */}
          <SidebarSection label="Recent" collapsed={collapsed}>
            {filteredProjects.length === 0 && !collapsed && (
              <div className="px-3 py-6 text-center">
                <Hash className="w-5 h-5 text-white/8 mx-auto mb-2" />
                <p className="text-xs text-white/30">
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
                        ${isActive ? "bg-[#D4AF37]/[0.08]" : "hover:bg-white/[0.03]"}`}
                    >
                      <div className={`w-2 h-2 rounded-full transition-all ${isActive ? "bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.35)]" : "bg-white/12"}`} />
                    </div>
                  </Link>
                )
              }

              return <ProjectItem key={id || index} id={id} name={project.name} isActive={isActive} />
            })}
          </SidebarSection>
        </div>
      </ScrollArea>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className={`border-t border-white/[0.05] flex-shrink-0 ${collapsed ? "py-2 px-1.5" : "p-2.5"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            {user === true ? (
              profile?.avatar ? (
                <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div
                  title="Account"
                  className="w-8 h-8 rounded-full bg-[#D4AF37]/[0.06] border border-[#D4AF37]/10 flex items-center justify-center"
                >
                  <User className="w-3.5 h-3.5 text-[#D4AF37]/40" />
                </div>
              )
            ) : (
              <button
                onClick={() => navigate("/login")}
                title="Sign in"
                className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-white/25" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {user === true ? (
              <>
                {/* Storage usage bar */}
                {storage.isAvailable && storage.databases.length > 0 && (
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-white/30">Storage</span>
                      <span className="text-[10px] font-mono text-white/35">
                        {storage.usedMB} / {storage.limitMB} MB
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(storage.percentage, 100)}%`,
                          backgroundColor: storage.percentage > 85
                            ? "rgba(212,175,55,0.9)"
                            : storage.percentage > 60
                            ? "rgba(212,175,55,0.5)"
                            : "rgba(212,175,55,0.3)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* User row + sign out */}
                <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#D4AF37]/[0.06] border border-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-[#D4AF37]/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/65 truncate">{profile?.username || 'Account'}</p>
                    <p className="text-[11px] text-white/35 font-mono">
                      {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => {/* TODO: sign out logic */}}
                    title="Sign out"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white/30 hover:text-red-400/70 hover:bg-red-400/[0.06] transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all group"
              >
                <LogIn className="w-4 h-4 text-white/35 group-hover:text-[#D4AF37]/60 transition-colors" />
                <span className="text-[13px] text-white/45 group-hover:text-white/65 font-medium">Sign in</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
