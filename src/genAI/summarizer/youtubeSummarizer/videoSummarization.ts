import { GoogleGenAI } from '@google/genai';

export async function videoSummarization(apiKey: string, fileUri: string) {
    const videoPart = {
        fileData: {
            fileUri,
            mimeType: 'video/mp4',
        },
    };

    const contents = [videoPart, 'Please summarize the video in 3 sentences.'];

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
    });
    console.log(result.text);
    return result.text;
}
