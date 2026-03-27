/**
 * Pipeline Type Definitions
 *
 * Shared interfaces for data flowing through the agent pipeline.
 * Replaces `any` with concrete types across all agents.
 */

/** Map of file paths to their contents (output of code agents) */
export type CodeMap = Record<string, string>;

/** API endpoint definition in the orchestrator's contract */
export interface ApiEndpoint {
    method: string;
    path: string;
    description: string;
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
}

/** Complexity assessment from the orchestrator */
export interface Complexity {
    overall: number;
    reasoning?: string;
}

/** Task definition for a single agent work item */
export interface AgentTask {
    description: string;
    file?: string;
    details?: string;
}

/** Orchestrator output — the task file that drives all downstream agents */
export interface TaskFile {
    intent: "build" | "iterate" | "debug";
    projectName?: string;
    features?: string[];
    apiContract?: {
        endpoints: ApiEndpoint[];
        models?: Record<string, unknown>[];
    };
    frontendTasks?: AgentTask[];
    backendTasks?: AgentTask[];
    database?: string;
    complexity?: Complexity;
    packages?: { frontend?: string[]; backend?: string[] };
}

/** Snapshot of a project's generated code */
export interface ProjectSnapshotData {
    frontendCode?: CodeMap | null;
    backendCode?: CodeMap | null;
    taskFile?: TaskFile | null;
}

/** Review agent output */
export interface ReviewResult {
    completionStatus: {
        frontendComplete: boolean;
        backendComplete: boolean;
        missingItems: string[];
    };
    apiCompatibility: {
        compatible: boolean;
        mismatches: string[];
    };
    setupGuide: {
        prerequisites: string[];
        steps: string[];
        envVariables: string[];
        runCommands: { frontend: string; backend: string };
    };
    codeReview: {
        criticalIssues: string[];
        suggestions: string[];
        actionableFixes?: string[];
    };
    qualityScore: {
        grade: string;
        metrics: {
            completeness: number;
            security: number;
            compatibility: number;
            codeQuality: number;
        };
        overall: number;
    };
    summary: string;
}

/** Test agent output */
export interface TestResult {
    testSuite: {
        totalTests: number;
        categories: {
            basic: TestCase[];
            edge: TestCase[];
            integration: TestCase[];
            security: TestCase[];
        };
    };
    contractValidation: {
        endpointsCovered: string[];
        endpointsMissing: string[];
        modelsCovered: string[];
        fieldMismatches: string[];
    };
    testFiles?: CodeMap;
    coverage: {
        endpointCoverage: number;
        featureCoverage: number;
        securityCoverage: number;
    };
    summary: string;
}

export interface TestCase {
    name: string;
    description: string;
    target: string;
    priority: "critical" | "high" | "medium" | "low";
}

/** Conversation history message (lean MongoDB doc) */
export interface ConversationMessage {
    userMessage: string;
    intent?: string;
    coordinatorResponse?: { content: TaskFile };
    frontendResponse?: { content: CodeMap };
    backendResponse?: { content: CodeMap };
}
