'use client';

/**
 * File Creation Live
 *
 * Real-time file tree that grows as the AI generates code.
 * Files appear with staggered entrance animations, grouped by directory.
 * Active files show a breathing emerald dot; completed files dim.
 *
 * Design: Monospace file tree with indentation guides, glass background,
 * emerald (frontend) / blue (backend) color coding.
 */

import React, { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  FileCode2, FileJson, FileText, FileCog,
  FolderOpen, ChevronRight
} from 'lucide-react';

interface FileEntry {
  path: string;
  status: 'creating' | 'done';
  agent: 'frontend' | 'backend';
}

interface FileCreationLiveProps {
  files: FileEntry[];
}

// ─── Icon resolver ──────────────────────────────────────────────

function getIcon(name: string) {
  if (name.endsWith('.json')) return FileJson;
  if (name.endsWith('.css') || name.endsWith('.html') || name.endsWith('.md')) return FileText;
  if (name.includes('config') || name.includes('.env')) return FileCog;
  return FileCode2;
}

// ─── File tree builder ──────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: FileEntry;
  depth: number;
}

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    let pathSoFar = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      pathSoFar += (i > 0 ? '/' : '') + part;
      const isLast = i === parts.length - 1;

      let existing = current.find(n => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: pathSoFar,
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
          depth: i,
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  return root;
}

function flattenTree(nodes: TreeNode[], depth = 0): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    result.push({ ...node, depth });
    if (node.isDir) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// ─── Main Component ─────────────────────────────────────────────

export default function FileCreationLive({ files }: FileCreationLiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => flattenTree(buildTree(files)), [files]);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(containerRef.current,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
  }, []);

  if (files.length === 0) return null;

  const creatingCount = files.filter(f => f.status === 'creating').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <FolderOpen size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <span className="text-xs font-mono uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
            Generated Files
          </span>
        </div>
        <div className="flex items-center gap-4">
          {creatingCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-mono"
                  style={{ color: '#10b981' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {creatingCount} writing
            </span>
          )}
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
            {doneCount}/{files.length}
          </span>
        </div>
      </div>

      {/* File tree */}
      <div className="px-2 py-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
        {tree.map((node, i) => (
          <FileTreeRow key={node.path} node={node} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Tree Row ───────────────────────────────────────────────────

function FileTreeRow({ node, index }: { node: TreeNode; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const isCreating = node.file?.status === 'creating';
  const agent = node.file?.agent;
  const agentColor = agent === 'frontend' ? '#10b981' : agent === 'backend' ? '#3b82f6' : '#D4AF37';

  useGSAP(() => {
    if (!rowRef.current) return;
    gsap.fromTo(rowRef.current,
      { opacity: 0, x: -6 },
      { opacity: 1, x: 0, duration: 0.2, delay: Math.min(index * 0.03, 0.5), ease: 'power2.out' }
    );
  }, []);

  const Icon = node.isDir ? FolderOpen : getIcon(node.name);

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-2 py-1 rounded hover:bg-white/[0.02] transition-colors group"
      style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
    >
      {/* Indent guide */}
      {node.depth > 0 && (
        <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.08)' }} />
      )}

      {/* Icon */}
      <Icon size={12}
            style={{
              color: node.isDir
                ? 'rgba(255,255,255,0.18)'
                : isCreating ? agentColor : 'rgba(255,255,255,0.18)',
            }} />

      {/* Name */}
      <span
        className="text-xs font-mono truncate"
        style={{
          color: node.isDir
            ? 'rgba(255,255,255,0.3)'
            : isCreating ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.3)',
        }}
      >
        {node.name}
      </span>

      {/* Active indicator */}
      {isCreating && !node.isDir && (
        <div className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
             style={{ background: agentColor }} />
      )}
    </div>
  );
}
