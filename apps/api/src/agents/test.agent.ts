/**
 * Test Agent (AgentCoder-inspired)
 *
 * Generates test case METADATA independently from code to maintain
 * objectivity. This is a key research insight from AgentCoder:
 * separating test generation from code generation prevents test bias.
 *
 * Outputs metadata-only (names, categories, coverage scores) — not
 * full test file source code. This saves ~60-80% of output tokens.
 */

import type { WebSocket } from "ws";

import { callAIGenerateStream, type TokenUsage } from "../services/ai-generate.js";
import { extractJSON } from "../services/json-parser.js";
import { resolveApiKey, type UserSettings } from "../services/user-settings.js";

/**
 * Generate test metadata and coverage scores for the generated code.
 * Tests are based on the API contract and features, NOT the code itself.
 */
export async function TestAgent(
    taskFile: any,
    frontendCode: any,
    backendCode: any,
    ws: WebSocket,
    userSettings?: UserSettings
): Promise<any> {
    const apiContract = taskFile.apiContract || {};
    const endpoints = apiContract.endpoints || [];
    const models = apiContract.models || {};

    /* Extract route signatures from backend for validation */
    const backendRoutes: string[] = [];
    if (backendCode && typeof backendCode === 'object') {
        for (const [, content] of Object.entries(backendCode)) {
            const matches = (content as string).match(/\.(get|post|put|patch|delete)\s*\(\s*['"](\/[^'"]+)['"]/gi) || [];
            backendRoutes.push(...matches);
        }
    }

    const isFrontendOnly = endpoints.length === 0 && backendRoutes.length === 0;

    const systemPrompt = `QA engineer. Generate test case METADATA (names, categories, coverage) for ${isFrontendOnly ? 'a frontend application' : 'a full-stack app'}. Base tests on the ${isFrontendOnly ? 'features, components, and user interactions' : 'API contract and features'} — NOT code implementation. Return ONLY valid JSON.

CATEGORIES: basic (normal flow${isFrontendOnly ? ', component rendering, state management' : ''}), edge (boundaries, empty input, special chars), integration (${isFrontendOnly ? 'component interactions, data flow between views' : 'frontend-backend API match'}), security (${isFrontendOnly ? 'input sanitization, XSS prevention, local storage safety' : 'auth, validation, injection'})

Each test: { "name": "string", "description": "short", "target": "${isFrontendOnly ? 'component or feature' : 'endpoint or component'}", "priority": "critical|high|medium|low" }

${isFrontendOnly ? 'For frontend-only apps: test UI components, user interactions, state management, routing, form validation, accessibility, responsive layout, and data persistence.' : 'Also validate the API contract: which endpoints are covered by tests, which are missing, any field mismatches.'}

DO NOT generate test file source code — only metadata and coverage scores.
You MUST generate a non-zero number of tests. Every feature should have at least one test.

JSON format:
{"testSuite":{"totalTests":0,"categories":{"basic":[],"edge":[],"integration":[],"security":[]}},"contractValidation":{"endpointsCovered":[],"endpointsMissing":[],"modelsCovered":[],"fieldMismatches":[]},"coverage":{"endpointCoverage":${isFrontendOnly ? '100' : '95'},"featureCoverage":90,"securityCoverage":80},"summary":"string"}`;

    /* Trajectory reduction: compact contract instead of full JSON dump */
    const compactEndpoints = endpoints.map((e: any) => `${e.method} ${e.path}`).join(', ');
    const compactModels = Object.entries(models).map(([name, fields]: [string, any]) =>
        `${name}(${Object.keys(fields).join(',')})`).join(', ');

    /* Extract component names from frontend code for frontend-only testing */
    const frontendComponents: string[] = [];
    if (frontendCode && typeof frontendCode === 'object') {
        for (const [filepath] of Object.entries(frontendCode)) {
            if (filepath.match(/\.(tsx|jsx)$/) && !filepath.includes('main.')) {
                frontendComponents.push(filepath);
            }
        }
    }

    const userPrompt = `PROJECT: ${taskFile.projectMeta?.name || 'Project'}
FEATURES: ${(taskFile.features || []).join(', ')}
${isFrontendOnly ? `FRONTEND COMPONENTS: ${frontendComponents.join(', ') || 'none'}` : `AUTH: ${apiContract.auth?.scheme || 'none'}
MODELS: ${compactModels || 'none'}
ENDPOINTS: ${compactEndpoints || 'none'}
BACKEND ROUTES FOUND: ${backendRoutes.join(', ') || 'none'}`}
TASKS: ${(taskFile.frontendTasks || []).concat(taskFile.backendTasks || []).map((t: any) => t.task).join(', ')}

Generate test metadata and coverage scores.${isFrontendOnly ? ' Focus on feature completeness, user interactions, and edge cases.' : ' Focus on contract compliance.'}`;

    let fullContent = '';
    const onUsage = (usage: TokenUsage) => {
        ws.send(JSON.stringify({ type: 'token_usage', agent: 'Test Agent', usage }));
    };

    const testProvider = userSettings?.agentModels.test.provider || 'glm';
    const testModel = userSettings?.agentModels.test.model || 'GLM-4.7-FlashX';
    const testKey = userSettings ? resolveApiKey(testProvider, userSettings.apiKeys) : '';

    /* Reduced from 16000 to 8000 — metadata-only mode doesn't need full generation tokens */
    for await (const chunk of callAIGenerateStream(testProvider, testModel, systemPrompt, userPrompt, onUsage, 8000, testKey || undefined)) {
        if (chunk) {
            fullContent += chunk;
            ws.send(JSON.stringify({
                type: 'test_stream', content: chunk,
                accumulated: fullContent,
                tokenEstimate: Math.ceil(fullContent.length / 4),
            }));
        }
    }

    try { return extractJSON(fullContent.trim()); }
    catch {
        return {
            testSuite: { totalTests: 0, categories: { basic: [], edge: [], integration: [], security: [] } },
            contractValidation: { endpointsCovered: [], endpointsMissing: [], modelsCovered: [], fieldMismatches: [] },
            testFiles: {},
            coverage: { endpointCoverage: 0, featureCoverage: 0, securityCoverage: 0 },
            summary: "Test generation completed with parse warnings",
        };
    }
}
