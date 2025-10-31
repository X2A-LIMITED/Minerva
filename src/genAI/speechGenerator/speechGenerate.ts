import { GoogleGenAI } from '@google/genai';
import '../../types.d.ts';

export const VOICE_NAME = {
    ZEPHYR: 'ZEPHYR',
    PUCK: 'PUCK',
    CHARON: 'CHARON',
    KORE: 'KORE',
    FENRIR: 'FENRIR',
    LEDA: 'LEDA',
    ORUS: 'ORUS',
    AOEDE: 'AOEDE',
    CALLIRRHOE: 'CALLIRRHOE',
    AUTONOE: 'AUTONOE',
    ENCELADUS: 'ENCELADUS',
    IAPETUS: 'IAPETUS',
    UMBRIEL: 'UMBRIEL',
    ALGIEBA: 'ALGIEBA',
    DESPINA: 'DESPINA',
    ERINOME: 'ERINOME',
    ALGENIB: 'ALGENIB',
    RASALGETHI: 'RASALGETHI',
    LAOMEDEIA: 'LAOMEDEIA',
    ACHERNAR: 'ACHERNAR',
    ALNILAM: 'ALNILAM',
    SCHEDAR: 'SCHEDAR',
    GACRUX: 'GACRUX',
    PULCHERRIMA: 'PULCHERRIMA',
    ACHIRD: 'ACHIRD',
    ZUBENELGENUBI: 'ZUBENELGENUBI',
    VINDEMIATRIX: 'VINDEMIATRIX',
    SADACHBIA: 'SADACHBIA',
    SADALTAGER: 'SADALTAGER',
    SULAFAT: 'SULAFAT',
} as const;

export type VoiceName = (typeof VOICE_NAME)[keyof typeof VOICE_NAME];

export const VOICE_STYLE = {
    BRIGHT: 'BRIGHT',
    UPBEAT: 'UPBEAT',
    INFORMATIVE: 'INFORMATIVE',
    FIRM: 'FIRM',
    EXCITABLE: 'EXCITABLE',
    YOUTHFUL: 'YOUTHFUL',
    BREEZY: 'BREEZY',
    EASY_GOING: 'EASY_GOING',
    BREATHY: 'BREATHY',
    CLEAR: 'CLEAR',
    SMOOTH: 'SMOOTH',
    GRAVELLY: 'GRAVELLY',
    SOFT: 'SOFT',
    EVEN: 'EVEN',
    MATURE: 'MATURE',
    FORWARD: 'FORWARD',
    FRIENDLY: 'FRIENDLY',
    CASUAL: 'CASUAL',
    GENTLE: 'GENTLE',
    LIVELY: 'LIVELY',
    KNOWLEDGEABLE: 'KNOWLEDGEABLE',
    WARM: 'WARM',
} as const;

export type VoiceStyle = (typeof VOICE_STYLE)[keyof typeof VOICE_STYLE];

export const voice: Record<VoiceName, VoiceStyle> = {
    [VOICE_NAME.ZEPHYR]: VOICE_STYLE.BRIGHT,
    [VOICE_NAME.PUCK]: VOICE_STYLE.UPBEAT,
    [VOICE_NAME.CHARON]: VOICE_STYLE.INFORMATIVE,
    [VOICE_NAME.KORE]: VOICE_STYLE.FIRM,
    [VOICE_NAME.FENRIR]: VOICE_STYLE.EXCITABLE,
    [VOICE_NAME.LEDA]: VOICE_STYLE.YOUTHFUL,
    [VOICE_NAME.ORUS]: VOICE_STYLE.FIRM,
    [VOICE_NAME.AOEDE]: VOICE_STYLE.BREEZY,
    [VOICE_NAME.CALLIRRHOE]: VOICE_STYLE.EASY_GOING,
    [VOICE_NAME.AUTONOE]: VOICE_STYLE.BRIGHT,
    [VOICE_NAME.ENCELADUS]: VOICE_STYLE.BREATHY,
    [VOICE_NAME.IAPETUS]: VOICE_STYLE.CLEAR,
    [VOICE_NAME.UMBRIEL]: VOICE_STYLE.EASY_GOING,
    [VOICE_NAME.ALGIEBA]: VOICE_STYLE.SMOOTH,
    [VOICE_NAME.DESPINA]: VOICE_STYLE.SMOOTH,
    [VOICE_NAME.ERINOME]: VOICE_STYLE.CLEAR,
    [VOICE_NAME.ALGENIB]: VOICE_STYLE.GRAVELLY,
    [VOICE_NAME.RASALGETHI]: VOICE_STYLE.INFORMATIVE,
    [VOICE_NAME.LAOMEDEIA]: VOICE_STYLE.UPBEAT,
    [VOICE_NAME.ACHERNAR]: VOICE_STYLE.SOFT,
    [VOICE_NAME.ALNILAM]: VOICE_STYLE.FIRM,
    [VOICE_NAME.SCHEDAR]: VOICE_STYLE.EVEN,
    [VOICE_NAME.GACRUX]: VOICE_STYLE.MATURE,
    [VOICE_NAME.PULCHERRIMA]: VOICE_STYLE.FORWARD,
    [VOICE_NAME.ACHIRD]: VOICE_STYLE.FRIENDLY,
    [VOICE_NAME.ZUBENELGENUBI]: VOICE_STYLE.CASUAL,
    [VOICE_NAME.VINDEMIATRIX]: VOICE_STYLE.GENTLE,
    [VOICE_NAME.SADACHBIA]: VOICE_STYLE.LIVELY,
    [VOICE_NAME.SADALTAGER]: VOICE_STYLE.KNOWLEDGEABLE,
    [VOICE_NAME.SULAFAT]: VOICE_STYLE.WARM,
};

export async function speechGenerateAudioBuffer(
    apiKey: string,
    content: string,
    voiceName: VoiceName,
    additionalInstruction?: string,
    audioContext?: AudioContext
): Promise<AudioBuffer> {
    const ai = new GoogleGenAI({ apiKey });
    const text = additionalInstruction
        ? `${additionalInstruction}:\n"${content}"`
        : content;

    console.log(text);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });

    console.log(response);

    const data =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (data == null || data === '') {
        throw new Error('No data');
    }
    const bytes = Uint8Array.fromBase64(data);
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);

    for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
    }

    const sampleRate = 24000;
    const numChannels = 1;
    const audioCtx = audioContext ?? new AudioContext();
    const audioBuffer = audioCtx.createBuffer(
        numChannels,
        float32.length / numChannels,
        sampleRate
    );

    audioBuffer.copyToChannel(float32, 0);

    return audioBuffer;
}

export async function speechGenerate(
    apiKey: string,
    content: string,
    voiceName: VoiceName,
    additionalInstruction?: string
) {
    const audioBuffer = await speechGenerateAudioBuffer(
        apiKey,
        content,
        voiceName,
        additionalInstruction
    );
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    const url = URL.createObjectURL(wavBlob);

    console.log(url);
    return url;
}

function audioBufferToWavBlob(audioBuffer: AudioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    let offset = 44;
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    for (let i = 0; i < audioBuffer.length; i++) {
        for (let c = 0; c < numChannels; c++) {
            const sample = Math.max(-1, Math.min(1, channels[c][i]));
            view.setInt16(
                offset,
                sample < 0 ? sample * 0x8000 : sample * 0x7fff,
                true
            );
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
}
