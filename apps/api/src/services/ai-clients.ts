/**
 * AI Client Initialization
 *
 * Creates singleton instances of AI provider clients using server-level
 * API keys from environment variables. These serve as fallbacks when
 * users haven't configured their own keys.
 *
 * Supported providers:
 *   - OpenRouter (primary, + free tier)
 *   - OpenAI (direct)
 *   - Google Gemini
 *   - Anthropic Claude
 *   - GLM (ZhipuAI)
 */

import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

/** OpenRouter - primary routing provider */
export const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
});

/** OpenRouter free tier for :free models */
export const openrouterFree = new OpenAI({
    apiKey: process.env.OPENROUTER_FREE_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
});

/** OpenAI direct client */
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

/** Google Gemini client */
export const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

/** Anthropic Claude client */
export const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

/** GLM (ZhipuAI) client */
export const glm = new OpenAI({
    apiKey: process.env.GLM_API_KEY || "",
    baseURL: "https://api.z.ai/api/paas/v4",
});
