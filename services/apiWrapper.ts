import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters } from "@google/genai";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 second

/**
 * Executes a Gemini API content generation request with retry logic.
 * Specifically handles 503 (Service Unavailable) and 504 (Gateway Timeout) errors.
 * Uses exponential backoff (1s, 2s, 4s).
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
      const message = error.message || "";

      // Check for 503 Service Unavailable or 504 Gateway Timeout
      const isRetryable = 
        status === 503 || 
        status === 504 || 
        message.includes("503") || 
        message.includes("504");

      if (isRetryable && attempt < MAX_RETRIES) {
        attempt++;
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        
        console.warn(`[Gemini API] Request failed with ${status}. Retrying attempt ${attempt}/${MAX_RETRIES} in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // If error is not retryable or max retries exceeded, throw the error
      throw error;
    }
  }
};
