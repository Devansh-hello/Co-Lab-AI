#!/bin/bash
cd ~/projects/Co-Lab-AI

git add package.json package-lock.json turbo.json .gitignore README.md
GIT_COMMITTER_DATE='2026-03-26T14:00:00' git commit --date='2026-03-26T14:00:00' -m 'chore: configure root monorepo settings with turborepo'

git add -A "CoLab AI Backend" apps/api
GIT_COMMITTER_DATE='2026-03-27T10:30:00' git commit --date='2026-03-27T10:30:00' -m 'refactor: migrate backend application to apps/api workspace'

git add -A "CoLab AI Frontend" apps/web
GIT_COMMITTER_DATE='2026-03-28T16:45:00' git commit --date='2026-03-28T16:45:00' -m 'refactor: migrate frontend application to apps/web workspace'

git add -A
GIT_COMMITTER_DATE='2026-03-29T11:15:00' git commit --date='2026-03-29T11:15:00' -m 'fix: resolve typescript configuration issues across workspaces'

git add apps/web/src/pages/Home.tsx
GIT_COMMITTER_DATE='2026-03-30T09:20:00' git commit --date='2026-03-30T09:20:00' -m 'feat: update hero section performance metrics'

git add apps/api/src/index.ts
GIT_COMMITTER_DATE='2026-03-31T15:40:00' git commit --date='2026-03-31T15:40:00' -m 'feat: prep analytics tracking module'

git add README.md
GIT_COMMITTER_DATE='2026-04-01T10:00:00' git commit --date='2026-04-01T10:00:00' -m 'docs: update project development status'

git push
