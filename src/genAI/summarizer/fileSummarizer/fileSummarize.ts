import { GoogleGenAI } from '@google/genai';
import {
    ServerSummarizer,
    SUMMARY_LENGTH,
    SUMMARY_TYPE,
    type SummarizerConfig,
} from '../summarizeAPI.ts';
import '../../../types.d.ts';
type ContentPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

async function getContents(
    data: string,
    mimeType: string
): Promise<ContentPart[] | null> {
    let contents: ContentPart[];

    if (mimeType.startsWith('image/')) {
        contents = [
            { text: 'Caption this image.' },
            {
                inlineData: {
                    mimeType,
                    data,
                },
            },
        ];
    } else if (mimeType === 'application/pdf') {
        contents = [
            { text: 'Summarize this document.' },
            {
                inlineData: {
                    mimeType,
                    data,
                },
            },
        ];
    } else {
        console.error('Unsupported file type:', mimeType);
        return null;
    }
    return contents;
}

export async function fileSummarize(
    apiKey: string,
    selectedFile: File,
    config: SummarizerConfig = {
        type: SUMMARY_TYPE.TLDR,
        length: SUMMARY_LENGTH.MEDIUM,
    }
) {
    const ai = new GoogleGenAI({ apiKey });

    const mimeType = selectedFile.type;
    if (mimeType.startsWith('text/')) {
        const summarizer = new ServerSummarizer();
        const text = await selectedFile.text();
        const res = await summarizer.summarize({ text, config });
        if (res.kind !== 'success') {
            throw new Error('summary error');
        }
        return res.summary;
    } else {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const data = bytes.toBase64();
        const contents = await getContents(data, mimeType);
        if (contents === null) {
            return '';
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
        });
        return response.text;
    }
}
