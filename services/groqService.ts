
import type { Client, Project, FieldData } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const getAIInsightStream = async (
    client: Client,
    project: Project,
    fieldData: FieldData[],
    query: string
) => {
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
      Use the provided data and your knowledge for additional context.
      Be concise, professional, and helpful.

      Client: ${client.companyName}
      Project: ${project.projectName}

      Project Field Data Summary:
      ${fieldDataSummary || "No field data available yet."}

      User Query: "${query}"

      Your analysis:
    `;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: prompt }],
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        return {
            stream: async function* () {
                if (!reader) return;
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') return;
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;
                                if (content) yield content;
                            } catch (e) {
                                // ignore
                            }
                        }
                    }
                }
            }
        };
    } catch (error) {
        console.error('Groq API error:', error);
        throw error;
    }
};