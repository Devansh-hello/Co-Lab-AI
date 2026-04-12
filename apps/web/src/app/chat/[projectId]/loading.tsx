export default function ChatLoading() {
  return (
    <main className="fixed inset-0 z-40 flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold-500/30 border-t-gold-500" />
        <span className="text-[12px] text-white/60">Loading chat...</span>
      </div>
    </main>
  )
}
