
import { GoogleGenAI } from "@google/genai";
import type { Client, Project, FieldData } from '../types';

// Per @google/genai coding guidelines, API key must be from import.meta.env.VITE_GEMINI_API_KEY
// and its existence is guaranteed in the execution environment.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const getAIInsightStream = async (
    client: Client,
    project: Project,
    fieldData: FieldData[],
    query: string
) => {
    const model = 'gemini-2.5-flash';

    const fieldDataSummary = fieldData.map(fd => `
      - Entry on ${new Date(fd.createdAt || 0).toLocaleDateString()}:
      Location: ${fd.location.description} (${fd.location.lat}, ${fd.location.lng})
      Elevation: ${fd.biophysical.elevation}m
      Ecoregion: ${fd.biophysical.ecoregion}
      Vegetation: ${fd.biophysical.vegetationType}
      Impacts: Pollution - ${fd.impacts?.pollution || 'N/A'}, Weeds - ${fd.impacts?.weedsIAP || 'N/A'}
    `).join('');

    const prompt = `
      You are an expert environmental science consultant AI.
      Your task is to provide insights on field data for a client project.
      Use the provided data and search the web for additional context if needed.
      Be concise, professional, and helpful.

      Client: ${client.companyName}
      Project: ${project.projectName}

      Project Field Data Summary:
      ${fieldDataSummary || "No field data available yet."}

      User Query: "${query}"

      Your analysis:
    `;

    try {
        const response = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        return response;
    } catch (error) {
        console.error("Error getting AI insight:", error);
        throw new Error("Failed to get AI insight. Please check your API key and connection.");
    }
};