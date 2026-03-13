/**
 * Persistent PDF storage using the File System Access API.
 *
 * Stores FileSystemFileHandle objects in IndexedDB (just a reference,
 * not the file data). On page load, handles are restored and blob URLs
 * are re-created from the original files on disk.
 *
 * Falls back gracefully: if the API isn't available, PDFs still work
 * via blob URLs but won't survive page refresh.
 */

const DB_NAME = 'langhelper-pdf-handles';
const STORE_NAME = 'handles';
const DB_VERSION = 1;

/** Whether the File System Access API is available */
export const hasFileSystemAccess = typeof window !== 'undefined' &&
  'showOpenFilePicker' in window;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Store a FileSystemFileHandle for a dictionary ID */
export async function saveFileHandle(
  dictionaryId: string,
  handle: FileSystemFileHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, dictionaryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a stored FileSystemFileHandle */
export async function getFileHandle(
  dictionaryId: string
): Promise<FileSystemFileHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(dictionaryId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/** Remove a stored handle */
export async function removeFileHandle(dictionaryId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(dictionaryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Get all stored dictionary IDs */
export async function getAllHandleIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Request permission and get a blob URL from a stored handle.
 * Returns null if permission is denied or the file is inaccessible.
 */
export async function restoreBlobUrl(
  handle: FileSystemFileHandle
): Promise<string | null> {
  try {
    // Check/request read permission
    const opts = { mode: 'read' as const };
    let permission = await (handle as any).queryPermission(opts);
    if (permission !== 'granted') {
      permission = await (handle as any).requestPermission(opts);
    }
    if (permission !== 'granted') return null;

    const file = await handle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * Open a file picker for PDFs and return the handle + blob URL.
 * Returns null if the user cancels.
 */
export async function pickPdfFile(): Promise<{
  handle: FileSystemFileHandle;
  blobUrl: string;
  fileName: string;
} | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'PDF files',
        accept: { 'application/pdf': ['.pdf'] },
      }],
      multiple: false,
    });
    const file = await handle.getFile();
    return {
      handle,
      blobUrl: URL.createObjectURL(file),
      fileName: file.name,
    };
  } catch {
    // User cancelled or API error
    return null;
  }
}
