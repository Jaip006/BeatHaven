import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Path to fpcalc binary — place fpcalc.exe (Windows) or fpcalc (Linux/Mac) in server/bin/
const FPCALC_PATH = path.join(__dirname, "../../bin", process.platform === "win32" ? "fpcalc.exe" : "fpcalc");
console.log("[audioFingerprint] fpcalc path:", FPCALC_PATH);

export interface FingerprintResult {
  fingerprint: number[];
  duration: number;
}

export const generateFingerprint = (buffer: Buffer): Promise<FingerprintResult> => {
  return new Promise((resolve, reject) => {
    // Write buffer to a temp file because fpcalc requires a file path
    const tmpPath = path.join(os.tmpdir(), `bh_fp_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

    try {
      fs.writeFileSync(tmpPath, buffer);
    } catch (err) {
      return reject(new Error("Failed to write temp file for fingerprinting"));
    }

    execFile(FPCALC_PATH, ["-raw", "-json", tmpPath], (error, stdout, stderr) => {
      // Always clean up the temp file
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }

      if (error) {
        console.error("[audioFingerprint] fpcalc error:", error.message);
        console.error("[audioFingerprint] fpcalc stderr:", stderr);
        return reject(new Error(`fpcalc failed: ${error.message}`));
      }
      console.log("[audioFingerprint] fpcalc stdout:", stdout.slice(0, 100));

      try {
        const parsed = JSON.parse(stdout.trim());
        if (!parsed.fingerprint || !parsed.duration) {
          return reject(new Error("fpcalc returned unexpected output"));
        }
        resolve({
          fingerprint: parsed.fingerprint as number[],
          duration: parsed.duration as number,
        });
      } catch {
        reject(new Error("Failed to parse fpcalc output"));
      }
    });
  });
};

// Compares two raw fingerprints using Bit Error Rate.
// Returns a similarity score between 0 (completely different) and 1 (identical).
export const fingerprintSimilarity = (fp1: number[], fp2: number[]): number => {
  const len = Math.min(fp1.length, fp2.length);
  if (len === 0) return 0;

  let diffBits = 0;
  for (let i = 0; i < len; i++) {
    // XOR the two 32-bit integers, then count set bits (Hamming weight)
    let xor = (fp1[i] ^ fp2[i]) >>> 0;
    xor = xor - ((xor >>> 1) & 0x55555555);
    xor = (xor & 0x33333333) + ((xor >>> 2) & 0x33333333);
    diffBits += (((xor + (xor >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }

  return 1 - diffBits / (len * 32);
};

// Threshold above which two beats are considered the same audio
export const SIMILARITY_THRESHOLD = 0.85;
