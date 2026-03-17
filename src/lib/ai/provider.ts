import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is niet geconfigureerd. Stel deze in via de Vercel omgevingsvariabelen.');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is niet geconfigureerd. Stel deze in via de Vercel omgevingsvariabelen.');
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export type AIProvider = 'openai' | 'anthropic';

export interface AICompletionOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

const DEFAULT_MODELS = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
} as const;

/**
 * Determine the best available provider.
 * Hybrid strategy:
 *   - 'analysis' role → prefer OpenAI (structured extraction, scoring)
 *   - 'generation' role → prefer Anthropic/Claude (long-form EMVI text)
 * Falls back to whichever key is available.
 */
export function resolveProvider(preferred?: AIProvider, role?: 'analysis' | 'generation'): AIProvider {
  if (preferred) {
    // Verify the preferred provider's key exists
    if (preferred === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
    if (preferred === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  }

  // Hybrid: pick best provider by role
  if (role === 'analysis' && process.env.OPENAI_API_KEY) return 'openai';
  if (role === 'generation' && process.env.ANTHROPIC_API_KEY) return 'anthropic';

  // Fallback: use whichever is available
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';

  throw new Error(
    'Geen AI provider geconfigureerd. Stel ANTHROPIC_API_KEY en/of OPENAI_API_KEY in via de Vercel omgevingsvariabelen.'
  );
}

export async function aiComplete(
  prompt: string,
  options: AICompletionOptions & { role?: 'analysis' | 'generation' } = {}
): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number } }> {
  const provider = resolveProvider(options.provider, options.role);
  const model = options.model || DEFAULT_MODELS[provider];
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens ?? 4096;

  if (provider === 'anthropic') {
    const client = getAnthropic();
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: options.systemPrompt || '',
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return {
      content: textBlock?.text || '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  const client = getOpenAI();
  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return {
    content: response.choices[0]?.message?.content || '',
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

export async function aiCompleteJSON<T>(
  prompt: string,
  options: AICompletionOptions & { role?: 'analysis' | 'generation' } = {}
): Promise<{ data: T; usage: { inputTokens: number; outputTokens: number } }> {
  const jsonPrompt = `${prompt}

CRITICAL: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation. Pure JSON only.`;

  const result = await aiComplete(jsonPrompt, {
    ...options,
    temperature: options.temperature ?? 0.2,
  });

  let cleaned = result.content.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const data = JSON.parse(cleaned) as T;
  return { data, usage: result.usage };
}
