import { WebContainer, type FileSystemTree } from "@webcontainer/api"

let instance: WebContainer | null = null
let booting = false

export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance
  if (booting) {
    // Wait for existing boot to complete
    while (booting) await new Promise(r => setTimeout(r, 100))
    if (instance) return instance
  }

  booting = true
  try {
    instance = await WebContainer.boot()
    return instance
  } finally {
    booting = false
  }
}

export function teardownWebContainer() {
  if (instance) {
    instance.teardown()
    instance = null
  }
}

/**
 * Convert a flat file map { "src/App.tsx": "code..." } into WebContainer FileSystemTree format
 */
export function filesToFileSystemTree(files: Record<string, string>): FileSystemTree {
  const tree: FileSystemTree = {}

  for (const [path, content] of Object.entries(files)) {
    const parts = path.replace(/^\.\//, "").split("/")
    let current: any = tree

    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i]
      if (!current[dir]) {
        current[dir] = { directory: {} }
      }
      current = current[dir].directory
    }

    const filename = parts[parts.length - 1]
    current[filename] = { file: { contents: content } }
  }

  return tree
}

/**
 * Generate a root package.json that includes dependencies from both frontend and backend
 */
export function generateRootPackageJson(
  frontendFiles: Record<string, string>,
  backendFiles: Record<string, string>
): string {
  const deps: Record<string, string> = {}
  const allCode = [...Object.values(frontendFiles), ...Object.values(backendFiles)].join("\n")

  // Common dependency detection from imports
  const importRegex = /(?:import|require)\s*\(?['"]([^'"./][^'"]*)['"]\)?/g
  let match
  while ((match = importRegex.exec(allCode)) !== null) {
    let pkg = match[1]
    // Handle scoped packages like @scope/pkg
    if (pkg.startsWith("@")) {
      const parts = pkg.split("/")
      pkg = parts.slice(0, 2).join("/")
    } else {
      pkg = pkg.split("/")[0]
    }

    // Skip built-in Node modules
    const builtins = new Set([
      "fs", "path", "http", "https", "url", "os", "crypto", "stream",
      "events", "util", "querystring", "buffer", "child_process", "net",
      "tls", "zlib", "dns", "cluster", "readline", "assert",
      "fs/promises", "node:fs", "node:path", "node:http", "node:crypto",
    ])
    if (builtins.has(pkg) || pkg.startsWith("node:")) continue

    deps[pkg] = "latest"
  }

  // Add essential deps
  if (Object.values(frontendFiles).some(c => c.includes("from 'react'") || c.includes("from \"react\""))) {
    deps["react"] = "^18.3.1"
    deps["react-dom"] = "^18.3.1"
    deps["vite"] = "^5.4.0"
    deps["@vitejs/plugin-react"] = "^4.3.0"
  }

  return JSON.stringify({
    name: "colab-preview",
    private: true,
    scripts: {
      "dev:frontend": "cd frontend && npx vite --port 5173 --host",
      "dev:backend": "cd backend && node index.js || node server.js || node app.js",
      "dev": "npm run dev:backend & npm run dev:frontend",
      "install:all": "cd frontend && npm install && cd ../backend && npm install",
    },
    dependencies: deps,
  }, null, 2)
}
