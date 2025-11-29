import { openai, GPT_CONFIG } from '@/lib/openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Send a chat completion request to OpenAI GPT
 * @param messages - Array of chat messages
 * @param options - Optional configuration overrides
 * @returns The assistant's response text
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: ChatCompletionOptions
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || GPT_CONFIG.model,
      messages: messages,
      temperature: options?.temperature ?? GPT_CONFIG.temperature,
      max_tokens: options?.max_tokens || GPT_CONFIG.max_tokens,
      stream: options?.stream || false,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling GPT API:', error);
    throw error;
  }
}

/**
 * Stream chat completion from OpenAI GPT
 * @param messages - Array of chat messages
 * @param onChunk - Callback function to handle each chunk of text
 * @param options - Optional configuration overrides
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  options?: ChatCompletionOptions
): Promise<void> {
  try {
    const stream = await openai.chat.completions.create({
      model: options?.model || GPT_CONFIG.model,
      messages: messages,
      temperature: options?.temperature ?? GPT_CONFIG.temperature,
      max_tokens: options?.max_tokens || GPT_CONFIG.max_tokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('Error streaming GPT API:', error);
    throw error;
  }
}

/**
 * Simple helper to send a single message to GPT
 * @param prompt - The user's prompt
 * @param systemMessage - Optional system message to set context
 * @param options - Optional configuration overrides
 * @returns The assistant's response text
 */
export async function askGPT(
  prompt: string,
  systemMessage?: string,
  options?: ChatCompletionOptions
): Promise<string> {
  const messages: ChatMessage[] = [];

  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }

  messages.push({ role: 'user', content: prompt });

  return chatCompletion(messages, options);
}

/**
 * Check if OpenAI API key is configured
 */
export function isGPTConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
}
