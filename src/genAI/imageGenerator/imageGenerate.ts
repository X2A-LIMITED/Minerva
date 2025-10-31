import { GoogleGenAI, type GeneratedImage } from '@google/genai';

export async function imageGenerate(
    apiKey: string,
    prompt: string
): Promise<GeneratedImage | undefined> {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-fast-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
        },
    });

    return response.generatedImages?.[0];
}
