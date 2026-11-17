
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function getGeminiDecision(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Answer with exactly YES or NO. No explanation.
Question: ${prompt}`,
    });

    const answer = response.text?.trim().toUpperCase();

    if (answer === "YES" || answer === "NO") {
      return {
        decision: answer,
        source: "gemini",
      };
    }

    throw new Error(`Unexpected Gemini response: ${answer}`);
  } catch (error) {
    console.error("Gemini unavailable; using fallback:", error);

    // Explicit fallback: use a neutral NO decision.
    return {
      decision: "NO" as const,
      source: "fallback",
    };
  }
}
