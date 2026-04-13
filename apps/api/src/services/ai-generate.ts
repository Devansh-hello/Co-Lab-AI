/**
 * AI Generation Service
 *
 * Provides unified interfaces for calling AI models across all supported
 * providers: OpenAI-compatible (OpenRouter, GLM, OpenAI), Gemini, and Anthropic.
 *
 * Two modes:
 *   - callAIGenerate()       - Full response (used by orchestrator/understanding)
 *   - callAIGenerateStream() - Streaming chunks (used by code/review/test agents)
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

import { openrouter, openrouterFree, openai, gemini, anthropic, glm } from "./ai-clients.js";
import { resolveApiKey, type UserSettings } from "./user-settings.js";

/** Token usage stats returned by AI providers */
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

/**
 * Newer OpenAI models (o1, o3, o4, gpt-4.1, etc.) require `max_completion_tokens`
 * instead of `max_tokens`. This helper returns the correct parameter object.
 */
function tokenLimitParam(model: string, maxTokens: number): { max_tokens: number } | { max_completion_tokens: number } {
    const needsCompletionTokens = /^(o[1-4]|gpt-4\.1|gpt-4o|gpt-5)/.test(model)
        || model.includes('/o1') || model.includes('/o3') || model.includes('/o4')
        || model.includes('/gpt-4o') || model.includes('/gpt-4.1') || model.includes('/gpt-5');
    return needsCompletionTokens ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens };
}

/**
 * Make a single (non-streaming) AI call and return the full response text.
 * Automatically routes to the correct provider SDK based on the provider param.
 */
export async function callAIGenerate(
    provider: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 8000,
    userApiKey?: string
): Promise<string> {
    const key = userApiKey || resolveApiKey(provider, { openai: '', anthropic: '', gemini: '', openrouter: '', glm: '' });

    if (provider === 'gemini') {
        const client = userApiKey ? new GoogleGenAI({ apiKey: key }) : gemini;
        const response = await client.models.generateContent({
            model,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature: 0.2 },
        });
        return response.text || "";
    }

    if (provider === 'anthropic') {
        const client = userApiKey ? new Anthropic({ apiKey: key }) : anthropic;
        const response = await client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        });
        const block = response.content[0];
        return block && block.type === 'text' ? block.text : "";
    }

    /* OpenAI-compatible providers: OpenRouter, OpenAI, GLM */
    let client: OpenAI;
    if (userApiKey) {
        const baseURL = provider === 'glm' ? 'https://api.z.ai/api/paas/v4'
            : provider === 'openrouter' ? 'https://openrouter.ai/api/v1'
            : undefined;
        client = new OpenAI({ apiKey: key, ...(baseURL && { baseURL }), timeout: 60_000 });
    } else {
        client = model.endsWith(':free') ? openrouterFree : openrouter;
        if (provider === 'openai') client = openai;
        if (provider === 'glm') client = glm;
    }

    const response = await client.chat.completions.create({
        model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        ...(model !== 'gpt-5-mini' && { temperature: 0.2 }),
        ...tokenLimitParam(model, maxTokens),
    } as any) as OpenAI.Chat.Completions.ChatCompletion;
    return response.choices[0]?.message?.content || "";
}

/**
 * Make a streaming AI call, yielding text chunks as they arrive.
 * Calls onUsage() with token stats when the stream completes.
 */
export async function* callAIGenerateStream(
    provider: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    onUsage?: (usage: TokenUsage) => void,
    maxTokens = 16000,
    userApiKey?: string,
    signal?: AbortSignal,
) {
    const key = userApiKey || '';

    // ─── Gemini Streaming ───────────────────────────────────────
    if (provider === 'gemini') {
        const client = key ? new GoogleGenAI({ apiKey: key }) : gemini;
        const responseStream = await client.models.generateContentStream({
            model,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, temperature: 0.2 },
        });
        let charCount = 0;
        for await (const chunk of responseStream) {
            if (signal?.aborted) return;
            const text = chunk.text || "";
            charCount += text.length;
            yield text;
        }
        if (onUsage) {
            const est = Math.ceil(charCount / 4);
            onUsage({ promptTokens: 0, completionTokens: est, totalTokens: est });
        }
        return;
    }

    // ─── Anthropic Streaming ────────────────────────────────────
    if (provider === 'anthropic') {
        const client = key ? new Anthropic({ apiKey: key }) : anthropic;
        const stream = await client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            stream: true,
        });
        let inputTokens = 0, outputTokens = 0;
        for await (const chunk of stream) {
            if (signal?.aborted) return;
            if (chunk.type === 'message_start') {
                inputTokens = chunk.message.usage.input_tokens;
            } else if (chunk.type === 'message_delta') {
                outputTokens = (chunk as any).usage?.output_tokens ?? outputTokens;
            } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield chunk.delta.text;
            }
        }
        if (onUsage) onUsage({ promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens });
        return;
    }

    // ─── OpenAI-compatible Streaming ────────────────────────────
    let client: OpenAI;
    if (key) {
        const baseURL = provider === 'glm' ? 'https://api.z.ai/api/paas/v4'
            : provider === 'openrouter' ? 'https://openrouter.ai/api/v1'
            : undefined;
        client = new OpenAI({ apiKey: key, ...(baseURL && { baseURL }), timeout: 120_000 });
    } else {
        client = model.endsWith(':free') ? openrouterFree : openrouter;
        if (provider === 'openai') client = openai;
        if (provider === 'glm') client = glm;
    }

    const supportsUsage = provider === 'openai' || provider === 'openrouter';
    const supportsTemperature = model !== 'gpt-5-mini';
    const tokenLimit = tokenLimitParam(model, maxTokens);
    const baseParams: Record<string, any> = {
        model,
        messages: [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: userPrompt },
        ],
        stream: true as const,
        ...tokenLimit,
        ...(supportsTemperature && { temperature: 0.2 }),
    };

    const stream = (supportsUsage
        ? await client.chat.completions.create({ ...baseParams, stream_options: { include_usage: true } } as any)
        : await client.chat.completions.create(baseParams as any)) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    let charCount = 0;
    let usageFired = false;
    for await (const chunk of stream) {
        if (signal?.aborted) return;
        if ((chunk as any).usage && onUsage) {
            const u = (chunk as any).usage;
            onUsage({ promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens });
            usageFired = true;
        }
        const text = chunk.choices[0]?.delta?.content || "";
        charCount += text.length;
        yield text;
    }
    if (!usageFired && onUsage) {
        const est = Math.ceil(charCount / 4);
        onUsage({ promptTokens: 0, completionTokens: est, totalTokens: est });
    }
}
