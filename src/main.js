import { syllabus } from './syllabus.js';
import { getCO, getAllFilesCount, getAllFilesList, getRawFile } from './content.js';
import { renderContent } from './render.js';
import { mountLab, unmountLab } from './labEngine.js';

// DOM Mount
const app = document.getElementById('app');

// State store
const appState = {
  lessonActiveFileIndex: {}, // { [coNum]: number }
  sourceActivePath: null
};

/**
 * Updates header navigation active styling
 */
function updateNavigation(activeTab) {
  const tabs = {
    ephemeris: document.getElementById('nav-ephemeris'),
    lesson: document.getElementById('nav-lesson'),
    lab: document.getElementById('nav-lab'),
    source: document.getElementById('nav-source')
  };

  const activeClasses = 'text-primary-container border-b border-primary-container';
  const inactiveClasses = 'text-on-surface-variant hover:text-primary';

  for (const [key, el] of Object.entries(tabs)) {
    if (!el) continue;
    if (key === activeTab) {
      el.className = `transition-none py-1 ${activeClasses}`;
      el.setAttribute('aria-current', 'page');
    } else {
      el.className = `transition-none py-1 ${inactiveClasses}`;
      el.removeAttribute('aria-current');
    }
  }
}

/**
 * Returns formatted status badge HTML
 */
function renderBadge(status) {
  const upper = (status || 'empty').toUpperCase();
  if (upper === 'READY') {
    return `<span class="border border-primary-container/40 bg-primary-container/10 px-1.5 py-0.5 text-primary-container font-mono text-[9px] tracking-widest uppercase">READY</span>`;
  }
  if (upper === 'PARTIAL') {
    return `<span class="border border-[#e0c068]/50 bg-[#e0c068]/10 px-1.5 py-0.5 text-[#e0c068] font-mono text-[9px] tracking-widest uppercase">PARTIAL</span>`;
  }
  return `<span class="border border-outline-variant/40 bg-surface-container px-1.5 py-0.5 text-outline font-mono text-[9px] tracking-widest uppercase">EMPTY</span>`;
}

/**
 * Restores section checkboxes from localStorage and updates sidebar progress
 */
function restoreSectionProgress(coId) {
  const storageKey = `void:progress:co${coId}`;
  let progress = {};
  try {
    progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {}

  const checkboxes = document.querySelectorAll(`.section-done-checkbox[data-co="${coId}"]`);
  checkboxes.forEach(cb => {
    const sec = cb.getAttribute('data-sec');
    cb.checked = !!progress[sec];
  });

  updateSidebarProgress(coId);
}

/**
 * Recalculates and updates sidebar progress bar and percentage
 */
function updateSidebarProgress(coId) {
  const storageKey = `void:progress:co${coId}`;
  let progress = {};
  try {
    progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {}

  const checkboxes = document.querySelectorAll(`.section-done-checkbox[data-co="${coId}"]`);
  const total = checkboxes.length;
  const done = Object.keys(progress).filter(k => progress[k]).length;
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  const percentEl = document.getElementById('sidebar-progress-percent');
  const barEl = document.getElementById('sidebar-progress-bar');
  if (percentEl) percentEl.innerText = `${percent}% (${done}/${total})`;
  if (barEl) barEl.style.width = `${percent}%`;
}

/**
 * Renders the Ephemeris overview page matching screen.png exactly
 */
function renderEphemeris() {
  unmountLab();
  updateNavigation('ephemeris');

  const totalFiles = getAllFilesCount();

  const coRowsHtml = syllabus.map((co) => {
    const coData = getCO(co.id);
    const badgeHtml = renderBadge(coData.status);
    const sessionListHtml = co.sessions.map((s) => `S0${s.number}: ${s.title}`).join(' · ');

    return `
      <div 
        class="group relative flex flex-col md:flex-row md:items-baseline gap-space-md py-space-lg transition-none hover:bg-surface-container-low/40 cursor-pointer"
        onclick="window.location.hash = '#/lesson/co${co.id}'"
        role="button"
        tabindex="0"
      >
        <span class="font-headline-lg text-headline-lg text-outline/40 group-hover:text-primary-container leading-none select-none md:w-16 shrink-0 transition-colors">
          0${co.id}
        </span>
        <div class="flex flex-col flex-1 min-w-0">
          <div class="flex flex-wrap items-baseline justify-between gap-space-sm">
            <span class="font-headline-sm text-headline-sm tracking-tight text-primary flex items-center gap-space-xs">
              <span>${co.code}: ${co.title.toUpperCase()}</span>
              <span class="text-primary-container font-headline-sm opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </span>
            <div class="flex items-center gap-space-xs font-label-md text-label-md text-outline tracking-widest">
              <span>[${co.code} / 4 SESSIONS /</span>
              ${badgeHtml}
              <span>]</span>
            </div>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            ${co.description}
          </p>
          <div class="mt-space-xs pt-space-xs text-outline font-label-sm text-label-sm truncate">
            ${sessionListHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="flex flex-col w-full text-on-surface">
      <div class="w-full px-margin-mobile lg:px-margin pt-space-lg pb-space-xl">
        
        <!-- Top index telemetry strip -->
        <div class="flex flex-wrap items-center justify-between gap-space-sm pb-space-md border-b border-outline-variant/30 font-label-sm text-label-sm">
          <div class="flex items-center gap-space-md text-outline">
            <span class="text-primary font-headline-sm text-headline-sm">+</span>
            <span>INDEX REF: CLOUD-INFRA-2026.04</span>
            <span class="text-outline-variant">/</span>
            <span class="text-primary-container">MULTI-CLOUD ARCHITECTURE OBSERVER</span>
          </div>
          <div class="flex items-center gap-space-lg text-outline">
            <span>CARTOGRAPHY: 12-COL FIXED TICK</span>
            <span class="text-outline-variant">//</span>
            <span>FRAME: 01 / 06</span>
            <span class="text-primary font-headline-sm text-headline-sm">+</span>
          </div>
        </div>

        <!-- Main Ephemeris Grid -->
        <div class="ephemeris-grid gap-y-space-xl lg:gap-x-margin mt-space-lg items-start">
          
          <!-- Left Column: Syllabus & Course Outcomes -->
          <div class="lg:col-span-7 flex flex-col">
            <div class="flex items-center gap-space-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-widest pb-space-xs">
              <span>COGNITIVE ORBITS 01–06</span>
              <span class="text-outline-variant">/</span>
              <span>FROM PHYSICAL HYPERVISOR TO FINOPS RUNTIME</span>
            </div>

            <h1 class="font-headline-xl text-headline-xl italic text-primary tracking-tight leading-none pt-space-xs pb-space-lg border-b border-outline-variant/30 select-none">
              Clouds, falling inward.
            </h1>

            <div class="flex items-center justify-between py-space-sm border-b border-outline-variant/30 font-label-sm text-label-sm text-outline uppercase tracking-wider">
              <div class="flex items-center gap-space-sm">
                <span class="text-outline-variant">+</span>
                <span>SYLLABIC GEODESICS</span>
              </div>
              <span>24 SESSIONS TOTAL</span>
            </div>

            <div class="flex flex-col divide-y divide-outline-variant/30">
              ${coRowsHtml}
            </div>

            <div class="flex flex-wrap items-center justify-between gap-space-md pt-space-lg border-t border-outline-variant/30 mt-space-md">
              <a class="inline-flex items-center gap-space-sm font-label-md text-label-md text-primary-container hover:text-primary tracking-widest uppercase border-b border-primary-container pb-0.5 cursor-pointer" href="#/lesson/co1">
                <span>Read Complete Syllabus</span>
                <span class="text-headline-sm">→</span>
              </a>
              <div class="flex items-center gap-space-md font-label-sm text-label-sm text-outline">
                <span>RFC 1149 / CLOUD EQUIVALENT</span>
                <span class="text-outline-variant">•</span>
                <span>AVAILABILITY DRIFT: 0.00%</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Celestial Projection / FIG 1.0 & Metrics -->
          <div class="lg:col-span-5 flex flex-col">
            <div class="flex items-center justify-between pb-space-xs border-b border-outline-variant/30 font-label-sm text-label-sm text-outline">
              <div class="flex items-center gap-space-xs">
                <span class="text-primary font-headline-sm text-headline-sm">+</span>
                <span>FIG. 1.0 // CELESTIAL PROJECTION</span>
              </div>
              <span class="text-primary-container">AZ 142.8° • EL +58.2°</span>
            </div>

            <div class="relative w-full border border-outline-variant/30 bg-surface-container-lowest p-space-md my-space-sm select-none">
              <div class="absolute top-2 left-2 font-label-sm text-label-sm text-outline">
                R_COORD: [0x4F:CLOUD_CORE]
              </div>
              <div class="absolute top-2 right-2 font-label-sm text-label-sm text-outline">
                US-EAST-1 // EU-WEST-1
              </div>
              <div class="absolute bottom-2 left-2 font-label-sm text-label-sm text-outline">
                EPOCH: 2026.4
              </div>
              <div class="absolute bottom-2 right-2 font-label-sm text-label-sm text-primary-container">
                STATUS: ACTIVE RADIAL
              </div>

              <!-- Celestial/Cloud Orbit Rings SVG -->
              <svg class="w-full h-auto text-outline" preserveAspectRatio="xMidYMid meet" viewBox="0 0 500 500">
                <defs>
                  <pattern height="8" id="stipple" patternUnits="userSpaceOnUse" width="8">
                    <circle cx="2" cy="2" fill="#8e9197" opacity="0.35" r="0.6"></circle>
                    <circle cx="6" cy="6" fill="#8e9197" opacity="0.25" r="0.6"></circle>
                  </pattern>
                </defs>

                <rect fill="none" height="460" stroke="#43474d" stroke-dasharray="2,4" stroke-width="0.5" width="460" x="20" y="20"></rect>

                <!-- Orbit concentric rings -->
                <circle cx="250" cy="250" fill="none" r="210" stroke="#43474d" stroke-width="0.5"></circle>
                <circle cx="250" cy="250" fill="none" r="170" stroke="#43474d" stroke-width="0.75"></circle>
                <circle cx="250" cy="250" fill="none" r="120" stroke="#8e9197" stroke-dasharray="4,3" stroke-width="0.75"></circle>
                <circle cx="250" cy="250" fill="none" r="80" stroke="#cfe3ff" stroke-width="1"></circle>
                <circle cx="250" cy="250" fill="#0e0e0e" r="50" stroke="#cfe3ff" stroke-width="1.5"></circle>

                <!-- Accretion and projection ellipses -->
                <path d="M 60 250 A 190 65 0 0 1 440 250" fill="none" stroke="url(#stipple)" stroke-width="40"></path>
                <ellipse cx="250" cy="250" fill="none" rx="190" ry="45" stroke="#43474d" stroke-width="0.75"></ellipse>
                <ellipse cx="250" cy="250" fill="none" rx="140" ry="30" stroke="#8e9197" stroke-width="0.5"></ellipse>
                <path d="M 120 220 C 180 150, 320 150, 380 220" fill="none" stroke="#cfe3ff" stroke-width="1.75"></path>
                <path d="M 150 235 C 200 180, 300 180, 350 235" fill="none" stroke="#cfe3ff" stroke-dasharray="2,2" stroke-width="0.75"></path>

                <!-- Crosshairs -->
                <line stroke="#43474d" stroke-dasharray="1,5" stroke-width="0.5" x1="250" x2="250" y1="40" y2="460"></line>
                <line stroke="#43474d" stroke-dasharray="1,5" stroke-width="0.5" x1="40" x2="460" y1="250" y2="250"></line>
                <line stroke="#43474d" stroke-dasharray="1,6" stroke-width="0.5" x1="102" x2="398" y1="102" y2="398"></line>
                <line stroke="#43474d" stroke-dasharray="1,6" stroke-width="0.5" x1="398" x2="102" y1="102" y2="398"></line>

                <!-- Orbit Callout Lines -->
                <line stroke="#8e9197" stroke-width="0.75" x1="250" x2="390" y1="200" y2="150"></line>
                <circle cx="250" cy="200" fill="#cfe3ff" r="2"></circle>
                <text fill="#c4c6cd" font-family="Space Mono" font-size="8" letter-spacing="0.1em" x="395" y="152">CO1: HYPERVISOR FABRIC</text>

                <line stroke="#8e9197" stroke-width="0.75" x1="250" x2="380" y1="170" y2="100"></line>
                <circle cx="250" cy="170" fill="#cfe3ff" r="2"></circle>
                <text fill="#c4c6cd" font-family="Space Mono" font-size="8" letter-spacing="0.1em" x="385" y="102">CO3: OVERLAY NETWORK: 1.5 R_s</text>

                <line stroke="#8e9197" stroke-width="0.75" x1="250" x2="370" y1="130" y2="60"></line>
                <circle cx="250" cy="130" fill="#cfe3ff" r="2"></circle>
                <text fill="#c4c6cd" font-family="Space Mono" font-size="8" letter-spacing="0.1em" x="375" y="62">CO6: FINOPS HORIZON: 3.0 R_s</text>

                <!-- Geodesic Trajectory Curve -->
                <path d="M 20 250 C 120 250, 180 260, 215 285 C 235 305, 245 330, 248 350 C 249.5 370, 250 390, 250 430" fill="none" stroke="#cfe3ff" stroke-dasharray="3,3" stroke-width="1.25"></path>

                <!-- Subtle CSS-animated dots -->
                <circle class="orbit-dot orbit-dot-1" cx="215" cy="285" fill="#cfe3ff" r="2.5"></circle>
                <circle class="orbit-dot orbit-dot-2" cx="235" cy="305" fill="#cfe3ff" r="2"></circle>
                <circle class="orbit-dot orbit-dot-3" cx="248" cy="350" fill="#cfe3ff" r="1.5"></circle>
                <circle class="orbit-dot orbit-dot-4" cx="250" cy="200" fill="#cfe3ff" r="2"></circle>
                <circle class="orbit-dot orbit-dot-5" cx="250" cy="170" fill="#cfe3ff" r="2"></circle>
                <circle class="orbit-dot orbit-dot-6" cx="250" cy="130" fill="#cfe3ff" r="2"></circle>
                <circle class="orbit-dot orbit-dot-2" cx="170" cy="250" fill="#cfe3ff" r="2"></circle>
                <circle class="orbit-dot orbit-dot-4" cx="330" cy="250" fill="#cfe3ff" r="2"></circle>

                <!-- Cardinal tick labels -->
                <text fill="#8e9197" font-family="Space Mono" font-size="8" text-anchor="middle" x="250" y="32">000° // GLOBAL APEX</text>
                <text fill="#8e9197" font-family="Space Mono" font-size="8" x="468" y="253">090°</text>
                <text fill="#8e9197" font-family="Space Mono" font-size="8" text-anchor="middle" x="250" y="476">180° // REGIONAL NADIR</text>
                <text fill="#8e9197" font-family="Space Mono" font-size="8" text-anchor="end" x="14" y="253">270°</text>

                <!-- Central Reticle -->
                <line stroke="#cfe3ff" stroke-width="1" x1="247" x2="253" y1="250" y2="250"></line>
                <line stroke="#cfe3ff" stroke-width="1" x1="250" x2="250" y1="247" y2="253"></line>
              </svg>
            </div>

            <!-- Figure Caption -->
            <p class="font-body-sm text-body-sm text-on-surface-variant pt-space-xs">
              <strong class="text-primary font-headline-sm text-headline-sm font-normal">FIG. 1.0:</strong>
              Multi-region topology of distributed cloud substrates approaching high-availability equilibrium. Observed across 6 Course Outcomes. Orbit rings indicate operational layers from physical virtualization to automated FinOps reconciliation.
            </p>

            <!-- 3-Row Metrics (Regions mapped, Modules loaded, Content files detected: live) -->
            <div class="mt-space-lg pt-space-md border-t border-outline-variant/30 flex flex-col gap-space-sm font-label-sm text-label-sm">
              <div class="flex items-center justify-between text-outline">
                <span>REGIONS MAPPED</span>
                <span class="text-on-surface font-mono">3 GLOBAL (AWS · AZURE · GCP)</span>
              </div>
              <div class="flex items-center justify-between text-outline">
                <span>MODULES LOADED</span>
                <span class="text-on-surface font-mono">6 COURSE OUTCOMES (24 SESSIONS)</span>
              </div>
              <div class="flex items-center justify-between text-outline">
                <span>CONTENT FILES DETECTED</span>
                <span class="text-primary-container font-mono font-bold">${totalFiles} FILES (LIVE)</span>
              </div>
            </div>

            <!-- Observatory Log Card -->
            <div class="mt-space-lg p-space-md border border-outline-variant/30 bg-surface-container-low flex flex-col gap-space-xs font-label-sm text-label-sm">
              <div class="flex items-center justify-between text-primary">
                <span class="font-headline-sm text-headline-sm">OBSERVATORY LOG 0x25C</span>
                <span class="text-primary-container">[STABLE TRACK]</span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant">
                All 6 Course Outcomes synchronized with syllabus specification 25CS2206E. Compute, network, and storage primitives verify zero-drift cloud architecture. System architects must validate shared responsibility boundaries prior to production deployment.
              </p>
              <div class="flex items-center justify-end gap-space-sm pt-space-xs text-outline font-label-sm text-label-sm">
                <span>SIG: CLOUD_OBS_RECORD</span>
                <span class="text-outline-variant">•</span>
                <span class="text-primary">CLUSTER CLOUD-25CS2206E</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}

/**
 * Renders the full LESSON view with top tabs, sub-tabs, reading bar, renderer, and sticky sidebar
 */
function renderLesson(coId) {
  unmountLab();
  updateNavigation('lesson');

  const co = syllabus.find(s => s.id === coId) || syllabus[0];
  const coData = getCO(co.id);

  // Active sub-tab file index
  if (appState.lessonActiveFileIndex[co.id] === undefined) {
    appState.lessonActiveFileIndex[co.id] = 0;
  }
  let activeIndex = appState.lessonActiveFileIndex[co.id];
  if (activeIndex >= coData.files.length) {
    activeIndex = 0;
    appState.lessonActiveFileIndex[co.id] = 0;
  }

  // Top CO tabs: [CO1]..[CO6]
  const coTabsHtml = [1, 2, 3, 4, 5, 6].map(i => {
    const isCurrent = i === co.id;
    return `
      <a 
        href="#/lesson/co${i}" 
        class="px-space-md py-1.5 transition-none ${isCurrent ? 'bg-surface-container text-primary-container border-b-2 border-primary-container font-bold' : 'text-on-surface-variant hover:text-primary'} cursor-pointer"
      >
        [CO${i}]
      </a>
    `;
  }).join('');

  // Multiple files sub-tabs by filename
  let subTabsHtml = '';
  if (coData.files.length > 1) {
    subTabsHtml = `
      <div class="w-full bg-surface-container-low/60 border-b border-outline-variant/30 px-margin-mobile lg:px-margin py-1.5 flex items-center gap-space-xs overflow-x-auto text-[11px] font-mono select-none">
        <span class="text-outline uppercase tracking-wider shrink-0 mr-1">ARTIFACTS:</span>
        ${coData.files.map((filename, fIdx) => `
          <button 
            type="button"
            class="sub-tab-btn px-2.5 py-0.5 border ${fIdx === activeIndex ? 'border-primary-container text-primary-container bg-surface-container font-bold' : 'border-outline-variant/30 text-on-surface-variant hover:text-primary bg-surface-container-lowest'} shrink-0 cursor-pointer uppercase transition-colors"
            data-co="${co.id}"
            data-fidx="${fIdx}"
          >
            ${filename}
          </button>
        `).join('')}
      </div>
    `;
  }

  // Content pane rendering
  let contentPaneHtml = '';

  if (coData.status === 'empty' || coData.files.length === 0) {
    contentPaneHtml = `
      <div class="flex flex-col items-center justify-center p-space-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest my-space-md text-center font-mono">
        <div class="text-primary-container text-label-md mb-space-sm font-bold animate-pulse">
          &gt; AWAITING TRANSMISSION: drop YAML into /content/co${co.id}
        </div>
        <p class="font-body-sm text-outline mb-space-lg">
          No structured course artifacts detected in the current transmission frame.
        </p>
        <div class="w-full max-w-lg text-left border border-outline-variant/30 p-space-md bg-surface-container-low">
          <div class="text-label-sm text-outline uppercase tracking-wider mb-space-xs pb-1 border-b border-outline-variant/20">
            SYLLABUS SEED ALLOCATIONS (4 SESSIONS):
          </div>
          <div class="flex flex-col gap-1">
            ${co.sessions.map(s => `
              <div class="py-1 border-b border-outline-variant/10 last:border-b-0 text-on-surface font-body-sm flex items-start gap-2">
                <span class="text-primary-container font-mono text-[11px] font-bold">S0${s.number}</span>
                <span>${s.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    const activeFile = coData.files[activeIndex];
    const activeData = coData.data[activeIndex];

    let partialNoteHtml = '';
    if (coData.status === 'partial') {
      partialNoteHtml = `
        <div class="p-space-sm border border-outline-variant/30 bg-surface-container-low/50 text-outline font-label-sm italic my-space-sm flex items-center gap-space-sm">
          <span class="inline-block w-2 h-2 bg-[#e0c068] animate-pulse"></span>
          <span>PARTIAL TELEMETRY DETECTED: Awaiting remaining transmissions for this orbital sector. Telemetry reflects active buffer state.</span>
        </div>
      `;
    }

    const renderedBody = renderContent(activeData, co.id);

    contentPaneHtml = `
      <div class="flex flex-col">
        <div class="flex flex-wrap items-center justify-between pb-space-xs border-b border-outline-variant/30 font-label-sm text-label-sm text-outline">
          <div class="flex items-center gap-space-sm">
            <span class="text-primary font-headline-sm text-headline-sm">+</span>
            <span class="text-primary font-bold truncate">${activeFile}</span>
          </div>
          <div class="flex items-center gap-space-sm">
            <span class="text-outline font-mono">FRAME 0${co.id}</span>
          </div>
        </div>

        ${partialNoteHtml}
        ${renderedBody}
      </div>
    `;
  }

  // Sidebar SVG + Sessions + Log Card
  const sidebarHtml = `
    <!-- Small SVG Orbit Graphic -->
    <div class="border border-outline-variant/30 bg-surface-container-lowest p-space-sm relative select-none">
      <div class="flex items-center justify-between font-label-sm text-label-sm text-outline border-b border-outline-variant/20 pb-1 mb-1">
        <span>TOPOLOGY ORBIT [CO${co.id}]</span>
        <span class="text-primary-container font-mono">ACTIVE MESH</span>
      </div>
      <svg class="w-full h-24 text-outline" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#43474d" stroke-width="0.75" stroke-dasharray="2,3"/>
        <circle cx="150" cy="50" r="40" fill="none" stroke="#43474d" stroke-width="0.75"/>
        <circle cx="250" cy="50" r="40" fill="none" stroke="#43474d" stroke-width="0.75" stroke-dasharray="2,3"/>
        <ellipse cx="150" cy="50" rx="140" ry="25" fill="none" stroke="#cfe3ff" stroke-width="0.75"/>
        <circle class="orbit-dot orbit-dot-1" cx="50" cy="50" r="3" fill="#cfe3ff"/>
        <circle class="orbit-dot orbit-dot-2" cx="150" cy="50" r="3.5" fill="#cfe3ff"/>
        <circle class="orbit-dot orbit-dot-3" cx="250" cy="50" r="3" fill="#cfe3ff"/>
        <line x1="10" y1="50" x2="290" y2="50" stroke="#43474d" stroke-dasharray="1,4" stroke-width="0.5"/>
      </svg>
    </div>

    <!-- 4 Session titles as outline -->
    <div class="border border-outline-variant/30 bg-surface-container-low p-space-md flex flex-col gap-space-xs font-label-sm text-label-sm">
      <div class="flex items-center justify-between text-outline uppercase tracking-wider pb-1 border-b border-outline-variant/20">
        <span>SYLLABIC OUTLINE (4 SESSIONS)</span>
        <span class="text-primary-container font-mono">[${co.code}]</span>
      </div>
      <nav class="flex flex-col gap-1.5 mt-1">
        ${co.sessions.map(s => `
          <div class="flex items-start gap-2 p-1 hover:bg-surface-container-lowest transition-colors">
            <span class="font-mono text-primary-container text-[11px] font-bold">S0${s.number}</span>
            <span class="font-body-sm text-on-surface text-[13px] leading-snug">${s.title}</span>
          </div>
        `).join('')}
      </nav>
    </div>

    <!-- LOG Card with file count + status + completion % -->
    <div class="border border-outline-variant/30 bg-surface-container-low p-space-md flex flex-col gap-space-sm font-label-sm text-label-sm">
      <div class="flex items-center justify-between text-primary border-b border-outline-variant/20 pb-1">
        <span class="font-headline-sm text-headline-sm">OBSERVATORY LOG 0x${co.id}0</span>
        <span class="text-primary-container font-mono">[CO${co.id} RECORD]</span>
      </div>
      <div class="flex flex-col gap-1.5 text-outline">
        <div class="flex items-center justify-between">
          <span>TRANSMISSION STATUS</span>
          <span class="font-mono font-bold">${renderBadge(coData.status)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span>FILES ACCRETED</span>
          <span class="text-on-surface font-mono">${coData.files.length} ARTIFACTS</span>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20">
          <span>COMPLETION RATIO</span>
          <span id="sidebar-progress-percent" class="text-primary-container font-mono font-bold">0%</span>
        </div>
        <div class="w-full bg-surface-container-high h-1.5 mt-1 overflow-hidden">
          <div id="sidebar-progress-bar" class="bg-primary-container h-full transition-all duration-300" style="width: 0%;"></div>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = `
    <!-- Hairline Reading Progress Bar -->
    <div id="reading-progress-bar" class="fixed top-16 left-0 h-[1.5px] bg-primary-container z-50 pointer-events-none transition-all duration-75" style="width: 0%;"></div>

    <div class="flex flex-col w-full text-on-surface">
      <!-- Top CO Tabs Strip -->
      <div class="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-margin-mobile lg:px-margin py-space-xs flex flex-wrap items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-wider overflow-x-auto py-1">
          ${coTabsHtml}
        </div>
        <div class="flex items-center gap-space-md font-label-sm text-label-sm text-outline">
          <span>FRAME: 0${co.id} / 06</span>
          <span class="text-outline-variant">•</span>
          <span>STATUS: <strong class="text-primary font-mono">${coData.status.toUpperCase()}</strong></span>
        </div>
      </div>

      <!-- Multiple files sub-tabs -->
      ${subTabsHtml}

      <!-- Main Lesson Body -->
      <div class="w-full px-margin-mobile lg:px-margin py-space-md grid grid-cols-1 lg:grid-cols-12 gap-y-space-xl lg:gap-x-margin items-start">
        <div class="lg:col-span-8 flex flex-col">
          ${contentPaneHtml}
        </div>
        <aside class="lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-20">
          ${sidebarHtml}
        </aside>
      </div>
    </div>
  `;

  // Restore section done checkboxes and progress
  restoreSectionProgress(co.id);
}

/**
 * Renders the SOURCE manuscript archive page with file tree and raw line viewer
 */
function renderSource() {
  unmountLab();
  updateNavigation('source');

  const allFiles = getAllFilesList();
  const totalFiles = allFiles.length;

  if (totalFiles === 0) {
    app.innerHTML = `
      <div class="flex flex-col w-full text-on-surface">
        <!-- Top strip -->
        <div class="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-margin-mobile lg:px-margin py-3 flex flex-wrap items-center justify-between gap-space-md font-label-sm text-label-sm text-outline">
          <div class="flex flex-wrap items-center gap-space-md">
            <span class="text-primary font-headline-sm text-headline-sm select-none">+</span>
            <span>COURSE CODE: <strong class="text-primary-container font-mono">25CS2206E</strong></span>
            <span class="text-outline-variant">|</span>
            <span>CREDITS: <strong class="text-on-surface font-mono">4</strong></span>
            <span class="text-outline-variant">|</span>
            <span>L-T-P-S: <strong class="text-on-surface font-mono">2-0-2-4</strong></span>
            <span class="text-outline-variant">|</span>
            <span>PREREQUISITE: <strong class="text-on-surface font-mono">OSSP</strong></span>
          </div>
          <div class="flex items-center gap-space-sm text-primary-container font-label-sm">
            <span class="inline-block w-1.5 h-1.5 bg-primary-container"></span>
            <span class="tracking-widest uppercase">SOURCE MANUSCRIPT CODEX</span>
          </div>
        </div>

        <div class="w-full p-space-xl flex flex-col items-center justify-center text-center my-space-xl">
          <div class="border border-dashed border-outline-variant/40 bg-surface-container-lowest p-space-xl max-w-lg font-mono">
            <div class="text-primary-container text-label-md font-bold mb-space-sm">&gt; NO SOURCE FILES DETECTED IN /content ARCHIVE</div>
            <p class="font-body-sm text-outline mb-space-md">Drop YAML, YML, JSON, or MD manuscripts into /content/co1..co6 to populate the source manuscript codex.</p>
            <a href="#/" class="inline-block border border-primary-container text-primary-container px-space-md py-1 font-label-sm uppercase tracking-wider hover:bg-primary-container hover:text-on-primary">
              ← RETURN TO [00 / EPHEMERIS]
            </a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Active file selection
  if (!appState.sourceActivePath || !allFiles.some(f => f.path === appState.sourceActivePath)) {
    appState.sourceActivePath = allFiles[0].path;
  }

  const activeFile = allFiles.find(f => f.path === appState.sourceActivePath) || allFiles[0];
  const rawText = getRawFile(activeFile.path) || '';
  const lines = rawText.split('\n');

  // File tree grouped by CO
  const treeHtml = [1, 2, 3, 4, 5, 6].map(coId => {
    const coData = getCO(coId);
    const coFiles = allFiles.filter(f => f.coNum === coId);

    let dotColor = 'bg-outline-variant/50';
    if (coData.status === 'ready') dotColor = 'bg-primary-container';
    else if (coData.status === 'partial') dotColor = 'bg-[#e0c068]';

    return `
      <div class="flex flex-col gap-1 mb-space-xs">
        <div class="flex items-center justify-between text-outline font-label-sm text-label-sm uppercase py-1 border-b border-outline-variant/10">
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-1.5 h-1.5 ${dotColor}"></span>
            <span class="font-bold text-on-surface">CO${coId}</span>
          </span>
          <span class="font-mono text-[10px] text-outline">${coFiles.length} files</span>
        </div>
        <div class="flex flex-col pl-3 border-l border-outline-variant/20 ml-1">
          ${coFiles.length === 0 ? `
            <span class="text-[10px] font-mono text-outline/50 py-1 italic">empty folder</span>
          ` : coFiles.map(f => `
            <button 
              type="button"
              class="source-file-btn text-left py-1 px-1.5 font-mono text-[11px] truncate transition-colors cursor-pointer ${f.path === activeFile.path ? 'bg-surface-container text-primary-container font-bold border-l-2 border-primary-container' : 'text-on-surface-variant hover:text-primary'}"
              data-path="${f.path}"
            >
              ${f.filename}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Table rows with line numbers
  const tableRowsHtml = lines.map((line, idx) => {
    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `
      <div class="table-row hover:bg-surface-container-low/40">
        <span class="table-cell pr-space-md pl-space-md text-right text-outline select-none w-12 font-label-sm text-label-sm border-r border-outline-variant/20">${String(idx + 1).padStart(3, '0')}</span>
        <span class="table-cell pl-space-md text-on-surface whitespace-pre">${escaped}</span>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="flex flex-col w-full text-on-surface">
      <!-- Top strip -->
      <div class="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-margin-mobile lg:px-margin py-3 flex flex-wrap items-center justify-between gap-space-md font-label-sm text-label-sm text-outline">
        <div class="flex flex-wrap items-center gap-space-md">
          <span class="text-primary font-headline-sm text-headline-sm select-none">+</span>
          <span>COURSE CODE: <strong class="text-primary-container font-mono">25CS2206E</strong></span>
          <span class="text-outline-variant">|</span>
          <span>CREDITS: <strong class="text-on-surface font-mono">4</strong></span>
          <span class="text-outline-variant">|</span>
          <span>L-T-P-S: <strong class="text-on-surface font-mono">2-0-2-4</strong></span>
          <span class="text-outline-variant">|</span>
          <span>PREREQUISITE: <strong class="text-on-surface font-mono">OSSP</strong></span>
        </div>
        <div class="flex items-center gap-space-sm text-primary-container font-label-sm">
          <span class="inline-block w-1.5 h-1.5 bg-primary-container"></span>
          <span class="tracking-widest uppercase">SOURCE MANUSCRIPT CODEX</span>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-140px)] bg-surface-container-lowest">
        <!-- Left: File Tree -->
        <aside class="lg:col-span-4 xl:col-span-3 border-r border-outline-variant/30 p-space-md flex flex-col gap-space-sm bg-surface-container-low/20">
          <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1 font-label-sm text-label-sm text-outline uppercase tracking-wider">
            <span>TRANSMISSION TREE</span>
            <span class="text-primary-container font-mono">${totalFiles} FILES</span>
          </div>
          <div class="flex flex-col gap-space-xs overflow-y-auto max-h-[calc(100vh-220px)]">
            ${treeHtml}
          </div>
        </aside>

        <!-- Right: Raw Viewer -->
        <div class="lg:col-span-8 xl:col-span-9 flex flex-col bg-surface-container-lowest">
          <div class="flex items-center justify-between px-space-md py-space-sm bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-label-sm text-label-sm">
            <div class="flex items-center gap-space-sm truncate">
              <span class="text-primary-container select-none">▶</span>
              <span class="tracking-widest uppercase text-on-surface font-mono truncate">${activeFile.filename}</span>
              <span class="text-outline-variant">//</span>
              <span class="text-outline font-mono">${lines.length} LINES</span>
            </div>
            <button 
              type="button"
              class="copy-btn font-mono text-[10px] text-primary-container hover:text-primary border border-primary-container/40 px-2.5 py-0.5 uppercase tracking-widest bg-surface-container transition-colors cursor-pointer"
              data-target="raw-source-content"
            >
              COPY SOURCE
            </button>
          </div>
          <div class="w-full overflow-x-auto py-space-sm select-text font-mono text-[12px] leading-relaxed bg-surface-container-lowest text-on-surface max-h-[calc(100vh-200px)] overflow-y-auto">
            <div class="table w-full">
              ${tableRowsHtml}
            </div>
            <pre id="raw-source-content" class="hidden">${rawText}</pre>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hash router
 */
function router() {
  const hash = window.location.hash.trim().toLowerCase() || '#/';

  if (hash === '#/' || hash === '#' || hash === '' || hash === '#/ephemeris') {
    renderEphemeris();
    return;
  }

  // LESSON route: #/lesson/co1..co6
  const lessonMatch = hash.match(/^#\/lesson\/co[-_]?([1-6])/i);
  if (lessonMatch) {
    const coId = parseInt(lessonMatch[1], 10);
    renderLesson(coId);
    return;
  }
  if (hash.startsWith('#/lesson')) {
    renderLesson(1);
    return;
  }

  // LAB route: #/lab/co1..co6
  const labMatch = hash.match(/^#\/lab\/co[-_]?([1-6])/i);
  if (labMatch) {
    const coId = parseInt(labMatch[1], 10);
    updateNavigation('lab');
    mountLab(app, coId);
    return;
  }
  if (hash.startsWith('#/lab')) {
    updateNavigation('lab');
    mountLab(app, 1);
    return;
  }

  // SOURCE route: #/source
  if (hash.startsWith('#/source')) {
    renderSource();
    return;
  }

  // Fallback
  unmountLab();
  renderEphemeris();
}

// Global Event Delegation

// 1. Copy Buttons
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const targetId = btn.getAttribute('data-target');
  let text = '';
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) text = el.innerText || el.textContent;
  }
  if (text) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerText;
      btn.innerText = 'COPIED';
      btn.classList.add('text-primary-container');
      setTimeout(() => {
        btn.innerText = orig;
        btn.classList.remove('text-primary-container');
      }, 1800);
    }).catch(() => {});
  }
});

// 2. Section Checkboxes for localStorage progress tracking
document.addEventListener('change', (e) => {
  if (!e.target.matches('.section-done-checkbox')) return;
  const co = e.target.getAttribute('data-co');
  const sec = e.target.getAttribute('data-sec');
  const checked = e.target.checked;

  const storageKey = `void:progress:co${co}`;
  let progress = {};
  try {
    progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {}

  if (checked) {
    progress[sec] = true;
  } else {
    delete progress[sec];
  }

  localStorage.setItem(storageKey, JSON.stringify(progress));
  updateSidebarProgress(co);
});

// 3. Lesson Sub-tab button switching
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.sub-tab-btn');
  if (!btn) return;
  const co = parseInt(btn.getAttribute('data-co'), 10);
  const fIdx = parseInt(btn.getAttribute('data-fidx'), 10);
  appState.lessonActiveFileIndex[co] = fIdx;
  renderLesson(co);
});

// 4. Source file selection switching
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.source-file-btn');
  if (!btn) return;
  const path = btn.getAttribute('data-path');
  if (path) {
    appState.sourceActivePath = path;
    renderSource();
  }
});

// 5. Hairline Reading Progress on Scroll
window.addEventListener('scroll', () => {
  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const height = (document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
  bar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
}, { passive: true });

// Listeners for routing
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// Initialize router
router();
