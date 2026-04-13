/**
 * Guardrails Service
 *
 * Validates agent output during generation. Each guardrail returns a result
 * with pass/fail, score, and reason. Failed guardrails can trigger automatic
 * re-prompting with the failure reason injected.
 *
 * Inspired by CrewAI (function + LLM guardrails) and Vellum (GuardrailNode).
 */

import type { CodeMap, TaskFile, ReviewResult } from "../agents/types.js";

// ─── Types ──────────────────────────────────────────────────────

export interface GuardrailResult {
    name: string;
    pass: boolean;
    score: number;      // 0-100
    reason: string;
    severity: 'critical' | 'warning' | 'info';
}

export interface GuardrailReport {
    passed: boolean;
    results: GuardrailResult[];
    overallScore: number;
    criticalFailures: string[];
}

// ─── Security Guardrail ────────────────────────────────────────

const DANGEROUS_PATTERNS = [
    { pattern: /eval\s*\(/g, name: 'eval() usage', severity: 'critical' as const },
    { pattern: /Function\s*\(/g, name: 'Function() constructor', severity: 'critical' as const },
    { pattern: /child_process/g, name: 'child_process import', severity: 'critical' as const },
    { pattern: /exec\s*\(/g, name: 'exec() call', severity: 'warning' as const },
    { pattern: /innerHTML\s*=/g, name: 'innerHTML assignment (XSS risk)', severity: 'warning' as const },
    { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML', severity: 'warning' as const },
    { pattern: /password\s*[:=]\s*['"][^'"]{3,}['"]/gi, name: 'hardcoded password', severity: 'critical' as const },
    { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi, name: 'hardcoded API key', severity: 'critical' as const },
    { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/gi, name: 'hardcoded secret', severity: 'critical' as const },
    { pattern: /\$\{.*\}\s*(?:SELECT|INSERT|UPDATE|DELETE)/gi, name: 'SQL injection risk', severity: 'critical' as const },
    { pattern: /document\.write\s*\(/g, name: 'document.write (XSS risk)', severity: 'warning' as const },
];

function runSecurityGuardrail(codeMap: CodeMap): GuardrailResult {
    const issues: string[] = [];
    let severity: GuardrailResult['severity'] = 'info';

    for (const [filepath, code] of Object.entries(codeMap)) {
        if (typeof code !== 'string') continue;
        for (const { pattern, name, severity: s } of DANGEROUS_PATTERNS) {
            pattern.lastIndex = 0;
            const matches = code.match(pattern);
            if (matches) {
                issues.push(`${filepath}: ${name} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
                if (s === 'critical') severity = 'critical';
                else if (s === 'warning' && severity !== 'critical') severity = 'warning';
            }
        }
    }

    const score = issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15);
    return {
        name: 'Security',
        pass: severity !== 'critical',
        score,
        reason: issues.length === 0
            ? 'No security issues detected'
            : `Found ${issues.length} security issue(s): ${issues.slice(0, 5).join('; ')}`,
        severity,
    };
}

// ─── Format Guardrail ──────────────────────────────────────────

function runFormatGuardrail(codeMap: CodeMap): GuardrailResult {
    const issues: string[] = [];

    if (!codeMap || typeof codeMap !== 'object') {
        return { name: 'Format', pass: false, score: 0, reason: 'Output is not a valid CodeMap object', severity: 'critical' };
    }

    const entries = Object.entries(codeMap);
    if (entries.length === 0) {
        return { name: 'Format', pass: false, score: 0, reason: 'CodeMap is empty — no files generated', severity: 'critical' };
    }

    for (const [filepath, code] of entries) {
        if (!filepath || typeof filepath !== 'string') {
            issues.push('Invalid filepath key');
            continue;
        }
        if (typeof code !== 'string') {
            issues.push(`${filepath}: value is not a string (got ${typeof code})`);
            continue;
        }
        if (code.trim().length === 0) {
            issues.push(`${filepath}: empty file content`);
        }
        // Check for common AI artifacts
        if (code.includes('```')) {
            issues.push(`${filepath}: contains markdown code fence artifacts`);
        }
    }

    const score = issues.length === 0 ? 100 : Math.max(20, 100 - issues.length * 20);
    return {
        name: 'Format',
        pass: issues.length === 0,
        score,
        reason: issues.length === 0
            ? `Valid CodeMap with ${entries.length} files`
            : `Format issues: ${issues.join('; ')}`,
        severity: issues.length > 0 ? 'critical' : 'info',
    };
}

// ─── API Compatibility Guardrail ───────────────────────────────

function runCompatibilityGuardrail(
    frontendCode: CodeMap | null,
    backendCode: CodeMap | null,
    taskFile: TaskFile
): GuardrailResult {
    if (!frontendCode || !backendCode || !taskFile.apiContract?.endpoints) {
        return { name: 'API Compatibility', pass: true, score: 80, reason: 'Skipped — single-side generation', severity: 'info' };
    }

    const endpoints = taskFile.apiContract.endpoints;
    const allFrontendCode = Object.values(frontendCode).join('\n');
    const allBackendCode = Object.values(backendCode).join('\n');
    const missingInFrontend: string[] = [];
    const missingInBackend: string[] = [];

    for (const ep of endpoints) {
        const pathPattern = ep.path.replace(/:[^/]+/g, '[^/]+');
        const pathRegex = new RegExp(pathPattern.replace(/\//g, '\\/'));

        if (!pathRegex.test(allFrontendCode) && !allFrontendCode.includes(ep.path)) {
            missingInFrontend.push(`${ep.method} ${ep.path}`);
        }
        if (!pathRegex.test(allBackendCode) && !allBackendCode.includes(ep.path)) {
            missingInBackend.push(`${ep.method} ${ep.path}`);
        }
    }

    const totalEndpoints = endpoints.length;
    const missingCount = missingInFrontend.length + missingInBackend.length;
    const score = totalEndpoints > 0
        ? Math.round(100 - (missingCount / (totalEndpoints * 2)) * 100)
        : 80;

    const issues: string[] = [];
    if (missingInFrontend.length > 0) issues.push(`Frontend missing: ${missingInFrontend.slice(0, 3).join(', ')}`);
    if (missingInBackend.length > 0) issues.push(`Backend missing: ${missingInBackend.slice(0, 3).join(', ')}`);

    return {
        name: 'API Compatibility',
        pass: missingCount <= Math.ceil(totalEndpoints * 0.3),
        score: Math.max(0, score),
        reason: issues.length === 0
            ? `All ${totalEndpoints} endpoints referenced in both codebases`
            : issues.join('; '),
        severity: missingCount > totalEndpoints ? 'critical' : 'warning',
    };
}

// ─── Completeness Guardrail ────────────────────────────────────

function runCompletenessGuardrail(
    codeMap: CodeMap,
    tasks: Array<{ task?: string; description?: string; file?: string }> | undefined,
    side: 'frontend' | 'backend'
): GuardrailResult {
    if (!tasks || tasks.length === 0) {
        return { name: `${side} Completeness`, pass: true, score: 100, reason: `No ${side} tasks defined`, severity: 'info' };
    }

    const files = Object.keys(codeMap);
    const taskFiles = tasks.filter(t => t.file).map(t => t.file!);
    const missingFiles = taskFiles.filter(f => !files.some(existing => existing.includes(f) || f.includes(existing)));

    const score = taskFiles.length > 0
        ? Math.round(((taskFiles.length - missingFiles.length) / taskFiles.length) * 100)
        : files.length > 0 ? 80 : 0;

    return {
        name: `${side} Completeness`,
        pass: missingFiles.length <= Math.ceil(taskFiles.length * 0.2),
        score: Math.max(0, score),
        reason: missingFiles.length === 0
            ? `All ${taskFiles.length} planned files created`
            : `Missing files: ${missingFiles.slice(0, 5).join(', ')}`,
        severity: score < 50 ? 'critical' : score < 70 ? 'warning' : 'info',
    };
}

// ─── Syntax Guardrail ──────────────────────────────────────────

/**
 * Catches common compilation errors that LLM-based review misses:
 * duplicate declarations, unmatched braces, broken imports, etc.
 */
function runSyntaxGuardrail(codeMap: CodeMap): GuardrailResult {
    const issues: string[] = [];
    const allFiles = Object.keys(codeMap);

    for (const [filepath, code] of Object.entries(codeMap)) {
        if (typeof code !== 'string') continue;

        // Skip non-JS/TS files
        if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(filepath)) continue;

        // 1. Duplicate const/let/var declarations in the same scope
        const declRegex = /\b(const|let|var)\s+(\w+)\s*[=:]/g;
        const declarations = new Map<string, number[]>();
        let match;
        const lines = code.split('\n');

        while ((match = declRegex.exec(code)) !== null) {
            const name = match[2] as string;
            const lineNum = code.slice(0, match.index).split('\n').length;
            if (!declarations.has(name)) declarations.set(name, []);
            declarations.get(name)!.push(lineNum);
        }

        for (const [name, lineNums] of declarations) {
            if (lineNums.length > 1) {
                // Check if they're at similar indent levels (likely same scope)
                const lineIndents = lineNums.map(ln => {
                    const line = lines[ln - 1] || '';
                    return line.length - line.trimStart().length;
                });
                // If two declarations have the same indent, likely a duplicate
                const indentCounts = new Map<number, number>();
                for (const indent of lineIndents) {
                    indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
                }
                for (const [indent, count] of indentCounts) {
                    if (count > 1) {
                        issues.push(`${filepath}: duplicate declaration '${name}' (lines ${lineNums.join(', ')})`);
                        break;
                    }
                }
            }
        }

        // 2. Unmatched braces/brackets
        let braces = 0, brackets = 0, parens = 0;
        let inString = false;
        let stringChar = '';
        let inTemplate = false;
        let inLineComment = false;
        let inBlockComment = false;

        for (let i = 0; i < code.length; i++) {
            const c = code[i];
            const next = code[i + 1];

            // Track comments
            if (!inString && !inTemplate && !inBlockComment && c === '/' && next === '/') { inLineComment = true; continue; }
            if (inLineComment && c === '\n') { inLineComment = false; continue; }
            if (inLineComment) continue;
            if (!inString && !inTemplate && !inLineComment && c === '/' && next === '*') { inBlockComment = true; i++; continue; }
            if (inBlockComment && c === '*' && next === '/') { inBlockComment = false; i++; continue; }
            if (inBlockComment) continue;

            // Track strings
            if (!inString && !inTemplate && (c === '"' || c === "'")) { inString = true; stringChar = c; continue; }
            if (inString && c === stringChar && code[i - 1] !== '\\') { inString = false; continue; }
            if (inString) continue;
            if (!inTemplate && c === '`') { inTemplate = true; continue; }
            if (inTemplate && c === '`' && code[i - 1] !== '\\') { inTemplate = false; continue; }
            if (inTemplate) continue;

            if (c === '{') braces++;
            else if (c === '}') braces--;
            else if (c === '[') brackets++;
            else if (c === ']') brackets--;
            else if (c === '(') parens++;
            else if (c === ')') parens--;
        }

        if (braces !== 0) issues.push(`${filepath}: unmatched braces (${braces > 0 ? `${braces} unclosed` : `${-braces} extra closing`})`);
        if (brackets !== 0) issues.push(`${filepath}: unmatched brackets (${brackets > 0 ? `${brackets} unclosed` : `${-brackets} extra closing`})`);
        if (parens !== 0) issues.push(`${filepath}: unmatched parentheses (${parens > 0 ? `${parens} unclosed` : `${-parens} extra closing`})`);

        // 3. Broken imports — importing files that don't exist in the output
        const importRegex = /import\s+.*?\s+from\s+['"](\.[^'"]+)['"]/g;
        while ((match = importRegex.exec(code)) !== null) {
            const importPath = match[1] as string;
            // Resolve relative to the file's directory
            const dir = filepath.split('/').slice(0, -1).join('/');
            const resolved = resolvePath(dir, importPath);

            // Check if any generated file matches this import
            const found = allFiles.some(f =>
                f === resolved ||
                f === resolved + '.ts' || f === resolved + '.tsx' ||
                f === resolved + '.js' || f === resolved + '.jsx' ||
                f === resolved + '/index.ts' || f === resolved + '/index.tsx' ||
                f === resolved + '/index.js'
            );

            if (!found) {
                issues.push(`${filepath}: imports '${importPath}' but file not found in output`);
            }
        }
    }

    const score = issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20);
    const hasCritical = issues.some(i => i.includes('duplicate declaration') || i.includes('unmatched'));

    return {
        name: 'Syntax',
        pass: !hasCritical,
        score,
        reason: issues.length === 0
            ? 'No syntax issues detected'
            : `Found ${issues.length} issue(s): ${issues.slice(0, 5).join('; ')}`,
        severity: hasCritical ? 'critical' : issues.length > 0 ? 'warning' : 'info',
    };
}

/** Resolve a relative import path against a directory */
function resolvePath(dir: string, importPath: string): string {
    const parts = dir ? dir.split('/') : [];
    for (const segment of importPath.split('/')) {
        if (segment === '..') parts.pop();
        else if (segment !== '.') parts.push(segment);
    }
    return parts.join('/');
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Run all guardrails against code agent output.
 * Returns a report with pass/fail, scores, and critical failures.
 */
export function runCodeGuardrails(
    codeMap: CodeMap,
    side: 'frontend' | 'backend',
    taskFile: TaskFile,
    otherSideCode?: CodeMap | null,
): GuardrailReport {
    const results: GuardrailResult[] = [];

    results.push(runFormatGuardrail(codeMap));
    results.push(runSecurityGuardrail(codeMap));
    results.push(runSyntaxGuardrail(codeMap));

    const tasks = side === 'frontend' ? taskFile.frontendTasks : taskFile.backendTasks;
    results.push(runCompletenessGuardrail(codeMap, tasks, side));

    if (otherSideCode) {
        const [fe, be] = side === 'frontend'
            ? [codeMap, otherSideCode]
            : [otherSideCode, codeMap];
        results.push(runCompatibilityGuardrail(fe, be, taskFile));
    }

    const criticalFailures = results
        .filter(r => !r.pass && r.severity === 'critical')
        .map(r => `[${r.name}] ${r.reason}`);

    const overallScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;

    return {
        passed: criticalFailures.length === 0,
        results,
        overallScore,
        criticalFailures,
    };
}

/**
 * Format guardrail failures into a prompt suffix for agent retry.
 */
export function formatGuardrailFeedback(report: GuardrailReport): string {
    if (report.passed) return '';

    const failures = report.results
        .filter(r => !r.pass)
        .map(r => `- [${r.name}] ${r.reason}`)
        .join('\n');

    return `\n\nGUARDRAIL FAILURES — FIX THESE ISSUES:\n${failures}\n\nReturn the corrected code addressing all issues above.`;
}
