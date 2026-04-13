import { useState, useCallback, useRef, useEffect } from "react"
import { getWebContainer, filesToFileSystemTree } from "../lib/webcontainer"
import type { WebContainer } from "@webcontainer/api"

export type ContainerStatus = "idle" | "booting" | "mounting" | "installing" | "starting" | "running" | "error"

interface UseWebContainerReturn {
  status: ContainerStatus
  previewUrl: string | null
  backendUrl: string | null
  terminalOutput: string[]
  error: string | null
  boot: (frontendFiles: Record<string, string>, backendFiles: Record<string, string>, tursoEnv?: Record<string, string>) => Promise<void>
  stop: () => void
  writeFile: (path: string, content: string) => Promise<void>
  runInContainer: (cmd: string, args: string[]) => Promise<string>
}

export function useWebContainer(): UseWebContainerReturn {
  const [status, setStatus] = useState<ContainerStatus>("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [backendUrl, setBackendUrl] = useState<string | null>(null)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<WebContainer | null>(null)
  const processesRef = useRef<any[]>([])

  const addOutput = useCallback((chunk: string) => {
    // Clean up npm spinner chars and ANSI escape codes
    const cleaned = chunk
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')  // strip ANSI escapes
      .replace(/\r/g, '')                       // strip carriage returns
      .replace(/\[0K/g, '')                     // strip clear-line codes

    // Split by newlines and filter out spinner-only lines
    const lines = cleaned.split('\n').filter(line => {
      const trimmed = line.trim()
      // Skip empty lines and pure spinner chars
      if (!trimmed) return false
      if (/^[\\|/\-⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]{1,2}$/.test(trimmed)) return false
      return true
    })

    if (lines.length > 0) {
      setTerminalOutput(prev => [...prev.slice(-200), ...lines])
    }
  }, [])

  const stop = useCallback(() => {
    for (const p of processesRef.current) {
      try { p.kill() } catch { /* ignore */ }
    }
    processesRef.current = []
    setStatus("idle")
    setPreviewUrl(null)
  }, [])

  const boot = useCallback(async (
    frontendFiles: Record<string, string>,
    backendFiles: Record<string, string>,
    tursoEnv?: Record<string, string>
  ) => {
    try {
      setError(null)
      setTerminalOutput([])
      setPreviewUrl(null)
      setBackendUrl(null)

      // 1. Check if SharedArrayBuffer is available
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error(
          "SharedArrayBuffer is not available in this browser. Try restarting the dev server or using a Chromium-based browser."
        )
      }

      // 2. Boot container
      setStatus("booting")
      addOutput("$ Booting WebContainer...")
      const container = await getWebContainer()
      containerRef.current = container

      // 2. Mount files
      setStatus("mounting")
      addOutput("$ Mounting project files...")

      const hasBackend = Object.keys(backendFiles).length > 0
      const hasFrontend = Object.keys(frontendFiles).length > 0

      // Build file tree structure
      const tree = filesToFileSystemTree({
        ...Object.fromEntries(
          Object.entries(frontendFiles).map(([k, v]) => [hasFrontend && hasBackend ? `frontend/${k}` : k, v])
        ),
        ...Object.fromEntries(
          Object.entries(backendFiles).map(([k, v]) => [hasFrontend && hasBackend ? `backend/${k}` : k, v])
        ),
      })

      // Ensure frontend has a proper package.json with vite deps
      if (hasFrontend) {
        let frontendPkg: any
        try {
          frontendPkg = frontendFiles["package.json"] ? JSON.parse(frontendFiles["package.json"]) : {}
        } catch { frontendPkg = {} }

        // Ensure essential fields
        if (!frontendPkg.name) frontendPkg.name = "frontend"
        frontendPkg.private = true
        if (!frontendPkg.scripts) frontendPkg.scripts = {}
        if (!frontendPkg.scripts.dev) frontendPkg.scripts.dev = "npx vite --port 5173 --host"
        if (!frontendPkg.dependencies) frontendPkg.dependencies = {}

        const isReactProject = Object.values(frontendFiles).some(c => /from\s+['"]react['"]/.test(c))

        // Always ensure vite + react deps for React projects
        if (isReactProject) {
          if (!frontendPkg.dependencies["react"]) frontendPkg.dependencies["react"] = "^18.3.1"
          if (!frontendPkg.dependencies["react-dom"]) frontendPkg.dependencies["react-dom"] = "^18.3.1"
          frontendPkg.dependencies["vite"] = "^5.4.0"
          frontendPkg.dependencies["@vitejs/plugin-react"] = "^4.3.0"
        }

        // Auto-detect additional deps from import statements
        const allFrontendCode = Object.values(frontendFiles).join("\n")
        const depDetect: Record<string, string> = {
          "react-router-dom": "^6.26.0", "axios": "^1.7.0", "zustand": "^4.5.0",
          "framer-motion": "^11.0.0", "@tanstack/react-query": "^5.0.0",
          "lucide-react": "^0.400.0", "react-icons": "^5.0.0",
          "react-hook-form": "^7.53.0", "zod": "^3.23.0",
          "tailwindcss": "^3.4.0", "@headlessui/react": "^2.0.0",
          "clsx": "^2.1.0", "date-fns": "^3.0.0",
        }
        for (const [pkg, ver] of Object.entries(depDetect)) {
          if (allFrontendCode.includes(`'${pkg}'`) || allFrontendCode.includes(`"${pkg}"`)) {
            if (!frontendPkg.dependencies[pkg]) frontendPkg.dependencies[pkg] = ver
          }
        }

        // Helper to get the target directory for frontend files
        const getFrontendDir = () => {
          if (hasBackend) {
            const feDir = tree["frontend"] as any
            return feDir?.directory
          }
          return tree
        }
        const feTarget = getFrontendDir()

        // Ensure index.html exists (critical for Vite)
        const hasIndexHtml = Object.keys(frontendFiles).some(k => k === "index.html")
        if (!hasIndexHtml && isReactProject && feTarget) {
          feTarget["index.html"] = { file: { contents: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>App</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>` } }
        }

        // Ensure vite.config exists for frontend-only projects
        if (!hasBackend) {
          const hasViteConfig = Object.keys(frontendFiles).some(k => k.includes("vite.config"))
          if (!hasViteConfig && isReactProject && feTarget) {
            feTarget["vite.config.js"] = { file: { contents: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({ plugins: [react()] })\n` } }
          }
        }

        const pkgContent = JSON.stringify(frontendPkg, null, 2)
        if (feTarget) {
          feTarget["package.json"] = { file: { contents: pkgContent } }
        }
      }

      // Ensure frontend has a vite config with backend proxy
      if (hasFrontend && hasBackend) {
        const hasViteConfig = Object.keys(frontendFiles).some(k => k.includes("vite.config"))
        if (!hasViteConfig) {
          const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})
`
          const feDir = tree["frontend"] as any
          if (feDir?.directory) {
            feDir.directory["vite.config.js"] = { file: { contents: viteConfigContent } }
          }
        }
      }

      if (hasBackend) {
        let backendPkg: any
        try {
          backendPkg = backendFiles["package.json"] ? JSON.parse(backendFiles["package.json"]) : {}
        } catch { backendPkg = {} }

        if (!backendPkg.name) backendPkg.name = "backend"
        backendPkg.private = true
        if (!backendPkg.scripts) backendPkg.scripts = {}
        if (!backendPkg.dependencies) backendPkg.dependencies = {}

        // Auto-detect and ensure common backend deps from code
        const allBackend = Object.values(backendFiles).join("\n")
        const autoDetect: Record<string, string> = {
          "express": "^4.21.0", "cors": "^2.8.5", "mongoose": "^8.0.0",
          "jsonwebtoken": "^9.0.0", "bcryptjs": "^2.4.3", "dotenv": "^16.4.0",
          "@libsql/client": "^0.14.0", "zod": "^3.23.0", "better-sqlite3": "^11.0.0",
        }
        for (const [pkg, ver] of Object.entries(autoDetect)) {
          if (allBackend.includes(pkg.replace(/[@/]/g, '')) && !backendPkg.dependencies[pkg]) {
            backendPkg.dependencies[pkg] = ver
          }
        }
        // bcrypt special case
        if (allBackend.includes("bcrypt") && !backendPkg.dependencies["bcryptjs"]) {
          backendPkg.dependencies["bcryptjs"] = "^2.4.3"
        }

        const pkgContent = JSON.stringify(backendPkg, null, 2)
        if (hasFrontend) {
          const beDir = tree["backend"] as any
          if (beDir?.directory) {
            beDir.directory["package.json"] = { file: { contents: pkgContent } }
          }
        } else {
          tree["package.json"] = { file: { contents: pkgContent } } as any
        }
      }

      await container.mount(tree)

      // 3. Listen for server-ready events
      container.on("server-ready", (port: number, url: string) => {
        addOutput(`$ Server ready on port ${port}: ${url}`)
        if (port === 5173 || port === 5174 || port === 4173) {
          // Frontend dev server
          setPreviewUrl(url)
        } else if (port === 3000 || port === 8080 || port === 4000 || port === 5000) {
          // Backend server
          setBackendUrl(url)
          // If no frontend, use backend URL as preview
          if (!hasFrontend) setPreviewUrl(url)
        } else {
          // Unknown port — use as preview if we don't have one
          setPreviewUrl(prev => prev || url)
        }
      })

      // 4. Install dependencies
      setStatus("installing")

      const installInDir = async (dir: string) => {
        addOutput(`$ cd ${dir} && npm install`)
        const installProcess = await container.spawn("npm", ["install"], { cwd: dir })
        installProcess.output.pipeTo(new WritableStream({
          write(chunk) { addOutput(chunk) },
        }))
        const exitCode = await installProcess.exit
        if (exitCode !== 0) throw new Error(`npm install failed in ${dir} (exit ${exitCode})`)
      }

      if (hasFrontend && hasBackend) {
        // Install both
        await Promise.all([installInDir("frontend"), installInDir("backend")])
      } else if (hasFrontend) {
        await installInDir(".")
      } else if (hasBackend) {
        await installInDir(".")
      }

      // 5. Start servers
      setStatus("starting")

      // Auto-detect env vars needed from backend code (.env.example or process.env references)
      const autoEnv: Record<string, string> = {
        PORT: "3000",
        NODE_ENV: "development",
        JWT_SECRET: "dev-secret-change-in-production",
        SESSION_SECRET: "dev-session-secret",
        MONGO_URI: "mongodb://localhost:27017/app",
        MONGODB_URI: "mongodb://localhost:27017/app",
        DATABASE_URL: "file:local.db",
      }

      // Parse .env.example if present to pick up any custom var names
      const envExample = backendFiles[".env.example"] || backendFiles[".env"]
      if (envExample) {
        for (const line of envExample.split("\n")) {
          const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)/)
          if (m && !autoEnv[m[1]]) {
            autoEnv[m[1]] = m[2] || "dev-placeholder"
          }
        }
      }

      const env: Record<string, string> = {
        ...autoEnv,
        ...tursoEnv,
      }

      if (hasBackend) {
        const backendDir = hasFrontend ? "backend" : "."
        // Find the entry point
        const entryFile = backendFiles["server.js"] ? "server.js"
          : backendFiles["index.js"] ? "index.js"
          : backendFiles["app.js"] ? "app.js"
          : backendFiles["server.ts"] ? "server.ts"
          : backendFiles["index.ts"] ? "index.ts"
          : "server.js"

        addOutput(`$ cd ${backendDir} && node ${entryFile}`)
        const backendProcess = await container.spawn("node", [entryFile], { cwd: backendDir, env })
        processesRef.current.push(backendProcess)
        backendProcess.output.pipeTo(new WritableStream({
          write(chunk) { addOutput(chunk) },
        }))
      }

      if (hasFrontend) {
        const frontendDir = hasBackend ? "frontend" : "."
        addOutput(`$ cd ${frontendDir} && npx vite --port 5173 --host`)
        const frontendProcess = await container.spawn("npx", ["vite", "--port", "5173", "--host"], {
          cwd: frontendDir, env: { ...env, PORT: "5173" },
        })
        processesRef.current.push(frontendProcess)
        frontendProcess.output.pipeTo(new WritableStream({
          write(chunk) { addOutput(chunk) },
        }))
      }

      setStatus("running")
    } catch (err: any) {
      console.error("[webcontainer] Error:", err)
      setError(err.message || "WebContainer failed")
      setStatus("error")
      addOutput(`$ ERROR: ${err.message}`)
    }
  }, [addOutput, previewUrl])

  const writeFile = useCallback(async (path: string, content: string) => {
    if (containerRef.current) {
      await containerRef.current.fs.writeFile(path, content)
    }
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  const runInContainer = useCallback(async (cmd: string, args: string[]): Promise<string> => {
    if (!containerRef.current) return ''
    let output = ''
    const proc = await containerRef.current.spawn(cmd, args)
    proc.output.pipeTo(new WritableStream({
      write(chunk) { output += chunk },
    }))
    await proc.exit
    return output
  }, [])

  return { status, previewUrl, backendUrl, terminalOutput, error, boot, stop, writeFile, runInContainer }
}
