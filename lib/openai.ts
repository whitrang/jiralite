import OpenAI from 'openai';

// Initialize OpenAI client
// Make sure to set NEXT_PUBLIC_OPENAI_API_KEY in your .env.local file
export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // Allow client-side usage (use with caution)
});

// Default configuration
export const GPT_CONFIG = {
  model: 'gpt-4o-mini', // Cost-effective model, you can change to 'gpt-4' or 'gpt-4-turbo'
  temperature: 0.7,
  max_tokens: 1000,
};
