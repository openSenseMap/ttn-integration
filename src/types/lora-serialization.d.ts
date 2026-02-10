declare module 'lora-serialization' {
  export interface LoraTransformer {
    (input: Uint8Array | Buffer): any;
    BYTES: number;
  }

  export const decoder: Record<string, LoraTransformer>;
  export const encoder: Record<string, (...args: any[]) => any>;
}
