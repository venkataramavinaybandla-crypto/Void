import * as yaml from 'js-yaml';

// Import all content files dynamically via Vite glob
const rawModules = import.meta.glob('/content/**/*.{yaml,yml,json,md}', {
  eager: true,
  query: '?raw',
  import: 'default'
});

/**
 * Extracts Course Outcome number (1-6) from a file path.
 * Accepts co1..co6, case-insensitive, including CO1, co-1, CO1_x, etc.
 */
function extractCoNumber(filepath) {
  if (!filepath || typeof filepath !== 'string') return null;
  const normalized = filepath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  for (const seg of segments) {
    const m = seg.match(/^co[-_]?([1-6])(?:\b|_|$)/i);
    if (m) {
      return parseInt(m[1], 10);
    }
  }
  return null;
}

/**
 * Parses raw file string safely in a try/catch. Never throws.
 * Returns 'UNREADABLE TRANSMISSION' if parsing fails.
 */
function safeParse(filename, raw) {
  if (typeof raw !== 'string') {
    return 'UNREADABLE TRANSMISSION';
  }
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'yaml' || ext === 'yml') {
    try {
      const parsed = yaml.load(raw);
      return parsed !== undefined ? parsed : {};
    } catch {
      return 'UNREADABLE TRANSMISSION';
    }
  } else if (ext === 'json') {
    try {
      return JSON.parse(raw);
    } catch {
      return 'UNREADABLE TRANSMISSION';
    }
  } else {
    // Markdown or plain text
    return raw;
  }
}

/**
 * Retrieves files, parsed data, and status for course outcome n.
 * Returns { files, data, status: "empty" | "partial" | "ready" }
 */
export function getCO(n) {
  let coNum = null;
  if (typeof n === 'number') {
    coNum = n;
  } else if (typeof n === 'string') {
    const m = n.match(/([1-6])/);
    if (m) {
      coNum = parseInt(m[1], 10);
    }
  }

  if (!coNum || coNum < 1 || coNum > 6) {
    return { files: [], data: [], status: 'empty' };
  }

  const files = [];
  const data = [];

  for (const [path, raw] of Object.entries(rawModules)) {
    if (extractCoNumber(path) === coNum) {
      const filename = path.split('/').pop() || path;
      const parsed = safeParse(filename, raw);
      files.push(filename);
      data.push(parsed);
    }
  }

  let status = 'empty';
  if (files.length === 0) {
    status = 'empty';
  } else {
    const unreadableCount = data.filter(d => d === 'UNREADABLE TRANSMISSION').length;
    if (files.length >= 4 && unreadableCount === 0) {
      status = 'ready';
    } else {
      status = 'partial';
    }
  }

  return { files, data, status };
}

/**
 * Returns total count of detected content files
 */
export function getAllFilesCount() {
  return Object.keys(rawModules).length;
}

/**
 * Returns raw text of a file given its path or filename
 */
export function getRawFile(pathOrFilename) {
  if (!pathOrFilename) return null;
  for (const [path, raw] of Object.entries(rawModules)) {
    if (path === pathOrFilename || path.endsWith('/' + pathOrFilename) || path.endsWith('\\' + pathOrFilename)) {
      return raw;
    }
  }
  return null;
}

/**
 * Returns structured metadata list for all loaded content files
 */
export function getAllFilesList() {
  const list = [];
  for (const [path, raw] of Object.entries(rawModules)) {
    const filename = path.split('/').pop() || path;
    const coNum = extractCoNumber(path) || 1;
    list.push({
      path,
      filename,
      coNum,
      raw,
      parsed: safeParse(filename, raw)
    });
  }
  // Sort by coNum then filename
  list.sort((a, b) => a.coNum - b.coNum || a.filename.localeCompare(b.filename));
  return list;
}

export function getAllCOSummary() {
  const summary = {};
  for (let i = 1; i <= 6; i++) {
    summary[i] = getCO(i);
  }
  return summary;
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
