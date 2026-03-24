/**
 * IndexedDB cache for CAL chapter data with compression.
 *
 * Chapters are stored gzip-compressed as ArrayBuffers, keyed by "fileCode:chapter:cset".
 * Uses the CompressionStream API (available in all modern browsers).
 */

import type { CALChapter } from '../types/cal-reader';

const DB_NAME = 'cal-text-cache';
const DB_VERSION = 1;
const STORE_NAME = 'chapters';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function cacheKey(fileCode: string, chapter: number, cset: string): string {
  return `${fileCode}:${chapter}:${cset}`;
}

async function compress(data: string): Promise<ArrayBuffer> {
  const blob = new Blob([data]);
  const cs = new CompressionStream('gzip');
  const stream = blob.stream().pipeThrough(cs);
  const resp = new Response(stream);
  return resp.arrayBuffer();
}

async function decompress(buffer: ArrayBuffer): Promise<string> {
  const blob = new Blob([buffer]);
  const ds = new DecompressionStream('gzip');
  const stream = blob.stream().pipeThrough(ds);
  const resp = new Response(stream);
  return resp.text();
}

/** Store a parsed chapter in the cache (compressed). */
export async function cacheChapter(chapter: CALChapter): Promise<void> {
  try {
    const db = await openDB();
    const json = JSON.stringify(chapter);
    const compressed = await compress(json);
    const key = cacheKey(chapter.fileCode, chapter.chapter, chapter.cset);

    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(compressed, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Cache failures are non-critical
  }
}

/** Retrieve a cached chapter, or null if not cached. */
export async function getCachedChapter(
  fileCode: string,
  chapter: number,
  cset: string
): Promise<CALChapter | null> {
  try {
    const db = await openDB();
    const key = cacheKey(fileCode, chapter, cset);

    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    const result = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();

    if (!result) return null;
    const json = await decompress(result);
    return JSON.parse(json) as CALChapter;
  } catch {
    return null;
  }
}

/** Get cache statistics: entry count and approximate total size in bytes. */
export async function getCacheStats(): Promise<{ count: number; sizeBytes: number }> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const countReq = store.count();
    const count = await new Promise<number>((resolve, reject) => {
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => reject(countReq.error);
    });

    // Sum up buffer sizes
    let sizeBytes = 0;
    const cursorReq = store.openCursor();
    await new Promise<void>((resolve, reject) => {
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          const buf = cursor.value as ArrayBuffer;
          sizeBytes += buf.byteLength;
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });

    db.close();
    return { count, sizeBytes };
  } catch {
    return { count: 0, sizeBytes: 0 };
  }
}

/** Clear all cached chapters. */
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Non-critical
  }
}
