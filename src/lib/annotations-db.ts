// Client-side only (IndexedDB), never imported from .astro frontmatter.
// The reader's own definitions/links attached to a piece of unit text —
// kept in IndexedDB rather than pStorage/localStorage because records carry
// more structure (the selected quote plus surrounding context, needed to
// re-find the same text on a later visit) than pStorage's simple string
// values, and there can be many of them per page.

export type AnnotationType = "definition" | "link";

export interface AnnotationRecord {
  /** `${profileId}:${pagePath}:${hash(quote+prefix+suffix)}` — deterministic, so saving over the same anchor updates rather than duplicates. */
  id: string;
  profileId: string;
  pagePath: string;
  quote: string;
  prefix: string;
  suffix: string;
  type: AnnotationType;
  content: string; // definition text, or a URL for type "link"
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "annotations";
const DB_VERSION = 1;
const STORE = "notes";
const PAGE_INDEX = "byPage";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex(PAGE_INDEX, ["profileId", "pagePath"], {
          unique: false,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Small deterministic string hash (djb2) — good enough for a non-cryptographic anchor id, no async Web Crypto round-trip needed. */
export function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function annotationId(
  profileId: string,
  pagePath: string,
  quote: string,
  prefix: string,
  suffix: string,
): string {
  return `${profileId}:${pagePath}:${hashString(prefix + quote + suffix)}`;
}

export async function getAnnotationsForPage(
  profileId: string,
  pagePath: string,
): Promise<AnnotationRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const index = tx.objectStore(STORE).index(PAGE_INDEX);
    const req = index.getAll([profileId, pagePath]);
    req.onsuccess = () => resolve(req.result as AnnotationRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAnnotation(record: AnnotationRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAnnotation(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
