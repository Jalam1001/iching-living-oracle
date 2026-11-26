// Local persistence: journal in IndexedDB (falls back to localStorage), preferences in localStorage.
const DB_NAME = 'iching-living-oracle', STORE = 'journal', VERSION = 1;
const PREF_KEY = 'iching.prefs.v1', FALLBACK_KEY = 'iching.journal.fallback.v1';
let dbp = null;

function openDB() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    if (!('indexedDB' in globalThis)) return resolve(null);
    let req;
    try { req = indexedDB.open(DB_NAME, VERSION); } catch { return resolve(null); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('date', 'date');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbp;
}
const fbAll = () => { try { return JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]'); } catch { return []; } };
const fbSave = (a) => localStorage.setItem(FALLBACK_KEY, JSON.stringify(a));
function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode); const s = t.objectStore(STORE);
    const r = fn(s); t.oncomplete = () => resolve(r && r.result); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
  });
}

export const journal = {
  async all() {
    const db = await openDB();
    const list = db ? await tx(db, 'readonly', (s) => s.getAll()) : fbAll();
    return (list || []).sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  async get(id) { const db = await openDB(); return db ? tx(db, 'readonly', (s) => s.get(id)) : fbAll().find((e) => e.id === id); },
  async put(entry) {
    const db = await openDB();
    if (db) { await tx(db, 'readwrite', (s) => s.put(entry)); return entry; }
    const a = fbAll().filter((e) => e.id !== entry.id); a.push(entry); fbSave(a); return entry;
  },
  async remove(id) { const db = await openDB(); if (db) return tx(db, 'readwrite', (s) => s.delete(id)); fbSave(fbAll().filter((e) => e.id !== id)); },
  async clear() { const db = await openDB(); if (db) return tx(db, 'readwrite', (s) => s.clear()); fbSave([]); },
  async storageKind() { return (await openDB()) ? 'IndexedDB' : 'localStorage'; },
};

export function newId() {
  const b = new Uint8Array(8); (globalThis.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_, i) => (b[i] = Math.random() * 256));
  return Date.now().toString(36) + '-' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_PREFS = { theme: 'auto', sound: false, ambient: false, method: 'coins', shake: false, introSeen: false };
export const prefs = {
  get() { try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; } catch { return { ...DEFAULT_PREFS }; } },
  set(patch) { const p = { ...prefs.get(), ...patch }; try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch {} return p; },
};

/** Validate imported journal JSON. Accepts {entries:[...]} or [...]. */
export function parseImport(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : data && Array.isArray(data.entries) ? data.entries : null;
  if (!arr) throw new Error('This file does not look like an I Ching journal export.');
  const ok = arr.filter((e) => e && typeof e === 'object' && Array.isArray(e.lines) && e.lines.length === 6 && e.lines.every((v) => [6, 7, 8, 9].includes(v)));
  return ok.map((e) => ({
    id: typeof e.id === 'string' ? e.id : newId(), date: typeof e.date === 'string' ? e.date : new Date().toISOString(),
    question: String(e.question || ''), method: e.method === 'yarrow' ? 'yarrow' : 'coins', lines: e.lines,
    primary: Number(e.primary) || null, resulting: e.resulting ? Number(e.resulting) : null, changing: Array.isArray(e.changing) ? e.changing : [],
    readingText: String(e.readingText || ''), notes: String(e.notes || ''), observations: String(e.observations || ''), context: String(e.context || ''),
  }));
}
