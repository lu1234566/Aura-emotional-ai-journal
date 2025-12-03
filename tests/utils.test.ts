
import { describe, it, expect } from 'vitest';
import { base64ToUint8Array, arrayBufferToBase64, createPcmBlob } from '../services/utils';

describe('Utility Functions', () => {
  it('should convert base64 to Uint8Array correctly', () => {
    const input = "SGVsbG8="; // "Hello"
    const output = base64ToUint8Array(input);
    const textDecoder = new TextDecoder();
    expect(textDecoder.decode(output)).toBe("Hello");
  });

  it('should convert ArrayBuffer to base64 correctly', () => {
    const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const output = arrayBufferToBase64(input.buffer);
    expect(output).toBe("SGVsbG8=");
  });

  it('should create a valid PCM blob structure', () => {
    const float32 = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const result = createPcmBlob(float32);
    expect(result.mimeType).toBe("audio/pcm;rate=16000");
    expect(typeof result.data).toBe("string");
  });
});
