# Co-Lab AI

**The Multi-Agent AI Platform That Builds Full-Stack Web Applications**

Co-Lab AI is a research-driven, multi-agent AI coding platform that generates complete, working full-stack web applications. By utilizing a specialized team of AI agents, Co-Lab AI divides software development tasks—planning, frontend UI, backend API, review, and testing—into distinct expert roles, mimicking a real engineering team.

---

## 1. Overview

Unlike single-shot generalist chatbots (which output unvalidated code blobs), Co-Lab AI leverages a coordinated pipeline grounded in explicit API contracts and parallel generation. The system handles the entire software lifecycle:
- **Understanding Agent:** Analyzes project requirements, flags ambiguity, and asks clarifying questions.
- **Orchestrator Agent:** Plans the architecture, selects the optimal technology stack, and writes a formal API contract.
- **Frontend Agent & Backend Agent:** Develop the user interface and server environment in parallel, ensuring cross-compatibility through the strict API contract.
- **Review Agent:** Verifies feature completeness, endpoint compatibility, and platform security.
- **Test Agent:** Generates independent test coverage against the initial specification to prevent implementation bias.
- **Feedback & Fix Agent:** Retrieves automatic reports from the Quality Scorer and selectively re-runs the necessary agents to fix breakage autonomously over multiple feedback loops.

## 2. Key Features

- **Multi-Agent Pipeline:** 6 specialized autonomous agents handling distinct stages of software development.
- **API Contract Specification:** Frontend and backend share a common contract, guaranteeing cross-layer robustness.
- **Independent Test Generation:** Unit and integration tests evaluate the software against the architectural specification rather than the generated code.
- **Automated Quality Scoring:** A supervisory scoring function evaluates generated output across completeness, security, API compatibility, code cleanliness, and test coverage (graded A-F).
- **Human-in-the-Loop Checks:** The platform requires user review and approval of the architectural plan prior to resource-intensive code generation.
- **In-Browser Execution Environment:** Embedded WebContainer allows zero-configuration live previews of your generated application directly within the browser interface.

## 3. Technology Stack

The platform's core applications are designed around a modern full-stack ecosystem:
- **Frontend Workspace:** React 19, TypeScript, Tailwind CSS, Next.js 16 (App Router), GSAP, Monaco Editor, WebContainer API.
- **Backend Workspace:** Node.js, Express 5, TypeScript, Mongoose, WebSockets (`ws`).
- **Data Persistence:** MongoDB Atlas for platform data, Turso/SQLite for dynamic project database provisioning.
- **AI Infrastructure:** Modular abstraction layer supporting OpenAI, Anthropic, Google GenAI, OpenRouter, and GLM.

## 4. Platform Architecture

The project is structured as an NPM Workspaces monorepo orchestrated by Turborepo:
- `apps/web/`: The React-based frontend client, interactive chat interface, and embedded terminal IDE.
- `apps/api/`: The Express-based backend application handling authentication, REST endpoints, structured memory, and the real-time agent pipeline.

### Communication Flow
- **HTTP / REST:** Manages Authentication, Project CRUD, and Settings.
- **WebSockets:** Underpins the real-time agent pipeline via token-by-token streaming, continuous status updates, and dynamic phase changes.
- **WebContainers:** In-browser Node.js runtime executing the finalized code for local, safe evaluation securely bounded to the frontend.

## 5. Built on Research

The architectural decisions driving Co-Lab AI's specialized orchestration combine insights from multiple academic papers across tier-1 AI conferences (ICLR, NeurIPS, ACL, FSE). 

Core methodologies feature:
- **Structured Communication & Contracts:** (Inspired by MetaGPT & MAGIS) Utilizing publish-subscribe patterns and SOP-based execution where frontend and backend are constrained strictly by the Orchestrator's API contract.
- **Independent Verifications:** (AgentCoder principles) Test suites are drafted against specifications rather than the LLM's initial output to prevent test hallucination bias. 
- **Token Efficiency & Context Reduction:** (AgentDiet / AgentDropout patterns) Trajectory filtration selectively routes context data. The Feedback loop drops agents with zero issues to save computation overhead, isolating the prompt fix to specifically damaged components.
- **Chain-of-Verification Outputs:** Agent outputs pass through validation checkpoints parsing JSON schema, with real-time automatic retries on invalid shapes without human intervention.

## 6. Getting Started

### Prerequisites
- Node.js (v18+) and standard node package manager (`npm`).
- Active API tokens for AI providers (e.g., OpenAI, Anthropic, Gemini) and Database URIs (MongoDB/Turso).

### Installation & Launch
1. Clone the repository to your local environment.
2. Install dependencies mapping the monorepo packages from the project root:
   ```bash
   npm install
   ```
3. Establish your environment files using the respective root directories of each workspace:
   - Provide database URIs and LLM provider tokens in `apps/api/.env`.
   - Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your configuration keys.
4. Start the development server using the Turborepo concurrent execution profile:
   ```bash
   npm run dev
   ```
   Both the Frontend interface and the Backend REST/WebSocket server will initialize simultaneously.

---

## Development Status
This project is continuously evolving. Expect frequent updates and new agent behaviors.
