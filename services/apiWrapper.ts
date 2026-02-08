import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";

const MAX_RETRIES = 10;
const INITIAL_BACKOFF_MS = 2000;

/**
 * Executes a Gemini API content generation request with retry logic.
 * Specifically handles 503 (Service Unavailable), 504 (Gateway Timeout), and 429 (Too Many Requests).
 * Uses exponential backoff with jitter.
 */
export const generateContentWithRetry = async (
  ai: GoogleGenAI,
  model: string,
  params: Omit<GenerateContentParameters, 'model'>
): Promise<GenerateContentResponse> => {
  let attempt = 0;

  while (true) {
    try {
      return await ai.models.generateContent({
        model,
        ...params
      });
    } catch (error: any) {
      const status = error.status || error.response?.status;
      const message = (error.message || "").toLowerCase();

      // Check for 503 Service Unavailable, 504 Gateway Timeout, or 429 Too Many Requests/Quota
      const isRetryable = 
        status === 503 || 
        status === 504 || 
        status === 429 ||
        message.includes("503") || 
        message.includes("504") ||
        message.includes("429") ||
        message.includes("quota") ||
        message.includes("exhausted") ||
        message.includes("too many requests");

      if (isRetryable && attempt < MAX_RETRIES) {
        attempt++;
        // Exponential backoff: 2s, 4s, 8s, 16s...
        // Cap at 60 seconds to avoid indefinite hangs, add jitter (0-1000ms) to desynchronize parallel retries
        const rawDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        const delay = Math.min(rawDelay, 60000) + (Math.random() * 1000); 
        
        console.warn(`[Gemini API] Request failed with ${status || 'error'}. Retrying attempt ${attempt}/${MAX_RETRIES} in ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If error is not retryable or max retries exceeded, throw the error
      throw error;
    }
  }
};