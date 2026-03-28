import { useState, useEffect, useCallback } from "react"
import { api } from "../functions/send"

interface DatabaseInfo {
  projectId: string
  dbName: string
  storageMB: number
  hostname: string
}

interface StorageUsage {
  usedMB: number
  limitMB: number
  percentage: number
  databases: DatabaseInfo[]
  isLoading: boolean
  isAvailable: boolean
  refresh: () => void
}

export function useStorageUsage(): StorageUsage {
  const [data, setData] = useState<{
    usedMB: number; limitMB: number; percentage: number; databases: DatabaseInfo[]
  }>({ usedMB: 0, limitMB: 250, percentage: 0, databases: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [statusRes, usageRes] = await Promise.all([
        api.get("/turso/status").catch(() => null),
        api.get("/turso/usage").catch(() => null),
      ])

      if (statusRes?.data?.available) {
        setIsAvailable(true)
      }

      if (usageRes?.data) {
        setData({
          usedMB: usageRes.data.usedMB || 0,
          limitMB: usageRes.data.limitMB || 250,
          percentage: usageRes.data.percentage || 0,
          databases: usageRes.data.databases || [],
        })
      }
    } catch { /* ignore */ }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    // Refresh every 60 seconds
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { ...data, isLoading, isAvailable, refresh }
}
