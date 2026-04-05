# Project Changelog

## Architecture
- Decided on Turborepo for monorepo structure.
## Database
- Selected Turso (SQLite) for dynamic project provisioning.
## Agents
- Implemented strict API contract generation via Orchestrator.
## Frontend
- Standardized on Next.js 16 (App Router) + React 19 + Tailwind CSS.
## Auth
- Utilizing JWTs and secure HttpOnly cookies for session management.
## Performance
- Focusing on reducing token overhead in agent communication loops.
## WebSockets
- Streaming active execution states directly to the React UI.
## Testing
- Test Agent will generate independent test suites strictly from the Orchestrator API contract.
## Security
- Ensuring all generated code is sandboxed tightly within WebContainers isolated context.
