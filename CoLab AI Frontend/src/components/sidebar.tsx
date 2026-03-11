"use client"

import React from "react"
import { useState } from "react"
import useContent from "../hooks/useContent"
import { ProjectCard } from "../components/projectCard"
import { Plus, Home, FolderOpen, ChevronLeft, ChevronRight, User, LogIn, Sparkles } from "lucide-react"
import { ScrollArea } from "../components/ui/scroll-area"
import { useNavigate, useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"

const COLLAPSED_W = 56
const EXPANDED_W = 220

interface NavItemProps {
  icon: React.ReactNode
  label: string
  collapsed: boolean
  onClick: () => void
  active?: boolean
}

function NavItem({ icon, label, collapsed, onClick, active }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl w-full transition-bouncy group
        ${collapsed ? "justify-center px-0 py-2 h-9" : "px-3 py-2"}
        ${active
          ? "bg-primary/15 text-primary shadow-gold-glow"
          : "text-muted-foreground hover:text-foreground hover:bg-white/8"
        }`}
    >
      <span className={`flex-shrink-0 transition-colors ${active ? "text-primary" : "group-hover:text-primary"}`}>
        {icon}
      </span>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            key="label"
            className="text-xs font-medium whitespace-nowrap overflow-hidden"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)
  const projects = useContent()
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <motion.div
      className="flex flex-col h-full bg-card border border-border rounded-2xl overflow-hidden flex-shrink-0 shadow-directional relative z-10"
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.8 }}
      style={{ minWidth: collapsed ? COLLAPSED_W : EXPANDED_W }}
    >
      {/* ── Logo + Toggle ─────────────────────────────────── */}
      <div className={`flex items-center border-b border-border flex-shrink-0 ${collapsed ? "flex-col py-3 gap-2" : "px-3 py-3 gap-2"}`}>
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-gold-glow shine-effect shine-gold">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              key="brand"
              className="text-sm font-bold text-primary font-mono tracking-wide whitespace-nowrap overflow-hidden flex-1"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              Colab Minds
            </motion.span>
          )}
        </AnimatePresence>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0 ${collapsed ? "" : "ml-auto"}`}
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

      {/* ── Nav Items ─────────────────────────────────────── */}
      <div className={`flex flex-col gap-1 border-b border-border flex-shrink-0 ${collapsed ? "py-2 px-1.5" : "p-2"}`}>
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
          />
        )}
      </div>

      {/* ── Projects List ─────────────────────────────────── */}
      <ScrollArea className="flex-1 w-full">
        <div className={`flex flex-col gap-1 ${collapsed ? "py-2 px-1.5" : "p-2"}`}>

          {/* New Project */}
          {collapsed ? (
            <button
              onClick={() => navigate("/projects")}
              title="New Project"
              className="w-8 h-8 rounded-xl mx-auto flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-bouncy hover:scale-110 active:scale-95 shadow-gold-glow shine-effect shine-gold"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 h-8 text-xs font-semibold transition-bouncy hover:-translate-y-0.5 hover:scale-[1.02] shadow-gold-glow shine-effect shine-gold"
              onClick={() => navigate("/projects")}
            >
              <Plus className="w-3.5 h-3.5" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    key="new-label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    New Project
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Project items */}
          <div className="flex flex-col gap-0.5 mt-1">
            {projects.map((project: any, index: number) => {
              const id = project._id || project.id
              const isActive = id === projectId

              return (
                <div key={id || index}>
                  {collapsed ? (
                    <Link to={`/chat/${id}`}>
                      <div
                        title={project.name}
                        className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center cursor-pointer transition-bouncy hover:scale-110 active:scale-95
                          ${isActive ? "bg-primary/20 shadow-gold-glow" : "hover:bg-white/10"}`}
                      >
                        <div className={`w-2 h-2 rounded-full transition-all ${isActive ? "bg-primary shadow-gold-glow scale-125" : "bg-muted-foreground/40"}`} />
                      </div>
                    </Link>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.04 }}
                    >
                      <ProjectCard id={id} title={project.name} isActive={isActive} />
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* ── Footer / User ─────────────────────────────────── */}
      <div className={`border-t border-border flex-shrink-0 ${collapsed ? "py-2 px-1.5" : "p-2"}`}>
        {collapsed ? (
          <div className="flex justify-center">
            {user === true ? (
              <div
                title="Account"
                className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-gold-glow cursor-pointer hover:scale-110 transition-bouncy"
              >
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            ) : (
              <button
                onClick={() => navigate("/Login")}
                title="Login"
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-bouncy hover:scale-110 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="user-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {user === true ? (
                <div className="flex items-center gap-2 px-1 py-1">
                  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-gold-glow flex-shrink-0">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">Account</p>
                    <p className="text-[10px] text-muted-foreground">
                      {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/Login")}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl hover:bg-white/8 transition-all group"
                >
                  <LogIn className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">Login</span>
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
