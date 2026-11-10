import { marked } from 'marked';

// Configure marked defaults for technical prose
marked.setOptions({
  gfm: true,
  breaks: true
});

let codeBlockCounter = 0;

/**
 * HTML Escaping
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Human-friendly key formatting
 */
function formatKey(key) {
  if (!key) return '';
  return String(key)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Determines if a value should be considered empty / omitted
 */
function isEmptyValue(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const s = val.trim();
    return s === '' || s === '-' || s === '—' || s === '--';
  }
  if (Array.isArray(val)) {
    return val.length === 0 || val.every(isEmptyValue);
  }
  if (typeof val === 'object') {
    return Object.keys(val).length === 0;
  }
  return false;
}

/**
 * Checks if an array qualifies to be rendered as a table:
 * ALL must be true:
 * 1. 5 columns or fewer
 * 2. Every cell is a scalar of 60 chars or fewer
 * 3. No cell is an array or object
 */
export function isTableEligible(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  if (!arr.every(item => item && typeof item === 'object' && !Array.isArray(item))) return false;

  const columns = [];
  for (const item of arr) {
    for (const k of Object.keys(item)) {
      if (!columns.includes(k)) columns.push(k);
    }
  }

  if (columns.length === 0 || columns.length > 5) return false;

  for (const item of arr) {
    for (const col of columns) {
      const val = item[col];
      if (val === null || val === undefined) continue;
      if (typeof val === 'object' || Array.isArray(val)) return false;
      if (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') return false;
      if (String(val).length > 60) return false;
    }
  }

  return true;
}

/**
 * Legacy check kept for compatibility
 */
function isUniformArrayOfObjects(arr) {
  return isTableEligible(arr);
}

/**
 * Finds the first id-like key in an object (id, lab_id, code)
 */
function findIdKey(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const keys = Object.keys(obj);
  for (const k of keys) {
    const lower = k.toLowerCase();
    if ((lower === 'id' || lower === 'lab_id' || lower === 'code') && !isEmptyValue(obj[k])) {
      return k;
    }
  }
  for (const k of keys) {
    const lower = k.toLowerCase();
    if ((lower.endsWith('_id') || lower.endsWith('_code')) && !isEmptyValue(obj[k])) {
      return k;
    }
  }
  return null;
}

/**
 * Finds the first title-like key in an object (title, name)
 */
function findTitleKey(obj, idKey) {
  if (!obj || typeof obj !== 'object') return null;
  const keys = Object.keys(obj);
  for (const k of keys) {
    if (k === idKey) continue;
    const lower = k.toLowerCase();
    if ((lower === 'title' || lower === 'name') && !isEmptyValue(obj[k])) {
      return k;
    }
  }
  for (const k of keys) {
    if (k === idKey) continue;
    const lower = k.toLowerCase();
    if ((lower === 'concept_title' || lower === 'topic' || lower === 'heading') && !isEmptyValue(obj[k])) {
      return k;
    }
  }
  return null;
}

/**
 * Extracts title from object using priority keys
 */
function getObjectTitle(obj, fallbackIndex) {
  if (!obj || typeof obj !== 'object') return `ENTRY ${fallbackIndex + 1}`;

  const priorityKeys = ['title', 'name', 'term', 'question', 'concept_title', 'topic', 'unit_id', 'id', 'header'];
  for (const k of priorityKeys) {
    for (const objKey of Object.keys(obj)) {
      if (objKey.toLowerCase() === k && typeof obj[objKey] === 'string' && obj[objKey].trim()) {
        return obj[objKey];
      }
    }
  }

  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.length > 0 && v.length < 80) {
      return `${formatKey(k)}: ${v}`;
    }
  }

  return `ITEM ${fallbackIndex + 1}`;
}

/**
 * Renders a code panel with copy button
 */
export function renderCodePanel(codeText, titleOrLanguage = 'CODE') {
  const id = `code-block-${++codeBlockCounter}`;
  const cleanCode = typeof codeText === 'string' ? codeText : JSON.stringify(codeText, null, 2);
  const escaped = escapeHtml(cleanCode);

  return `
    <div class="border border-outline-variant/30 bg-surface-container-lowest my-space-sm">
      <div class="flex items-center justify-between px-space-md py-1.5 bg-surface-container-low border-b border-outline-variant/30 font-label-sm text-label-sm">
        <span class="text-primary-container font-mono tracking-wider uppercase">[${escapeHtml(titleOrLanguage)}]</span>
        <button 
          type="button"
          class="copy-btn font-mono text-[10px] text-outline hover:text-primary border border-outline-variant/30 px-2 py-0.5 uppercase tracking-widest bg-surface-container transition-colors cursor-pointer"
          data-target="${id}"
        >
          COPY
        </button>
      </div>
      <pre class="p-space-md overflow-x-auto font-mono text-[12px] leading-relaxed text-on-surface bg-surface-container-lowest select-all"><code id="${id}">${escaped}</code></pre>
    </div>
  `;
}

/**
 * Renders an HTML table for tabular / comparison data
 */
export function renderTable(items, tableTitle = '') {
  if (!Array.isArray(items) || items.length === 0) return '';

  const headers = [];
  for (const item of items) {
    if (item && typeof item === 'object') {
      for (const k of Object.keys(item)) {
        if (!headers.includes(k)) headers.push(k);
      }
    }
  }

  if (headers.length === 0) return '';

  const headerHtml = headers.map(h => `
    <th class="p-space-sm text-left font-mono font-bold text-outline border-r border-outline-variant/20 last:border-r-0 tracking-wider min-w-[130px]">
      ${escapeHtml(formatKey(h))}
    </th>
  `).join('');

  const rowsHtml = items.map(row => {
    if (!row || typeof row !== 'object') return '';
    const cells = headers.map(h => {
      const val = row[h];
      let displayVal = '';
      if (val === null || val === undefined || val === '' || val === '-' || val === '—') displayVal = '—';
      else if (typeof val === 'string') displayVal = marked.parseInline(val);
      else if (typeof val === 'number' || typeof val === 'boolean') displayVal = `<span class="font-mono text-primary-container">${String(val)}</span>`;
      else if (Array.isArray(val)) displayVal = val.map(v => typeof v === 'string' ? marked.parseInline(v) : JSON.stringify(v)).join(', ');
      else displayVal = `<pre class="text-[10px] font-mono">${escapeHtml(JSON.stringify(val))}</pre>`;

      return `<td class="p-space-sm border-r border-outline-variant/20 last:border-r-0 text-on-surface align-top min-w-[130px]">${displayVal}</td>`;
    }).join('');

    return `<tr class="border-b border-outline-variant/20 last:border-b-0 hover:bg-surface-container-low/50">${cells}</tr>`;
  }).join('');

  return `
    <div class="my-space-md border border-outline-variant/30 bg-surface-container-lowest">
      ${tableTitle ? `<div class="px-space-md py-1.5 bg-surface-container-low border-b border-outline-variant/30 font-label-sm text-label-sm uppercase tracking-wider text-outline">${escapeHtml(tableTitle)}</div>` : ''}
      <div class="table-scroll-wrapper">
        <table class="w-full text-left font-body-sm text-body-sm border-collapse">
          <thead>
            <tr class="bg-surface-container-low/80 border-b border-outline-variant/30 font-label-sm text-label-sm uppercase">
              ${headerHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Renders click-to-reveal answer assessment cards
 */
export function renderQuizCards(value, sectionTitle = 'ASSESSMENT CHECKPOINT') {
  if (!value) return '';

  const list = Array.isArray(value) ? value : [value];

  const cardsHtml = list.map((item, idx) => {
    if (!item) return '';

    if (typeof item === 'string') {
      return `
        <div class="border border-outline-variant/30 bg-surface-container-low p-space-md my-space-xs">
          <div class="font-headline-sm text-headline-sm text-primary mb-space-xs">QUESTION 0${idx + 1}</div>
          <div class="font-body-md text-on-surface mb-space-sm">${marked.parse(item)}</div>
        </div>
      `;
    }

    if (typeof item !== 'object') return '';

    const qText = item.question || item.q || item.prompt || item.title || `Question 0${idx + 1}`;
    const aText = item.answer || item.a || item.solution || item.explanation || item.correct_answer || item.result;
    const options = item.options || item.choices || item.answers;

    let optionsHtml = '';
    if (Array.isArray(options) && options.length > 0) {
      optionsHtml = `
        <div class="flex flex-col gap-1.5 my-space-sm">
          ${options.map((opt, oIdx) => `
            <div class="p-space-xs px-space-sm border border-outline-variant/20 bg-surface-container-lowest font-body-sm text-on-surface flex items-center gap-2">
              <span class="font-mono text-outline text-[11px] font-bold">[${String.fromCharCode(65 + oIdx)}]</span>
              <span>${typeof opt === 'string' ? marked.parseInline(opt) : escapeHtml(JSON.stringify(opt))}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    let answerHtml = '';
    if (aText) {
      const formattedAns = typeof aText === 'string' ? marked.parse(aText) : renderValue('', aText);
      answerHtml = `
        <details class="group mt-space-sm border border-outline-variant/20 bg-surface-container-lowest cursor-pointer">
          <summary class="px-space-md py-space-xs font-label-sm text-label-sm text-primary-container uppercase tracking-wider select-none hover:bg-surface-container-low flex items-center justify-between">
            <span>[▶ REVEAL TELEMETRIC ANSWER]</span>
            <span class="text-outline group-open:rotate-90 transition-transform">▸</span>
          </summary>
          <div class="p-space-md border-t border-outline-variant/20 bg-surface-container-low/40 font-body-sm text-on-surface">
            ${formattedAns}
          </div>
        </details>
      `;
    }

    const handledKeys = ['question', 'q', 'prompt', 'title', 'answer', 'a', 'solution', 'explanation', 'correct_answer', 'result', 'options', 'choices', 'answers'];
    const otherEntries = Object.entries(item).filter(([k]) => !handledKeys.includes(k.toLowerCase()));
    let otherHtml = '';
    if (otherEntries.length > 0) {
      otherHtml = `
        <div class="mt-space-xs pt-space-xs border-t border-outline-variant/20 flex flex-col gap-1">
          ${otherEntries.map(([k, v]) => renderValue(k, v)).join('')}
        </div>
      `;
    }

    return `
      <div class="border border-outline-variant/30 bg-surface-container-low p-space-md my-space-sm">
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1 mb-space-xs font-label-sm text-label-sm">
          <span class="text-primary-container font-mono tracking-widest uppercase">QUESTION 0${idx + 1}</span>
          <span class="text-outline">ASSESSMENT CHECKPOINT</span>
        </div>
        <div class="font-body-md text-body-md text-primary font-medium my-space-xs">${typeof qText === 'string' ? marked.parse(qText) : renderValue('', qText)}</div>
        ${optionsHtml}
        ${answerHtml}
        ${otherHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="my-space-md">
      ${sectionTitle ? `<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-space-xs border-b border-outline-variant/20 pb-1">${escapeHtml(sectionTitle)}</div>` : ''}
      ${cardsHtml}
    </div>
  `;
}

/**
 * Renders array of strings as a styled list
 */
export function renderList(strings, listTitle = '') {
  if (!Array.isArray(strings) || strings.length === 0) return '';

  const itemsHtml = strings.map(str => {
    if (str === null || str === undefined || str === '') return '';
    return `
      <li class="flex items-start gap-space-sm font-body-md text-body-md text-on-surface">
        <span class="text-primary-container font-mono text-label-sm select-none mt-1">▸</span>
        <div class="flex-1 text-on-surface-variant">${typeof str === 'string' ? marked.parseInline(str) : escapeHtml(String(str))}</div>
      </li>
    `;
  }).join('');

  return `
    <div class="my-space-sm">
      ${listTitle ? `<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">${escapeHtml(listTitle)}</div>` : ''}
      <ul class="flex flex-col gap-1.5 list-none pl-0 my-1">
        ${itemsHtml}
      </ul>
    </div>
  `;
}

/**
 * Renders array of objects as an accordion
 */
export function renderAccordion(items, sectionTitle = '') {
  if (!Array.isArray(items) || items.length === 0) return '';

  const accordionItemsHtml = items.map((obj, idx) => {
    if (!obj || typeof obj !== 'object') {
      return renderValue('', obj);
    }

    const title = getObjectTitle(obj, idx);
    const priorityKeys = ['title', 'name', 'term', 'question', 'concept_title', 'topic', 'unit_id'];
    const entries = Object.entries(obj).filter(([k]) => !priorityKeys.includes(k.toLowerCase()) || obj[k] !== title);
    const bodyHtml = entries.map(([k, v]) => renderValue(k, v)).join('');

    return `
      <details class="border border-outline-variant/30 my-space-xs bg-surface-container-lowest group" ${idx === 0 ? 'open' : ''}>
        <summary class="px-space-md py-space-sm bg-surface-container-low cursor-pointer flex items-center justify-between font-headline-sm text-headline-sm text-primary select-none hover:text-primary-container transition-colors">
          <span class="flex items-center gap-space-sm truncate">
            <span class="font-mono text-outline text-label-sm">0${idx + 1}</span>
            <span class="truncate">${escapeHtml(title)}</span>
          </span>
          <span class="font-label-sm text-primary-container group-open:rotate-90 transition-transform">▸</span>
        </summary>
        <div class="p-space-md border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col gap-space-sm">
          ${bodyHtml}
        </div>
      </details>
    `;
  }).join('');

  return `
    <div class="my-space-md">
      ${sectionTitle ? `<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-space-xs border-b border-outline-variant/20 pb-1">${escapeHtml(sectionTitle)}</div>` : ''}
      <div class="flex flex-col">
        ${accordionItemsHtml}
      </div>
    </div>
  `;
}

/**
 * Renders a single object as a structured card
 */
export function renderCard(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return renderRawPanel(item, 'TELEMETRY ITEM');
  }

  try {
    const idKey = findIdKey(item);
    const titleKey = findTitleKey(item, idKey);

    const hasHeader = idKey || titleKey;
    const headerHtml = hasHeader ? `
      <div class="card-header">
        ${idKey ? `<span class="card-tag font-mono">${escapeHtml(String(item[idKey]))}</span>` : ''}
        ${titleKey ? `<h4 class="card-title font-bold">${escapeHtml(String(item[titleKey]))}</h4>` : ''}
      </div>
    ` : '';

    const remainingEntries = Object.entries(item).filter(([k, v]) => {
      if (k === idKey || k === titleKey) return false;
      return !isEmptyValue(v);
    });

    const fieldsHtml = remainingEntries.map(([k, v]) => {
      const isArray = Array.isArray(v);
      const isLongText = typeof v === 'string' && v.length > 120;
      const isObject = typeof v === 'object' && v !== null;
      const isFullSpan = isArray || isLongText || isObject;

      let valueHtml = '';
      if (isArray) {
        const hasObjects = v.some(it => it && typeof it === 'object');
        if (hasObjects) {
          valueHtml = renderRawPanel(v, k);
        } else {
          const isNumbered = /procedure|steps|step/i.test(k);
          const listItems = v
            .filter(it => !isEmptyValue(it))
            .map(it => `<li>${typeof it === 'string' ? marked.parseInline(it) : escapeHtml(String(it))}</li>`)
            .join('');

          if (listItems) {
            const tag = isNumbered ? 'ol' : 'ul';
            const cls = isNumbered ? 'card-items-list card-items-list--numbered' : 'card-items-list card-items-list--bulleted';
            valueHtml = `<${tag} class="${cls}">${listItems}</${tag}>`;
          }
        }
      } else if (typeof v === 'string') {
        valueHtml = marked.parse(v);
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        valueHtml = `<span class="font-mono text-on-surface">${String(v)}</span>`;
      } else if (typeof v === 'object' && v !== null) {
        valueHtml = renderRawPanel(v, k);
      } else {
        valueHtml = renderRawPanel(v, k);
      }

      return `
        <div class="card-field${isFullSpan ? ' card-field--full' : ''}">
          <div class="card-label">${escapeHtml(formatKey(k))}</div>
          <div class="card-value">${valueHtml}</div>
        </div>
      `;
    }).join('');

    const gridHtml = remainingEntries.length > 0 ? `
      <div class="card-grid">
        ${fieldsHtml}
      </div>
    ` : '';

    return `
      <article class="card">
        ${headerHtml}
        ${gridHtml}
      </article>
    `;
  } catch (err) {
    return renderRawPanel(item, 'TELEMETRY ITEM');
  }
}

/**
 * Renders an array of objects as a card list
 */
export function renderCardList(items, listTitle = '') {
  if (!Array.isArray(items) || items.length === 0) return '';

  const cardsHtml = items.map(item => renderCard(item)).join('');

  return `
    <div class="my-space-md">
      ${listTitle ? `<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-space-xs border-b border-outline-variant/20 pb-1">${escapeHtml(listTitle)}</div>` : ''}
      <div class="card-list">
        ${cardsHtml}
      </div>
    </div>
  `;
}

/**
 * Fallback collapsible raw panel for unknown data shapes
 */
export function renderRawPanel(value, label = 'RAW TELEMETRY') {
  if (value === null || value === undefined || value === '') return '';
  const escaped = escapeHtml(JSON.stringify(value, null, 2));

  return `
    <details class="border border-outline-variant/30 bg-surface-container-lowest my-space-xs font-label-sm">
      <summary class="px-space-sm py-1 bg-surface-container-low text-outline cursor-pointer uppercase tracking-wider hover:text-on-surface select-none flex items-center justify-between">
        <span>[+] RAW TELEMETRY: ${escapeHtml(formatKey(label))}</span>
        <span class="text-[10px] font-mono text-outline">JSON</span>
      </summary>
      <pre class="p-space-sm overflow-x-auto text-[11px] font-mono text-on-surface-variant leading-tight bg-surface-container-lowest select-all"><code>${escaped}</code></pre>
    </details>
  `;
}

/**
 * Generic shape-based recursive dispatcher
 */
export function renderValue(key = '', value) {
  if (value === null || value === undefined || value === '') return '';

  const keyLower = String(key || '').toLowerCase();

  // 1. Key matches code / snippet / command / hcl (excluding course code metadata)
  if (key && !/course[-_]?code/i.test(keyLower) && /code|snippet|command|hcl/i.test(keyLower)) {
    return renderCodePanel(value, formatKey(key));
  }

  // 2. Key matches quiz / question / mcq
  if (key && /quiz|question|mcq/i.test(keyLower)) {
    return renderQuizCards(value, formatKey(key));
  }

  // 3. Array handling
  if (Array.isArray(value)) {
    if (value.length === 0) return '';

    // Check if table (only if 5 cols or fewer, scalar <= 60 chars, no array/object)
    if (isTableEligible(value)) {
      return renderTable(value, formatKey(key));
    }

    // Check if array of primitives / strings
    const allPrimitives = value.every(it => it === null || it === undefined || typeof it === 'string' || typeof it === 'number' || typeof it === 'boolean');
    if (allPrimitives) {
      return renderList(value.map(v => String(v ?? '')), formatKey(key));
    }

    // Check if array of objects (or mixed containing objects) -> CARD LIST
    const hasObjects = value.some(it => it && typeof it === 'object');
    if (hasObjects) {
      return renderCardList(value);
    }

    return renderRawPanel(value, key);
  }

  // 4. String handling
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Fenced code block detection
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      const codeOnly = trimmed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      return renderCodePanel(codeOnly, formatKey(key) || 'SNIPPET');
    }

    // Title / heading key
    if (key && /title|name|heading|concept_title/i.test(keyLower)) {
      return `<h3 class="font-headline-md text-headline-md text-primary tracking-tight mt-space-sm mb-space-xs border-b border-outline-variant/20 pb-1">${escapeHtml(value)}</h3>`;
    }

    // Course code identifier (plain value without code panel or copy button)
    if (key && /course[-_]?code/i.test(keyLower)) {
      return `
        <div class="font-label-sm text-label-sm text-outline my-0.5">
          <span class="uppercase tracking-wider">${escapeHtml(formatKey(key))}:</span>
          <span class="font-mono text-primary-container font-bold">${escapeHtml(value)}</span>
        </div>
      `;
    }

    // Standard markdown paragraph
    if (key) {
      return `
        <div class="my-space-xs">
          <span class="font-mono text-label-sm text-outline uppercase tracking-wider block mb-0.5">${escapeHtml(formatKey(key))}</span>
          <div class="font-body-md text-body-md text-on-surface-variant leading-relaxed">${marked.parse(value)}</div>
        </div>
      `;
    }

    return `<div class="font-body-md text-body-md text-on-surface-variant leading-relaxed my-space-xs">${marked.parse(value)}</div>`;
  }

  // 5. Primitive numbers or booleans
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `
      <div class="font-label-sm text-label-sm text-outline my-0.5">
        <span class="uppercase tracking-wider">${escapeHtml(formatKey(key))}:</span>
        <span class="font-mono text-primary-container font-bold">${String(value)}</span>
      </div>
    `;
  }

  // 6. Generic Object
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length === 0) return '';

    const contentHtml = entries.map(([k, v]) => renderValue(k, v)).join('');

    if (key) {
      return `
        <div class="border border-outline-variant/30 bg-surface-container-low/40 p-space-md my-space-sm">
          <div class="font-label-sm text-label-sm text-primary uppercase tracking-wider border-b border-outline-variant/20 pb-1 mb-space-xs font-bold">
            ${escapeHtml(formatKey(key))}
          </div>
          <div class="flex flex-col gap-space-xs">
            ${contentHtml}
          </div>
        </div>
      `;
    }

    return contentHtml;
  }

  // Fallback
  return renderRawPanel(value, key);
}

/**
 * Top-level render function for a parsed artifact.
 * Wraps major sections in trackable cards for progress checkboxes.
 */
export function renderContent(data, coNumber = 1) {
  if (!data) return '';

  if (data === 'UNREADABLE TRANSMISSION') {
    return `
      <div class="p-space-lg border border-error/50 bg-error-container/20 text-error font-mono text-label-md my-space-md">
        <div class="font-bold mb-1">[UNREADABLE TRANSMISSION]</div>
        <p class="font-body-sm text-on-surface-variant">The source manuscript contains invalid syntax and could not be parsed.</p>
      </div>
    `;
  }

  if (typeof data !== 'object') {
    return renderValue('', data);
  }

  const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return '';

  return entries.map(([key, value], idx) => {
    const secId = `sec-${coNumber}-${idx}`;
    const sectionBody = renderValue(key, value);
    if (!sectionBody.trim()) return '';

    return `
      <section class="lesson-section border border-outline-variant/30 bg-surface-container-lowest p-space-md lg:p-space-lg my-space-md" data-section-id="${secId}">
        <div class="flex flex-wrap items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md gap-2">
          <div class="flex items-center gap-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline">
            <span class="text-primary-container font-headline-sm text-headline-sm select-none">+</span>
            <span class="text-primary font-bold">${escapeHtml(formatKey(key))}</span>
          </div>
          <label class="flex items-center gap-space-xs font-label-sm text-label-sm text-outline hover:text-primary cursor-pointer select-none">
            <input 
              type="checkbox" 
              class="section-done-checkbox accent-primary-container w-3.5 h-3.5 cursor-pointer" 
              data-co="${coNumber}" 
              data-sec="${secId}" 
            />
            <span>MARK DONE</span>
          </label>
        </div>
        ${sectionBody}
      </section>
    `;
  }).join('');
}

