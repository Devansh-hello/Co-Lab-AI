/**
 * JSON Parsing & Validation Service
 *
 * AI models often return JSON wrapped in markdown code blocks or with
 * comments. This module provides robust extraction and optional schema
 * validation with one retry attempt.
 */

import { logger } from "../lib/logger.js";

const log = logger.child({ module: "service.json-parser" });

// ─── JSON Extraction ────────────────────────────────────────────

/**
 * Attempt to parse JSON from text that may contain markdown fences,
 * comments, or surrounding prose. Tries multiple strategies:
 * 1. Direct JSON.parse
 * 2. Extract first {...} block and parse
 * 3. Clean markdown/comments from the block and retry
 * 4. Extract first [...] block (for array responses)
 */
function tryParseJSON(text: string): unknown {
    try { return JSON.parse(text); } catch { /* continue */ }

    /* Strip markdown code fences first */
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) {
        try { return JSON.parse(fenceMatch[1]!); } catch { /* continue */ }
    }

    /* Try extracting the outermost { ... } block */
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
        try { return JSON.parse(objMatch[0]); } catch { /* continue */ }

        /* Try fixing common issues: trailing commas, comments */
        const cleaned = objMatch[0]
            .replace(/```json\s*/g, '').replace(/```\s*/g, '')
            .replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/,\s*([\]}])/g, '$1') // trailing commas
            .trim();
        try { return JSON.parse(cleaned); } catch { /* continue */ }
    }

    /* Try treating the whole text as-is after stripping surrounding prose */
    const trimmed = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    if (trimmed) {
        try { return JSON.parse(trimmed); } catch { /* continue */ }
    }

    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
        try { return JSON.parse(arrMatch[0]); } catch { /* continue */ }
    }

    throw new Error("No valid JSON found in response");
}

/** Public alias for tryParseJSON */
export function extractJSON(text: string): unknown {
    return tryParseJSON(text);
}

// ─── Schema Validation ─────────────────────────────────────────

/** Defines expected type and whether a field is required */
export interface SchemaField {
    required?: boolean;
    type?: string;
}

/**
 * Validate that `data` has the expected shape. Returns an array of
 * error messages (empty = valid).
 *
 * Inspired by rule-based multi-agent hallucination mitigation (MDPI 2025):
 * validates agent output structure to catch malformed responses early.
 */
export function validateShape(data: any, shape: Record<string, SchemaField>): string[] {
    const errors: string[] = [];
    if (!data || typeof data !== 'object') return ['Output is not a JSON object'];

    for (const [key, spec] of Object.entries(shape)) {
        if (spec.required && !(key in data)) {
            errors.push(`Missing required field: "${key}"`);
        }
        if (key in data && spec.type && typeof data[key] !== spec.type && spec.type !== 'any') {
            if (spec.type === 'array' && !Array.isArray(data[key])) {
                errors.push(`"${key}" should be an array`);
            } else if (spec.type !== 'array') {
                errors.push(`"${key}" should be ${spec.type}, got ${typeof data[key]}`);
            }
        }
    }
    return errors;
}

// ─── Pre-defined Shapes for Agent Outputs ───────────────────────

/** Expected shape of Orchestrator agent output */
export const ORCHESTRATOR_SHAPE: Record<string, SchemaField> = {
    intent: { required: true, type: 'string' },
    projectMeta: { required: true, type: 'object' },
    apiContract: { required: true, type: 'object' },
    features: { required: true, type: 'any' },
    frontendTasks: { required: true, type: 'any' },
    backendTasks: { required: true, type: 'any' },
};

/** Expected shape of Review agent output */
export const REVIEW_SHAPE: Record<string, SchemaField> = {
    completionStatus: { required: true, type: 'object' },
    apiCompatibility: { required: true, type: 'object' },
    setupGuide: { required: true, type: 'object' },
    codeReview: { required: true, type: 'object' },
    summary: { required: true, type: 'string' },
};

/** Expected shape of Test agent output */
export const TEST_SHAPE: Record<string, SchemaField> = {
    testSuite: { required: true, type: 'object' },
    coverage: { required: true, type: 'object' },
    summary: { required: true, type: 'string' },
};

// ─── Extract + Validate with Retry ──────────────────────────────

/**
 * Extract JSON from text, validate against a schema shape, and optionally
 * retry once with a tighter prompt if validation fails.
 *
 * @param text     - Raw AI response text
 * @param shape    - Expected schema shape
 * @param retryFn  - Optional function to re-call the AI if validation fails
 * @returns Parsed and (best-effort) validated data
 */
export async function extractAndValidate(
    text: string,
    shape: Record<string, SchemaField>,
    retryFn?: () => Promise<string>
): Promise<any> {
    try {
        const data = extractJSON(text) as any;
        const errors = validateShape(data, shape);
        if (errors.length === 0) return data;

        /* Validation failed - retry once if a retry function was provided */
        if (retryFn) {
            log.warn({ errors }, "schema validation failed, retrying");
            const retryText = await retryFn();
            try {
                const retryData = extractJSON(retryText) as any;
                const retryErrors = validateShape(retryData, shape);
                if (retryErrors.length === 0) return retryData;
            } catch { /* fall through to original data */ }
        }
        return data; // Return partially valid data rather than nothing
    } catch {
        if (retryFn) {
            const retryText = await retryFn();
            try { return extractJSON(retryText); } catch { /* fall through */ }
        }
        throw new Error("No valid JSON found after retry");
    }
}
