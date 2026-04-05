/**
 * WebSocket Shared Types
 *
 * Centralized type definitions for the WebSocket pipeline layer.
 * Used by server.ts, event-emitter, handlers, and the transport layer.
 */

import type { WebSocket } from "ws";
import type { TaskFile, CodeMap, ProjectSnapshotData, ReviewResult, TestResult } from "../agents/types.js";
import type { UserSettings } from "../services/user-settings.js";
import type { UnderstandingResponse } from "../agents/understanding.agent.js";
import type { CircularEventBuffer } from "./event-buffer.js";

// ─── Pipeline State ─────────────────────────────────────────────

/** Tracks the current state of a user's pipeline session */
export interface PipelineState {
    projectId: string;
    userId: string;
    provider: string;
    model: string;
    taskFile: TaskFile | null;
    messageDoc: any; // Mongoose document — typed as any to avoid circular deps
    snapshot: ProjectSnapshotData | null;
    understanding: UnderstandingResponse | null;
    qaAnswers: Array<{ questionId: string; answer: string }> | null;
    pluginContext: string;
    userSettings: UserSettings;
    phase: PipelinePhase;
    feedbackIteration: number;
    frontendResult: CodeMap | null;
    backendResult: CodeMap | null;
}

export type PipelinePhase =
    | 'understanding' | 'qa' | 'planning' | 'building'
    | 'testing' | 'feedback' | 'done' | 'error' | 'cancelled';

// ─── Connection Context ─────────────────────────────────────────

/** Per-connection state managed by the WebSocket server */
export interface ConnectionContext {
    ws: WebSocket;
    userId: string;
    sessionId: string;
    pipeline: PipelineState | null;
    pipelineAbort: AbortController | null;
    pipelineRunId: string | null;
    lastSeq: number;
    eventBuffer: CircularEventBuffer;
    messageTimestamps: number[];
    /** Pending permission prompts: requestId -> resolve function */
    pendingPermissions: Map<string, { resolve: (decision: PermissionDecision) => void }>;
}

// ─── Wire Protocol: Server -> Client ────────────────────────────

export type ServerEvent =
    | { type: 'session'; sessionId: string; seq: number }
    | { type: 'resume_failed'; reason: string; seq?: number }
    | { type: 'status'; agent: string; message: string; provider?: string; model?: string; seq?: number }
    | { type: 'understanding'; summary: string; projectName: string; questions: any[]; seq?: number }
    | { type: 'final_plan'; content: TaskFile; seq?: number }
    | { type: 'frontend_stream'; content: string; accumulated: string; tokenEstimate: number; seq?: number }
    | { type: 'backend_stream'; content: string; accumulated: string; tokenEstimate: number; seq?: number }
    | { type: 'review_stream'; content: string; accumulated: string; tokenEstimate: number; seq?: number }
    | { type: 'test_stream'; content: string; accumulated: string; tokenEstimate: number; seq?: number }
    | { type: 'frontend_complete'; content: CodeMap; seq?: number }
    | { type: 'backend_complete'; content: CodeMap; seq?: number }
    | { type: 'review_complete'; content: ReviewResult; seq?: number }
    | { type: 'test_complete'; content: TestResult; seq?: number }
    | { type: 'complexity_score'; score: number; reasoning: string; seq?: number }
    | { type: 'quality_score'; grade: string; metrics: any; overall: number; needsFeedback: boolean; iteration?: number; seq?: number }
    | { type: 'feedback_iteration'; iteration: number; issues: string[]; message: string; seq?: number }
    | { type: 'token_usage'; agent: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; seq?: number }
    | { type: 'all_complete'; message: string; messageId: string; qualityGrade: string; feedbackIterations: number; seq?: number }
    | { type: 'error'; message: string; seq?: number }
    | { type: 'cancelled'; message: string; seq?: number }
    | { type: 'permission_request'; requestId: string; resource: string; message: string; options: string[]; seq?: number };

// ─── Wire Protocol: Client -> Server ────────────────────────────

export type ClientMessage =
    | { type: 'message'; message: string; projectId: string; provider?: string; model?: string }
    | { type: 'understanding_response'; confirmed: boolean; projectId?: string }
    | { type: 'qa_complete'; answers: Array<{ questionId: string; answer: string }>; projectId?: string }
    | { type: 'proceed'; proceed: boolean; projectId?: string }
    | { type: 'resume'; sessionId: string; lastSeq: number }
    | { type: 'permission_response'; requestId: string; decision: PermissionDecision };

export type PermissionDecision = 'allow' | 'deny' | 'allow_always';

// ─── Event Types (for persistence) ──────────────────────────────

/** All event types that can be persisted and replayed */
export const PERSISTABLE_EVENT_TYPES = [
    'status', 'understanding', 'final_plan',
    'frontend_complete', 'backend_complete', 'review_complete', 'test_complete',
    'complexity_score', 'quality_score', 'feedback_iteration',
    'token_usage', 'all_complete', 'error', 'cancelled',
    'permission_request',
] as const;

/** Stream events are buffered but only persisted at throttled intervals */
export const STREAM_EVENT_TYPES = [
    'frontend_stream', 'backend_stream', 'review_stream', 'test_stream',
] as const;
