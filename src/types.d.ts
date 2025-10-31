export declare global {
    interface Uint8Array {
        toBase64(): string;
        fromBase64(): string;
    }

    interface Uint8ArrayConstructor {
        fromBase64(data: string): Uint8Array;
    }
}
