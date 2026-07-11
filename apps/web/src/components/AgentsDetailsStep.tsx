"use client"

import { useState, type ReactNode } from "react"
import { Coins, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"

// ─── Types ──────────────────────────────────────────────────────

export interface AgentTask {
  id: string | number
  text: string
  label?: string | number
  muted?: boolean
}

export interface AgentImagePreview {
  src: string
  url: string
  alt?: string
}

export interface AgentTableColumn {
  header: string
  rows: string[]
  width?: string | number
}

type TabKey = "what-it-does" | "expected-outcomes"

export interface AgentsDetailsStepProps {
  title: string
  description: string
  credits: number

  /** If set, shows the What it does / Expected outcomes tab group at the top of the right pane. */
  showTabs?: boolean
  defaultTab?: TabKey
  onTabChange?: (tab: TabKey) => void

  /** Pagination shown in the swipe controls (bottom-right of the right pane). */
  currentStep?: number
  totalSteps?: number

  onDeploy?: () => void
  onFindAnother?: () => void
  onPrev?: () => void
  onNext?: () => void

  /** Content for the right pane middle area. Compose using the exported helpers below. */
  children: ReactNode

  /** Hide the gradient overlay above the bottom button row. Default: true. */
  showBottomFade?: boolean

  className?: string
}

// ─── Main shell ─────────────────────────────────────────────────

export function AgentsDetailsStep({
  title,
  description,
  credits,
  showTabs = false,
  defaultTab = "what-it-does",
  onTabChange,
  currentStep = 1,
  totalSteps = 2,
  onDeploy,
  onFindAnother,
  onPrev,
  onNext,
  children,
  showBottomFade = true,
  className,
}: AgentsDetailsStepProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab)

  const setTab = (tab: TabKey) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const canPrev = currentStep > 1
  const canNext = currentStep < totalSteps

  return (
    <div
      className={cn(
        "font-label bg-[#050505] border border-[#2a2a2a] rounded-[24px] flex h-[540px] w-full max-w-[1072px] overflow-hidden",
        className,
      )}
    >
      {/* ── Left pane: title, description, credits, deploy ── */}
      <div className="flex flex-col h-full items-center p-10 w-[320px] shrink-0 gap-4">
        <div className="flex flex-col gap-4 items-start w-full flex-1 min-h-0 overflow-clip">
          <h2 className="font-semibold text-[32px] leading-[1.4] tracking-[-0.02em] text-[#e5e5e5] w-full">
            {title}
          </h2>
          <p className="font-medium text-[16px] leading-[1.4] tracking-[-0.01em] text-[#737373] w-full flex-1 min-h-0">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-2 items-center justify-center w-[276px] shrink-0">
          <div className="flex gap-2 items-center justify-center px-4 py-2 rounded-lg w-full">
            <Coins size={20} className="text-[#52d68c] shrink-0" strokeWidth={1.75} />
            <span className="font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#52d68c] text-center whitespace-nowrap">
              {credits} credits
            </span>
          </div>

          <button
            type="button"
            onClick={onDeploy}
            className="flex gap-2 items-center justify-center overflow-hidden px-4 py-2 rounded-lg w-full bg-[#e5e5e5] hover:bg-white transition-colors duration-[180ms]"
          >
            <span className="font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#111] text-center whitespace-nowrap">
              Deploy Agent
            </span>
          </button>
        </div>
      </div>

      {/* ── Vertical divider ── */}
      <div className="h-full w-px bg-[#2a2a2a] shrink-0" aria-hidden />

      {/* ── Right pane: tabs + content + bottom bar ── */}
      <div className="flex flex-1 min-w-0 flex-col h-full items-start justify-between">
        {/* Top: tabs (optional) + content */}
        <div
          className={cn(
            "flex flex-1 min-h-0 flex-col items-start pt-10 px-10 w-full relative",
            showTabs ? "gap-4" : "gap-0",
          )}
        >
          {showTabs && (
            <div className="bg-[#050505] border border-[#404040] rounded-[16px] flex gap-2 items-center p-2 w-full shrink-0">
              <TabButton active={activeTab === "what-it-does"} onClick={() => setTab("what-it-does")}>
                What it does
              </TabButton>
              <TabButton active={activeTab === "expected-outcomes"} onClick={() => setTab("expected-outcomes")}>
                Expected outcomes
              </TabButton>
            </div>
          )}

          <div className="flex flex-1 min-h-0 flex-col items-start w-full overflow-x-clip overflow-y-auto chat-scroll">
            {children}
          </div>
        </div>

        {/* Bottom bar: Find another agent + pagination */}
        <div className="flex items-center justify-between p-10 w-full shrink-0 relative">
          {showBottomFade && (
            <div
              className="absolute left-10 right-10 top-[-80px] h-20 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(5,5,5,0), rgba(5,5,5,1))",
              }}
              aria-hidden
            />
          )}

          <button
            type="button"
            onClick={onFindAnother}
            className="bg-[#0a0a0a] border border-[#2a2a2a] flex gap-2 items-center justify-center overflow-hidden px-4 py-2 rounded-lg hover:bg-[#111] transition-colors duration-[180ms]"
          >
            <span className="font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#e5e5e5] text-center whitespace-nowrap">
              Find another agent
            </span>
          </button>

          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canPrev}
              aria-label="Previous agent"
              className="bg-[#111] border border-[#2a2a2a] flex items-center justify-center p-2 rounded-lg shrink-0 hover:bg-[#1a1a1a] transition-colors duration-[180ms] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} className="text-[#e5e5e5]" strokeWidth={1.75} />
            </button>

            <span className="font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#e5e5e5] text-center whitespace-nowrap tabular-nums">
              {currentStep}/{totalSteps}
            </span>

            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              aria-label="Next agent"
              className="bg-[#111] border border-[#2a2a2a] flex items-center justify-center p-2 rounded-lg shrink-0 hover:bg-[#1a1a1a] transition-colors duration-[180ms] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} className="text-[#e5e5e5]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab button (internal) ─────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 gap-2 items-center justify-center overflow-hidden px-4 py-2 rounded-lg min-w-0 transition-colors duration-[180ms]",
        active ? "bg-[#e5e5e5]" : "bg-transparent hover:bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-center whitespace-nowrap",
          active ? "text-[#111]" : "text-[#a3a3a3]",
        )}
      >
        {children}
      </span>
    </button>
  )
}

// ─── Result helpers (composable in children) ───────────────────

/** Numbered task/outcome list. Used for V1 (current) and V2 (future) variants. */
export function AgentTaskList({
  tasks,
  boxed = false,
  className,
}: {
  tasks: AgentTask[]
  /** When true, wraps in the bordered card treatment (V2 variant). */
  boxed?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 items-start overflow-clip px-4 rounded-[16px] w-full shrink-0",
        boxed
          ? "bg-[#111] border border-[#2a2a2a] pt-4 pb-10"
          : "pb-10",
        className,
      )}
    >
      {tasks.map((task, idx) => (
        <div
          key={task.id}
          className="flex gap-4 items-center py-2 w-full shrink-0 min-h-[56px]"
        >
          <div className="bg-[#111] flex items-center justify-center p-2 rounded-full size-10 shrink-0">
            <span className="font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#e5e5e5] text-center whitespace-nowrap tabular-nums">
              {task.label ?? idx + 1}
            </span>
          </div>
          <p
            className={cn(
              "flex-1 min-w-0 font-medium text-[16px] leading-[1.4] tracking-[-0.01em]",
              task.muted ? "text-[#737373]" : "text-[#a3a3a3]",
            )}
          >
            {task.text}
          </p>
        </div>
      ))}
    </div>
  )
}

/** Long-form text block with heading/body — used for "Text result" variant. */
export function AgentTextResult({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-[#111] border border-[#404040] rounded-[16px] flex items-center justify-center pt-6 pb-10 px-6 w-full shrink-0",
        className,
      )}
    >
      <div className="flex-1 min-w-0 font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#e5e5e5] whitespace-pre-wrap">
        {children}
      </div>
    </div>
  )
}

/** Data table — used for "Table result" variant. */
export function AgentTableResult({
  columns,
  className,
}: {
  columns: AgentTableColumn[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-[#111] border border-[#1c1c1c] rounded-[16px] flex flex-1 min-h-0 flex-col items-start overflow-auto pl-6 pr-10 py-6 w-full",
        className,
      )}
    >
      <div className="flex pb-10 rounded-[16px] shrink-0">
        {columns.map((col, i) => (
          <div
            key={i}
            className="flex flex-col items-start justify-center shrink-0"
            style={{ width: col.width ?? 408 }}
          >
            <div className="border-b border-[#404040] flex gap-2 items-center p-2 w-full shrink-0">
              <p className="flex-1 min-w-0 font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#737373] overflow-hidden text-ellipsis whitespace-nowrap">
                {col.header}
              </p>
            </div>
            {col.rows.map((row, j) => (
              <div
                key={j}
                className="flex gap-2 items-center p-2 rounded-lg w-full shrink-0"
              >
                <p className="flex-1 min-w-0 font-medium text-[16px] leading-[1.4] tracking-[-0.01em] text-[#e5e5e5] overflow-hidden text-ellipsis whitespace-nowrap">
                  {row}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Horizontal scrollable image preview row — used for "Image result" variant. */
export function AgentImageGrid({
  images,
  className,
}: {
  images: AgentImagePreview[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-[#111] border border-[#2a2a2a] rounded-[16px] flex gap-6 items-center overflow-x-auto overflow-y-clip pl-4 pr-10 py-4 w-full shrink-0 chat-scroll",
        className,
      )}
    >
      {images.map((img, i) => (
        <ImagePreviewCard key={i} src={img.src} url={img.url} alt={img.alt} />
      ))}
    </div>
  )
}

function ImagePreviewCard({ src, url, alt }: AgentImagePreview) {
  return (
    <div className="flex flex-col h-[264px] w-[295px] items-start justify-end overflow-clip rounded-[16px] shrink-0 relative">
      <div className="flex-1 min-h-0 relative w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? url}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
      </div>
      <div className="bg-[#111] flex gap-2 items-center justify-center px-4 py-1 w-full shrink-0">
        <span className="flex-1 min-w-0 font-semibold text-[16px] leading-[1.4] tracking-[-0.02em] text-[#737373] truncate">
          {url}
        </span>
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${url}`}
          className="flex items-center justify-center p-2 rounded-lg size-6 shrink-0 hover:bg-white/[0.04] transition-colors duration-[180ms]"
        >
          <ArrowRight size={20} className="text-[#737373]" strokeWidth={1.75} />
        </a>
      </div>
    </div>
  )
}
