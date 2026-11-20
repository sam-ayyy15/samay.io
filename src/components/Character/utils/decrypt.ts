async function generateAESKey(password: string): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password);
  const hashedPassword = await crypto.subtle.digest("SHA-256", passwordBuffer);
  return crypto.subtle.importKey(
    "raw",
    hashedPassword.slice(0, 32),
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Streams the file so the loading screen can show REAL download progress. */
async function fetchWithProgress(
  url: string,
  onProgress?: (fraction: number) => void
): Promise<ArrayBuffer> {
  const response = await fetch(url);
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body || !total || !onProgress) {
    const buf = await response.arrayBuffer();
    onProgress?.(1);
    return buf;
  }
  const reader = response.body.getReader();
  const out = new Uint8Array(total);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (received + value.length > out.length) {
      // content-length was wrong (e.g. compressed transfer) — fall back gracefully
      const grown = new Uint8Array(Math.max(out.length * 2, received + value.length));
      grown.set(out.subarray(0, received));
      return finish(grown, received, value, reader, onProgress);
    }
    out.set(value, received);
    received += value.length;
    onProgress(Math.min(received / total, 1));
  }
  onProgress(1);
  return out.buffer.slice(0, received);
}

async function finish(
  buf: Uint8Array,
  received: number,
  value: Uint8Array,
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onProgress: (fraction: number) => void
): Promise<ArrayBuffer> {
  const chunks: Uint8Array[] = [buf.subarray(0, received), value];
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    chunks.push(r.value);
  }
  onProgress(1);
  const size = chunks.reduce((s, c) => s + c.length, 0);
  const all = new Uint8Array(size);
  let o = 0;
  chunks.forEach((c) => {
    all.set(c, o);
    o += c.length;
  });
  return all.buffer;
}

export const decryptFile = async (
  url: string,
  password: string,
  onProgress?: (fraction: number) => void
): Promise<ArrayBuffer> => {
  // Derive the key while the download is in flight
  const [encryptedData, key] = await Promise.all([
    fetchWithProgress(url, onProgress),
    generateAESKey(password),
  ]);
  const iv = new Uint8Array(encryptedData.slice(0, 16));
  const data = encryptedData.slice(16);
  return crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data);
};
