import { getCO } from './content.js';

let animationFrameId = null;
let currentScenario = null;
let canvas = null;
let ctx = null;
let canvasWidth = 800;
let canvasHeight = 520;
let isPaused = false;
let simSpeed = 1;
let virtualTime = 0.00;
let activePackets = [];
let particles = [];
let nextPacketTime = 0;
let logContainer = null;
let resizeObserver = null;
let activeCoId = 1;

/**
 * Built-in 6 Scenarios Config
 */
const defaultScenarios = {
  1: {
    id: 1,
    title: "REQUEST TRACE & SHARED RESPONSIBILITY",
    subtitle: "User > DNS > CDN > ALB > App > DB with Provider vs. Customer fault attribution",
    metricDefaults: { latency: "28.4ms", error: "0.00%", throughput: "1.4 Gbps", cost: "$0.64/hr" },
    nodes: [
      { id: "user", label: "USER CLIENT", subLabel: "192.168.1.10", xRatio: 0.10, yRatio: 0.50, tier: "customer", fault: false },
      { id: "dns", label: "ROUTE 53", subLabel: "Anycast Edge PoP", xRatio: 0.26, yRatio: 0.35, tier: "provider", fault: false },
      { id: "cdn", label: "CLOUDFRONT", subLabel: "Edge Cache PoP", xRatio: 0.42, yRatio: 0.50, tier: "provider", fault: false },
      { id: "alb", label: "APP LB (ALB)", subLabel: "Regional Multi-AZ", xRatio: 0.58, yRatio: 0.50, tier: "provider", fault: false },
      { id: "app", label: "ECS APP TASK", subLabel: "Container Runtime", xRatio: 0.74, yRatio: 0.50, tier: "customer", fault: false },
      { id: "db", label: "AURORA DB", subLabel: "Multi-AZ Primary", xRatio: 0.90, yRatio: 0.50, tier: "customer", fault: false }
    ],
    links: [
      { source: "user", target: "dns", label: "UDP 53 (DNS)" },
      { source: "user", target: "cdn", label: "HTTPS (Anycast)" },
      { source: "cdn", target: "alb", label: "Origin Request" },
      { source: "alb", target: "app", label: "L7 Target Group" },
      { source: "app", target: "db", label: "TCP 5432 (Pool)" }
    ],
    controlsHtml: `
      <div class="flex items-center gap-space-sm text-outline font-label-sm">
        <span class="text-primary-container font-mono">[TIP]</span>
        <span>Click any node on canvas to inject/clear fault. Check log for Shared Responsibility attribution.</span>
      </div>
    `,
    onPacketTick: function(scenario, dt) {
      if (virtualTime > nextPacketTime) {
        nextPacketTime = virtualTime + (0.8 / simSpeed);
        activePackets.push({
          id: Math.random(),
          source: "user",
          pathIndex: 0,
          steps: ["user", "dns", "cdn", "alb", "app", "db"],
          progress: 0,
          speed: 1.2 * simSpeed,
          isReturn: false
        });
      }
    },
    onPacketStep: function(scenario, packet, fromNode, toNode) {
      if (toNode.fault) {
        const isProvider = toNode.tier === "provider";
        const roleStr = isProvider ? "PROVIDER RESPONSIBILITY (SLA Breach)" : "CUSTOMER RESPONSIBILITY (Shared Responsibility Model)";
        appendLog(`FAULT AT ${toNode.label} (${toNode.subLabel}): [${roleStr}] - Request 502/504 Drop`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: (Math.random() * 8 + 12).toFixed(2) + "%", latency: "148.2ms" });
        return false; // packet destroyed
      }
      return true;
    }
  },

  2: {
    id: 2,
    title: "AUTOSCALE RACE & WARM-UP DELAY",
    subtitle: "Traffic ramp velocity vs. instance boot/warm-up latency",
    metricDefaults: { latency: "42.0ms", error: "0.00%", throughput: "850 req/s", cost: "$1.28/hr" },
    state: { rampRate: 50, warmupDelay: 40, droppedCount: 0 },
    nodes: [
      { id: "gen", label: "INGRESS LOAD", subLabel: "Traffic Generator", xRatio: 0.12, yRatio: 0.50 },
      { id: "asg", label: "AUTOSCALER", subLabel: "ASG Metric Alarm", xRatio: 0.38, yRatio: 0.50 },
      { id: "vms", label: "INSTANCE POOL", subLabel: "4 Active Nodes", xRatio: 0.65, yRatio: 0.50 },
      { id: "target", label: "TARGET CLUSTER", subLabel: "Workload Core", xRatio: 0.88, yRatio: 0.50 }
    ],
    links: [
      { source: "gen", target: "asg", label: "Ramp Ingress" },
      { source: "asg", target: "vms", label: "Scale-Out Directive" },
      { source: "vms", target: "target", label: "Workload Absorption" }
    ],
    getControlsHtml: function(scenario) {
      return `
        <div class="flex flex-wrap items-center gap-6 font-label-sm">
          <div class="flex flex-col gap-1 min-w-[170px]">
            <div class="flex justify-between text-outline">
              <span>RAMP VELOCITY</span>
              <span id="lbl-ramp" class="text-primary-container font-mono">${scenario.state.rampRate} req/s/m</span>
            </div>
            <input type="range" min="10" max="100" value="${scenario.state.rampRate}" id="ctrl-ramp" class="w-full accent-primary-container h-1 bg-surface-container-high cursor-pointer"/>
          </div>
          <div class="flex flex-col gap-1 min-w-[170px]">
            <div class="flex justify-between text-outline">
              <span>WARM-UP DELAY</span>
              <span id="lbl-warmup" class="text-primary-container font-mono">${scenario.state.warmupDelay}s</span>
            </div>
            <input type="range" min="10" max="120" value="${scenario.state.warmupDelay}" id="ctrl-warmup" class="w-full accent-primary-container h-1 bg-surface-container-high cursor-pointer"/>
          </div>
        </div>
      `;
    },
    onPacketTick: function(scenario, dt) {
      if (virtualTime > nextPacketTime) {
        nextPacketTime = virtualTime + (0.6 / simSpeed);
        activePackets.push({
          id: Math.random(),
          steps: ["gen", "asg", "vms", "target"],
          pathIndex: 0,
          progress: 0,
          speed: 1.1 * simSpeed
        });
      }
    },
    onPacketStep: function(scenario, packet, fromNode, toNode) {
      if (toNode.id === "vms") {
        if (scenario.state.warmupDelay > scenario.state.rampRate + 15) {
          scenario.state.droppedCount++;
          appendLog(`CAPACITY BREACH: Instance warm-up (${scenario.state.warmupDelay}s) lagged behind traffic ramp (${scenario.state.rampRate} req/s). Request dropped at ASG queue.`, true);
          createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
          updateMetricChips({ error: (18.5).toFixed(2) + "%", latency: "240.0ms", cost: "$0.92/hr" });
          return false;
        } else {
          updateMetricChips({ error: "0.00%", latency: "38.2ms", cost: "$2.10/hr" });
        }
      }
      return true;
    }
  },

  3: {
    id: 3,
    title: "TIERS CANNOT TALK & NACL RETURN TRAP",
    subtitle: "Public / Private Subnets, stateful SG vs. stateless NACL ephemeral port trap",
    metricDefaults: { latency: "18.2ms", error: "0.00%", throughput: "2.1 Gbps", cost: "$0.72/hr" },
    state: { sgWeb: true, sgApp: true, sgDb: true, naclReturnTrap: false },
    nodes: [
      { id: "client", label: "INTERNET CLIENT", subLabel: "0.0.0.0/0", xRatio: 0.12, yRatio: 0.50 },
      { id: "web", label: "WEB SUBNET", subLabel: "Public IGW [10.0.1.0/24]", xRatio: 0.38, yRatio: 0.50 },
      { id: "app", label: "APP SUBNET", subLabel: "Private App [10.0.2.0/24]", xRatio: 0.62, yRatio: 0.50 },
      { id: "db", label: "DB SUBNET", subLabel: "Isolated DB [10.0.3.0/24]", xRatio: 0.88, yRatio: 0.50 }
    ],
    links: [
      { source: "client", target: "web", label: "TCP 443" },
      { source: "web", target: "app", label: "TCP 8080" },
      { source: "app", target: "db", label: "TCP 5432" }
    ],
    getControlsHtml: function(scenario) {
      return `
        <div class="flex flex-wrap items-center gap-3 font-label-sm">
          <button type="button" id="ctrl-sg-web" class="px-2 py-1 border ${scenario.state.sgWeb ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [WEB SG: ${scenario.state.sgWeb ? 'ALLOW 443' : 'DROP'}]
          </button>
          <button type="button" id="ctrl-sg-app" class="px-2 py-1 border ${scenario.state.sgApp ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [APP SG: ${scenario.state.sgApp ? 'ALLOW 8080' : 'DROP'}]
          </button>
          <button type="button" id="ctrl-sg-db" class="px-2 py-1 border ${scenario.state.sgDb ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [DB SG: ${scenario.state.sgDb ? 'ALLOW 5432' : 'DROP'}]
          </button>
          <button type="button" id="ctrl-nacl-trap" class="px-2 py-1 border ${scenario.state.naclReturnTrap ? 'border-error text-error bg-error-container/20' : 'border-outline-variant/60 text-outline'} font-mono text-[10px]">
            [NACL RETURN TRAP: ${scenario.state.naclReturnTrap ? 'ACTIVE (DROP EPHEMERAL)' : 'DISABLED (RULE 100)'}]
          </button>
        </div>
      `;
    },
    onPacketTick: function(scenario, dt) {
      if (virtualTime > nextPacketTime) {
        nextPacketTime = virtualTime + (0.9 / simSpeed);
        activePackets.push({
          id: Math.random(),
          steps: ["client", "web", "app", "db"],
          pathIndex: 0,
          progress: 0,
          speed: 1.0 * simSpeed,
          isReturn: false
        });
      }
    },
    onPacketStep: function(scenario, packet, fromNode, toNode) {
      if (toNode.id === "web" && !scenario.state.sgWeb) {
        appendLog(`DROP: Web Security Group rejected inbound connection on TCP 443. (Stateful boundary)`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "100%", latency: "—" });
        return false;
      }
      if (toNode.id === "app" && !scenario.state.sgApp) {
        appendLog(`DROP: App Security Group rejected connection from Web Subnet on TCP 8080.`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "66.7%", latency: "—" });
        return false;
      }
      if (toNode.id === "db" && !scenario.state.sgDb) {
        appendLog(`DROP: DB Security Group rejected TCP 5432 from App Subnet CIDR.`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "33.3%", latency: "—" });
        return false;
      }
      if (toNode.id === "db" && scenario.state.naclReturnTrap) {
        appendLog(`DROP: Stateless NACL Return-Rule Trap! SYN packet accepted inbound, but return SYN-ACK dropped by Subnet Outbound NACL (missing ephemeral port rule 1024-65535).`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "100% (SYN-ACK Dropped)", latency: "Timeout (RTO)" });
        return false;
      }
      updateMetricChips({ error: "0.00%", latency: "18.2ms" });
      return true;
    }
  },

  4: {
    id: 4,
    title: "RESTORE UNDER TIME & DISASTER RECOVERY",
    subtitle: "RTO / RPO verification, failover benchmark, and recovery targets",
    metricDefaults: { latency: "3.2ms", error: "0.00%", throughput: "3.4 Gbps", cost: "$2.40/hr" },
    state: { primaryAlive: true, rtoTarget: 5, rpoTarget: 1, failTime: 0, recovering: false },
    nodes: [
      { id: "primary", label: "PRIMARY DB", subLabel: "us-east-1a (Active)", xRatio: 0.20, yRatio: 0.35, fault: false },
      { id: "replica", label: "STANDBY REPLICA", subLabel: "us-west-2b (Sync)", xRatio: 0.55, yRatio: 0.35, fault: false },
      { id: "vault", label: "S3 BACKUP VAULT", subLabel: "Continuous PITR", xRatio: 0.85, yRatio: 0.35, fault: false },
      { id: "ctrl", label: "FAILOVER CONTROLLER", subLabel: "Route53 Health Check", xRatio: 0.55, yRatio: 0.70, fault: false }
    ],
    links: [
      { source: "primary", target: "replica", label: "Sync Replication (RPO < 1s)" },
      { source: "primary", target: "vault", label: "Snapshot Streams" },
      { source: "ctrl", target: "primary", label: "Health Check Probe" },
      { source: "ctrl", target: "replica", label: "Promotion Trigger" }
    ],
    getControlsHtml: function(scenario) {
      return `
        <div class="flex flex-wrap items-center gap-6 font-label-sm">
          <div class="flex items-center gap-3">
            <button type="button" id="ctrl-fail-primary" class="px-2.5 py-1 border ${scenario.state.primaryAlive ? 'border-error text-error hover:bg-error hover:text-on-error' : 'border-primary-container text-primary-container'} font-mono text-[10px]">
              ${scenario.state.primaryAlive ? '[FAIL PRIMARY DB]' : '[RESTORE PRIMARY]'}
            </button>
          </div>
          <div class="flex flex-col gap-1 min-w-[140px]">
            <div class="flex justify-between text-outline">
              <span>TARGET RTO</span>
              <span id="lbl-rto" class="text-primary-container font-mono">${scenario.state.rtoTarget} min</span>
            </div>
            <input type="range" min="1" max="20" value="${scenario.state.rtoTarget}" id="ctrl-rto" class="w-full accent-primary-container h-1 bg-surface-container-high cursor-pointer"/>
          </div>
          <div class="flex flex-col gap-1 min-w-[140px]">
            <div class="flex justify-between text-outline">
              <span>TARGET RPO</span>
              <span id="lbl-rpo" class="text-primary-container font-mono">${scenario.state.rpoTarget} min</span>
            </div>
            <input type="range" min="1" max="15" value="${scenario.state.rpoTarget}" id="ctrl-rpo" class="w-full accent-primary-container h-1 bg-surface-container-high cursor-pointer"/>
          </div>
        </div>
      `;
    },
    onPacketTick: function(scenario, dt) {
      if (virtualTime > nextPacketTime) {
        nextPacketTime = virtualTime + (1.0 / simSpeed);
        if (scenario.state.primaryAlive) {
          activePackets.push({ id: Math.random(), steps: ["primary", "replica"], pathIndex: 0, progress: 0, speed: 1.4 * simSpeed });
          activePackets.push({ id: Math.random(), steps: ["ctrl", "primary"], pathIndex: 0, progress: 0, speed: 1.0 * simSpeed });
        } else {
          activePackets.push({ id: Math.random(), steps: ["ctrl", "replica"], pathIndex: 0, progress: 0, speed: 1.8 * simSpeed });
        }
      }
    },
    onPacketStep: function(scenario, packet, fromNode, toNode) {
      return true;
    }
  },

  5: {
    id: 5,
    title: "ACCESS DENIED & IAM EVALUATION LADDER",
    subtitle: "SCP > Permissions Boundary > Identity Policy > Resource Policy evaluation",
    metricDefaults: { latency: "12.4ms", error: "0.00%", throughput: "520 auth/s", cost: "$0.18/hr" },
    state: { scpAllow: true, boundaryAllow: true, identityAllow: true, resourceAllow: true },
    nodes: [
      { id: "caller", label: "CALLER PRINCIPAL", subLabel: "iam::user/cloud-admin", xRatio: 0.10, yRatio: 0.50 },
      { id: "scp", label: "ORG SCP", subLabel: "Service Control Policy", xRatio: 0.30, yRatio: 0.50 },
      { id: "bound", label: "PERM BOUNDARY", subLabel: "Boundary Ceiling", xRatio: 0.50, yRatio: 0.50 },
      { id: "identity", label: "IDENTITY POLICY", subLabel: "Managed User Policy", xRatio: 0.70, yRatio: 0.50 },
      { id: "resource", label: "RESOURCE POLICY", subLabel: "S3 Bucket Policy", xRatio: 0.90, yRatio: 0.50 }
    ],
    links: [
      { source: "caller", target: "scp", label: "Eval Ladder 1" },
      { source: "scp", target: "bound", label: "Eval Ladder 2" },
      { source: "bound", target: "identity", label: "Eval Ladder 3" },
      { source: "identity", target: "resource", label: "Final Authorization" }
    ],
    getControlsHtml: function(scenario) {
      return `
        <div class="flex flex-wrap items-center gap-2 font-label-sm">
          <button type="button" id="ctrl-scp" class="px-2 py-0.5 border ${scenario.state.scpAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [SCP: ${scenario.state.scpAllow ? 'ALLOW' : 'EXPLICIT DENY'}]
          </button>
          <button type="button" id="ctrl-bound" class="px-2 py-0.5 border ${scenario.state.boundaryAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [BOUNDARY: ${scenario.state.boundaryAllow ? 'ALLOW' : 'RESTRICTED'}]
          </button>
          <button type="button" id="ctrl-identity" class="px-2 py-0.5 border ${scenario.state.identityAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [IDENTITY: ${scenario.state.identityAllow ? 'ALLOW' : 'NO POLICY'}]
          </button>
          <button type="button" id="ctrl-resource" class="px-2 py-0.5 border ${scenario.state.resourceAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]">
            [RESOURCE: ${scenario.state.resourceAllow ? 'ALLOW' : 'DENY BUCKET'}]
          </button>
        </div>
      `;
    },
    onPacketTick: function(scenario, dt) {
      if (virtualTime > nextPacketTime) {
        nextPacketTime = virtualTime + (0.9 / simSpeed);
        activePackets.push({
          id: Math.random(),
          steps: ["caller", "scp", "bound", "identity", "resource"],
          pathIndex: 0,
          progress: 0,
          speed: 1.2 * simSpeed
        });
      }
    },
    onPacketStep: function(scenario, packet, fromNode, toNode) {
      if (toNode.id === "scp" && !scenario.state.scpAllow) {
        appendLog(`DENIED by Service Control Policy (SCP): Guardrail explicitly blocks action for all member accounts.`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "100%", latency: "4.1ms" });
        return false;
      }
      if (toNode.id === "bound" && !scenario.state.boundaryAllow) {
        appendLog(`DENIED by Permissions Boundary: Action exceeds administrator-enforced boundary ceiling.`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "100%", latency: "6.8ms" });
        return false;
      }
      if (toNode.id === "identity" && !scenario.state.identityAllow) {
        appendLog(`DENIED by Identity-Based Policy: Implicit deny (action statement not present in user policy).`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "100%", latency: "8.9ms" });
        return false;
      }
      if (toNode.id === "resource" && !scenario.state.resourceAllow) {
        appendLog(`DENIED by Resource-Based Policy: Target S3 Bucket policy rejects non-whitelisted principal.`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "100%", latency: "11.2ms" });
        return false;
      }
      if (toNode.id === "resource") {
        appendLog(`AUTHORIZED: 200 OK - Access granted via IAM evaluation ladder.`);
        updateMetricChips({ error: "0.00%", latency: "12.4ms" });
      }
      return true;
    }
  },

  6: {
    id: 6,
    title: "IAC DRIFT & COST ANOMALY SPIKE",
    subtitle: "Declarative desired state vs. unmanaged out-of-band console drift",
    metricDefaults: { latency: "14.2ms", error: "0.00%", throughput: "1.1 Gbps", cost: "$0.48/hr" },
    state: { isDrifted: false, rogueInstances: 0 },
    nodes: [
      { id: "git", label: "GIT IAC REPO", subLabel: "main (Desired State)", xRatio: 0.15, yRatio: 0.35 },
      { id: "tf", label: "TERRAFORM ENGINE", subLabel: "State Locking (.tfstate)", xRatio: 0.40, yRatio: 0.35 },
      { id: "cloud", label: "LIVE CLOUD INFRA", subLabel: "4x c6i.xlarge", xRatio: 0.68, yRatio: 0.35 },
      { id: "finops", label: "FINOPS WATCHDOG", subLabel: "Cost Anomaly Detector", xRatio: 0.88, yRatio: 0.65 }
    ],
    links: [
      { source: "git", target: "tf", label: "Declarative Plan" },
      { source: "tf", target: "cloud", label: "State Sync (0 Drift)" },
      { source: "cloud", target: "finops", label: "Billing CloudWatch Feed" }
    ],
    getControlsHtml: function(scenario) {
      return `
        <div class="flex items-center gap-3 font-label-sm">
          <button type="button" id="ctrl-drift" class="px-2.5 py-1 border ${scenario.state.isDrifted ? 'border-error text-error bg-error-container/20' : 'border-outline text-outline hover:text-primary'} font-mono text-[10px]">
            ${scenario.state.isDrifted ? '[UNMANAGED DRIFT ACTIVE]' : '[INTRODUCE ROGUE DRIFT]'}
          </button>
          <button type="button" id="ctrl-reconcile" class="px-2.5 py-1 border border-primary-container text-primary-container hover:bg-primary-container hover:text-on-primary font-mono text-[10px]">
            [TERRAFORM APPLY (RECONCILE)]
          </button>
        </div>
      `;
    },
    onPacketTick: function(scenario, dt) {
      if (virtualTime > nextPacketTime) {
        nextPacketTime = virtualTime + (1.0 / simSpeed);
        activePackets.push({ id: Math.random(), steps: ["git", "tf", "cloud", "finops"], pathIndex: 0, progress: 0, speed: 1.2 * simSpeed });
      }
    },
    onPacketStep: function(scenario, packet, fromNode, toNode) {
      if (toNode.id === "finops" && scenario.state.isDrifted) {
        appendLog(`FINOPS ANOMALY ALERT: Out-of-band console change! 8 unmanaged GPU nodes provisioned without IaC commit. Cost spiked to $32.80/hr (+6,730%).`, true);
        createExplosion(toNode.xRatio * canvasWidth, toNode.yRatio * canvasHeight);
        updateMetricChips({ error: "DRIFT DETECTED", cost: "$32.80/hr" });
        return false;
      }
      return true;
    }
  }
};

/**
 * Defensively loads scenario config, checking for YAML overrides in /content/coN
 */
function loadScenario(coId) {
  const base = defaultScenarios[coId] || defaultScenarios[1];
  const coData = getCO(coId);

  if (coData && Array.isArray(coData.data)) {
    for (const doc of coData.data) {
      if (!doc || typeof doc !== 'object') continue;
      const custom = doc.lab || doc.scenario || (doc.nodes && doc.links ? doc : null);
      if (custom && typeof custom === 'object') {
        return {
          ...base,
          title: typeof custom.title === 'string' ? custom.title : base.title,
          subtitle: typeof custom.subtitle === 'string' ? custom.subtitle : base.subtitle,
          nodes: Array.isArray(custom.nodes) && custom.nodes.length > 0 ? custom.nodes : base.nodes,
          links: Array.isArray(custom.links) && custom.links.length > 0 ? custom.links : base.links
        };
      }
    }
  }

  return base;
}

/**
 * Appends log entry into the Instrument Log Stream
 */
function appendLog(message, isError = false) {
  if (!logContainer) return;
  const row = document.createElement('div');
  row.className = `flex items-start gap-2 border-l ${isError ? 'border-error/60 bg-error-container/10 text-error' : 'border-outline-variant/30 text-on-surface'} pl-2 py-0.5 select-text font-mono text-[11px] leading-tight`;
  row.innerHTML = `
    <span class="text-outline text-label-sm shrink-0">t=${virtualTime.toFixed(2)}s</span>
    <span class="flex-1">${message}</span>
  `;
  logContainer.appendChild(row);
  logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Updates live telemetry chips in sub-header
 */
function updateMetricChips(metrics) {
  if (!metrics) return;
  if (metrics.latency) {
    const el = document.getElementById('chip-latency');
    if (el) el.textContent = metrics.latency;
  }
  if (metrics.error) {
    const el = document.getElementById('chip-error');
    if (el) {
      el.textContent = metrics.error;
      el.className = metrics.error === "0.00%" ? "text-primary font-bold font-mono" : "text-error font-bold font-mono";
    }
  }
  if (metrics.throughput) {
    const el = document.getElementById('chip-throughput');
    if (el) el.textContent = metrics.throughput;
  }
  if (metrics.cost) {
    const el = document.getElementById('chip-cost');
    if (el) el.textContent = metrics.cost;
  }
}

/**
 * Spawns simple red particle explosion on packet failure
 */
function createExplosion(x, y) {
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (1.5 + Math.random()),
      vy: Math.sin(angle) * (1.5 + Math.random()),
      life: 1.0,
      color: '#ffb4ab'
    });
  }
}

/**
 * Resizes Canvas for DPR crispness
 */
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  canvasWidth = rect.width;
  canvasHeight = rect.height;
}

/**
 * Core Canvas render & tick loop
 */
let lastFrameTime = 0;

function simLoop(now) {
  if (!canvas || !ctx) return;

  if (!lastFrameTime) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isPaused && !document.hidden) {
    virtualTime += dt * simSpeed;

    // Tick scenario packets
    if (currentScenario && currentScenario.onPacketTick) {
      currentScenario.onPacketTick(currentScenario, dt);
    }

    // Advance packets
    for (let i = activePackets.length - 1; i >= 0; i--) {
      const p = activePackets[i];
      p.progress += dt * p.speed * (reducedMotion ? 0.5 : 1.0);

      if (p.progress >= 1.0) {
        const fromId = p.steps[p.pathIndex];
        const toId = p.steps[p.pathIndex + 1];
        const fromNode = currentScenario.nodes.find(n => n.id === fromId);
        const toNode = currentScenario.nodes.find(n => n.id === toId);

        let allowContinue = true;
        if (currentScenario.onPacketStep && fromNode && toNode) {
          allowContinue = currentScenario.onPacketStep(currentScenario, p, fromNode, toNode);
        }

        if (!allowContinue) {
          activePackets.splice(i, 1);
          continue;
        }

        p.pathIndex++;
        p.progress = 0;
        if (p.pathIndex >= p.steps.length - 1) {
          activePackets.splice(i, 1);
        }
      }
    }

    // Advance explosion particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= dt * 2.0;
      if (pt.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  // Draw frame
  renderCanvas();

  animationFrameId = requestAnimationFrame(simLoop);
}

/**
 * Draws the dark 2D canvas with faint grid, hairline nodes, links, and packets
 */
function renderCanvas() {
  ctx.fillStyle = '#0e0e0e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Faint Grid
  ctx.strokeStyle = '#1b1e22';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x < canvasWidth; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
  }
  for (let y = 0; y < canvasHeight; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
  }
  ctx.stroke();

  // Subtle intersection ticks
  ctx.fillStyle = '#353a42';
  for (let x = 40; x < canvasWidth; x += 80) {
    for (let y = 40; y < canvasHeight; y += 80) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  if (!currentScenario) return;

  // Draw links
  if (Array.isArray(currentScenario.links)) {
    for (const link of currentScenario.links) {
      const src = currentScenario.nodes.find(n => n.id === link.source);
      const tgt = currentScenario.nodes.find(n => n.id === link.target);
      if (!src || !tgt) continue;

      const x1 = src.xRatio * canvasWidth;
      const y1 = src.yRatio * canvasHeight;
      const x2 = tgt.xRatio * canvasWidth;
      const y2 = tgt.yRatio * canvasHeight;

      ctx.strokeStyle = '#2d333b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Link label at midpoint
      if (link.label) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 8;
        ctx.fillStyle = '#6b7280';
        ctx.font = '9px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(link.label, mx, my);
      }
    }
  }

  // Draw packets
  for (const p of activePackets) {
    const fromId = p.steps[p.pathIndex];
    const toId = p.steps[p.pathIndex + 1];
    const src = currentScenario.nodes.find(n => n.id === fromId);
    const tgt = currentScenario.nodes.find(n => n.id === toId);
    if (!src || !tgt) continue;

    const x1 = src.xRatio * canvasWidth;
    const y1 = src.yRatio * canvasHeight;
    const x2 = tgt.xRatio * canvasWidth;
    const y2 = tgt.yRatio * canvasHeight;

    const px = x1 + (x2 - x1) * p.progress;
    const py = y1 + (y2 - y1) * p.progress;

    ctx.fillStyle = '#cfe3ff';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw explosion particles
  for (const pt of particles) {
    ctx.fillStyle = pt.color;
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Draw hairline nodes
  for (const node of currentScenario.nodes) {
    const x = node.xRatio * canvasWidth;
    const y = node.yRatio * canvasHeight;
    const r = node.radius || 14;

    ctx.fillStyle = '#0e0e0e';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = node.fault ? '#ffb4ab' : '#cfe3ff';
    ctx.lineWidth = node.fault ? 1.5 : 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Center indicator dot
    ctx.fillStyle = node.fault ? '#ffb4ab' : '#cfe3ff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hairline labels
    ctx.font = '10px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = node.fault ? '#ffb4ab' : '#fffdff';
    ctx.fillText(node.label, x, y - r - 8);

    ctx.font = '8px "Space Mono", monospace';
    ctx.fillStyle = '#8e9197';
    ctx.fillText(node.subLabel || '', x, y + r + 14);

    if (node.fault) {
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillStyle = '#ffb4ab';
      ctx.fillText('[FAULT INJECTED]', x, y + r + 26);
    }
  }
}

/**
 * Handles canvas clicks to toggle faults or inspect nodes
 */
function handleCanvasClick(e) {
  if (!canvas || !currentScenario) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  for (const node of currentScenario.nodes) {
    const nx = node.xRatio * canvasWidth;
    const ny = node.yRatio * canvasHeight;
    const dist = Math.hypot(clickX - nx, clickY - ny);
    if (dist <= 24) {
      node.fault = !node.fault;
      appendLog(`Node state toggled: ${node.label} -> ${node.fault ? 'FAULT' : 'HEALTHY'}`);
      break;
    }
  }
}

/**
 * Mounts Laboratory view into container
 */
export function mountLab(container, coId = 1) {
  unmountLab();
  activeCoId = coId;

  currentScenario = loadScenario(coId);
  virtualTime = 0.00;
  activePackets = [];
  particles = [];
  nextPacketTime = 0;
  isPaused = false;
  simSpeed = 1;

  // CO Tabs for Lab
  const coTabsHtml = [1, 2, 3, 4, 5, 6].map(i => `
    <a 
      href="#/lab/co${i}" 
      class="px-space-md py-1.5 transition-none ${i === coId ? 'bg-surface-container text-primary-container border-b-2 border-primary-container font-bold' : 'text-on-surface-variant hover:text-primary'} cursor-pointer"
    >
      [CO${i}]
    </a>
  `).join('');

  const scenarioControlsHtml = currentScenario.getControlsHtml
    ? currentScenario.getControlsHtml(currentScenario)
    : (currentScenario.controlsHtml || '');

  container.innerHTML = `
    <div class="flex flex-col w-full text-on-surface">
      <!-- Sub-header -->
      <div class="w-full bg-surface-container-lowest px-margin-mobile lg:px-margin py-3 border-b border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-on-surface">
        <div class="flex items-center gap-space-sm font-label-md text-label-md uppercase tracking-wider">
          <span class="text-primary-container font-headline-sm text-headline-sm select-none">+</span>
          <span class="text-primary font-bold">LAB 0${coId} / ${currentScenario.title}</span>
          <span class="text-outline-variant">·</span>
          <span class="text-on-surface-variant font-mono">ENGINE: VOID-SIM v1.0</span>
        </div>
        <div class="flex flex-wrap items-center gap-space-md font-label-sm text-label-sm text-outline">
          <div class="flex items-center gap-1">
            <span class="text-on-surface-variant">LATENCY:</span>
            <span id="chip-latency" class="text-primary-container font-bold font-mono">${currentScenario.metricDefaults.latency}</span>
          </div>
          <span class="text-outline-variant">·</span>
          <div class="flex items-center gap-1">
            <span class="text-on-surface-variant">ERROR RATE:</span>
            <span id="chip-error" class="text-primary font-bold font-mono">${currentScenario.metricDefaults.error}</span>
          </div>
          <span class="text-outline-variant">·</span>
          <div class="flex items-center gap-1">
            <span class="text-on-surface-variant">THROUGHPUT:</span>
            <span id="chip-throughput" class="text-primary font-bold font-mono">${currentScenario.metricDefaults.throughput}</span>
          </div>
          <span class="text-outline-variant">·</span>
          <div class="flex items-center gap-1">
            <span class="text-on-surface-variant">COST:</span>
            <span id="chip-cost" class="text-primary-container font-bold font-mono">${currentScenario.metricDefaults.cost}</span>
          </div>
        </div>
      </div>

      <!-- Top CO Tabs Strip -->
      <div class="w-full bg-surface-container-lowest border-b border-outline-variant/30 px-margin-mobile lg:px-margin py-space-xs flex flex-wrap items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs font-label-md text-label-md uppercase tracking-wider overflow-x-auto py-1">
          ${coTabsHtml}
        </div>
        <div class="flex items-center gap-space-md font-label-sm text-label-sm text-outline">
          <span>FRAME: 0${coId} / 06</span>
          <span class="text-outline-variant">•</span>
          <span class="text-on-surface-variant font-mono">${currentScenario.subtitle}</span>
        </div>
      </div>

      <!-- Main Dual-Panel Viewport -->
      <div class="w-full grid grid-cols-1 xl:grid-cols-12 bg-surface-container-lowest min-h-[520px]">
        <!-- Left 75%: Canvas 2D -->
        <div class="xl:col-span-9 relative flex flex-col bg-surface-container-lowest border-b xl:border-b-0 xl:border-r border-outline-variant/30 select-none overflow-hidden">
          <div class="absolute top-2 left-2 pointer-events-none flex items-center gap-1 font-label-sm text-label-sm text-outline z-10">
            <span class="text-outline-variant font-headline-sm text-headline-sm">+</span>
            <span>GRID: 2D-CANVAS [DPR-SCALED]</span>
          </div>
          <div class="absolute top-2 right-2 pointer-events-none flex items-center gap-1 font-label-sm text-label-sm text-outline z-10">
            <span>LOC: [0x4F:VOID_SIM]</span>
            <span class="text-outline-variant font-headline-sm text-headline-sm">+</span>
          </div>

          <div class="w-full h-[500px] relative">
            <canvas id="sim-canvas" class="w-full h-full block cursor-crosshair"></canvas>
          </div>

          <div class="w-full px-4 py-2 border-t border-outline-variant/30 flex items-center justify-between font-label-sm text-label-sm text-outline">
            <div class="flex items-center gap-space-md">
              <span class="text-on-surface-variant font-mono">[SIMULATOR: ACTIVE]</span>
              <span class="text-outline-variant">|</span>
              <span class="text-outline">TOPOLOGY MESH: 2D-CANVAS ENGINE</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 bg-primary-container inline-block"></span>
              <span class="text-primary-container font-mono uppercase">STATUS: NOMINAL</span>
            </div>
          </div>
        </div>

        <!-- Right 25%: Instrument Log & Stream -->
        <div class="xl:col-span-3 flex flex-col bg-surface-container-lowest overflow-hidden">
          <div class="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-primary-container animate-pulse inline-block"></span>
              <span class="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">INSTRUMENT LOG / STREAM</span>
            </div>
            <span class="font-label-sm text-label-sm text-primary-container border border-primary-container/40 px-1 py-0.5">[SYNC=ACTIVE]</span>
          </div>
          <div class="flex-1 p-3 font-mono text-[11px] text-on-surface-variant overflow-y-auto space-y-1.5 max-h-[440px] xl:max-h-none select-text" id="sim-log-container">
            <div class="flex items-start gap-2 border-l border-outline-variant/30 pl-2">
              <span class="text-outline text-label-sm font-label-sm shrink-0">t=0.00s</span>
              <span class="text-on-surface">Engine initialized. Carrier linked to <span class="text-primary-container">${currentScenario.title}</span></span>
            </div>
          </div>
          <div class="p-3 border-t border-outline-variant/30 bg-surface-container-low font-label-sm text-label-sm flex flex-col gap-1 text-outline">
            <div class="flex justify-between items-center text-on-surface">
              <span class="uppercase tracking-widest font-bold">SCENARIO TELEMETRY</span>
              <span class="font-mono">CO${coId}</span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant leading-tight">
              ${currentScenario.subtitle}
            </p>
          </div>
        </div>
      </div>

      <!-- Bottom Control Bar -->
      <div class="w-full bg-surface-container-lowest border-t border-outline-variant/30 px-margin-mobile lg:px-margin py-3 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 font-label-md">
        <!-- Scenario Custom Controls -->
        <div id="scenario-controls" class="flex flex-wrap items-center gap-4">
          ${scenarioControlsHtml}
        </div>

        <!-- Common Engine Controls -->
        <div class="flex items-center gap-space-md shrink-0 font-label-md text-label-md select-none">
          <button type="button" id="btn-play-pause" class="border border-outline-variant/60 px-2.5 py-1 text-on-surface hover:text-primary-container hover:border-primary-container tracking-wider font-mono text-[11px] cursor-pointer">
            [PAUSE]
          </button>
          <button type="button" id="btn-step-frame" class="text-on-surface hover:text-primary-container underline underline-offset-4 decoration-outline-variant tracking-wider font-mono text-[11px] cursor-pointer">
            [STEP 10ms →]
          </button>
          <button type="button" id="btn-reset-sim" class="text-outline hover:text-primary underline underline-offset-4 decoration-outline-variant tracking-wider font-mono text-[11px] cursor-pointer">
            [RESET]
          </button>
          <div class="flex items-center gap-1 font-mono text-[11px] border border-outline-variant/30 p-0.5">
            <button type="button" id="btn-spd-1" class="px-1.5 py-0.5 bg-primary-container text-on-primary font-bold cursor-pointer">1x</button>
            <button type="button" id="btn-spd-2" class="px-1.5 py-0.5 text-outline hover:text-primary cursor-pointer">2x</button>
            <button type="button" id="btn-spd-5" class="px-1.5 py-0.5 text-outline hover:text-primary cursor-pointer">5x</button>
          </div>
        </div>
      </div>
    </div>
  `;

  canvas = document.getElementById('sim-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    canvas.addEventListener('click', handleCanvasClick);
  }

  logContainer = document.getElementById('sim-log-container');

  // Set up resize observer
  if (window.ResizeObserver && canvas) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);
  }

  // Hook common buttons
  const btnPlayPause = document.getElementById('btn-play-pause');
  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      isPaused = !isPaused;
      btnPlayPause.textContent = isPaused ? '[PLAY ▶]' : '[PAUSE]';
      appendLog(isPaused ? 'Simulation PAUSED.' : 'Simulation RUNNING.');
    });
  }

  const btnStep = document.getElementById('btn-step-frame');
  if (btnStep) {
    btnStep.addEventListener('click', () => {
      virtualTime += 0.05 * simSpeed;
      if (currentScenario && currentScenario.onPacketTick) {
        currentScenario.onPacketTick(currentScenario, 0.05);
      }
      renderCanvas();
      appendLog(`Stepped +10ms. (t=${virtualTime.toFixed(2)}s)`);
    });
  }

  const btnReset = document.getElementById('btn-reset-sim');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      mountLab(container, coId);
    });
  }

  const spd1 = document.getElementById('btn-spd-1');
  const spd2 = document.getElementById('btn-spd-2');
  const spd5 = document.getElementById('btn-spd-5');
  const setSpeed = (spd, btn) => {
    simSpeed = spd;
    [spd1, spd2, spd5].forEach(b => {
      if (b) b.className = 'px-1.5 py-0.5 text-outline hover:text-primary cursor-pointer';
    });
    if (btn) btn.className = 'px-1.5 py-0.5 bg-primary-container text-on-primary font-bold cursor-pointer';
    appendLog(`Engine speed adjusted to ${spd}x.`);
  };
  if (spd1) spd1.addEventListener('click', () => setSpeed(1, spd1));
  if (spd2) spd2.addEventListener('click', () => setSpeed(2, spd2));
  if (spd5) spd5.addEventListener('click', () => setSpeed(5, spd5));

  // Scenario specific control bindings
  bindScenarioControls(coId);

  // Start loop
  lastFrameTime = performance.now();
  animationFrameId = requestAnimationFrame(simLoop);
}

/**
 * Binds control handlers for scenarios 1-6
 */
function bindScenarioControls(coId) {
  if (coId === 2) {
    const ramp = document.getElementById('ctrl-ramp');
    const warmup = document.getElementById('ctrl-warmup');
    const lblRamp = document.getElementById('lbl-ramp');
    const lblWarmup = document.getElementById('lbl-warmup');
    if (ramp) {
      ramp.addEventListener('input', (e) => {
        currentScenario.state.rampRate = parseInt(e.target.value, 10);
        if (lblRamp) lblRamp.textContent = `${e.target.value} req/s/m`;
      });
    }
    if (warmup) {
      warmup.addEventListener('input', (e) => {
        currentScenario.state.warmupDelay = parseInt(e.target.value, 10);
        if (lblWarmup) lblWarmup.textContent = `${e.target.value}s`;
      });
    }
  } else if (coId === 3) {
    const btnWeb = document.getElementById('ctrl-sg-web');
    const btnApp = document.getElementById('ctrl-sg-app');
    const btnDb = document.getElementById('ctrl-sg-db');
    const btnNacl = document.getElementById('ctrl-nacl-trap');

    if (btnWeb) {
      btnWeb.addEventListener('click', () => {
        currentScenario.state.sgWeb = !currentScenario.state.sgWeb;
        btnWeb.textContent = `[WEB SG: ${currentScenario.state.sgWeb ? 'ALLOW 443' : 'DROP'}]`;
        btnWeb.className = `px-2 py-1 border ${currentScenario.state.sgWeb ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
    if (btnApp) {
      btnApp.addEventListener('click', () => {
        currentScenario.state.sgApp = !currentScenario.state.sgApp;
        btnApp.textContent = `[APP SG: ${currentScenario.state.sgApp ? 'ALLOW 8080' : 'DROP'}]`;
        btnApp.className = `px-2 py-1 border ${currentScenario.state.sgApp ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
    if (btnDb) {
      btnDb.addEventListener('click', () => {
        currentScenario.state.sgDb = !currentScenario.state.sgDb;
        btnDb.textContent = `[DB SG: ${currentScenario.state.sgDb ? 'ALLOW 5432' : 'DROP'}]`;
        btnDb.className = `px-2 py-1 border ${currentScenario.state.sgDb ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
    if (btnNacl) {
      btnNacl.addEventListener('click', () => {
        currentScenario.state.naclReturnTrap = !currentScenario.state.naclReturnTrap;
        btnNacl.textContent = `[NACL RETURN TRAP: ${currentScenario.state.naclReturnTrap ? 'ACTIVE (DROP EPHEMERAL)' : 'DISABLED (RULE 100)'}]`;
        btnNacl.className = `px-2 py-1 border ${currentScenario.state.naclReturnTrap ? 'border-error text-error bg-error-container/20' : 'border-outline-variant/60 text-outline'} font-mono text-[10px]`;
      });
    }
  } else if (coId === 4) {
    const btnFail = document.getElementById('ctrl-fail-primary');
    const rto = document.getElementById('ctrl-rto');
    const rpo = document.getElementById('ctrl-rpo');
    const lblRto = document.getElementById('lbl-rto');
    const lblRpo = document.getElementById('lbl-rpo');

    if (btnFail) {
      btnFail.addEventListener('click', () => {
        currentScenario.state.primaryAlive = !currentScenario.state.primaryAlive;
        const primNode = currentScenario.nodes.find(n => n.id === 'primary');
        if (primNode) primNode.fault = !currentScenario.state.primaryAlive;
        btnFail.textContent = currentScenario.state.primaryAlive ? '[FAIL PRIMARY DB]' : '[RESTORE PRIMARY]';
        btnFail.className = `px-2.5 py-1 border ${currentScenario.state.primaryAlive ? 'border-error text-error' : 'border-primary-container text-primary-container'} font-mono text-[10px]`;

        if (!currentScenario.state.primaryAlive) {
          appendLog(`DISASTER EVENT: Primary DB (us-east-1a) has failed! Failover Controller initiating Route53 DNS health probe check.`, true);
          setTimeout(() => {
            appendLog(`STANDBY PROMOTION: Standby replica (us-west-2b) promoted to Primary Master in 3.4 minutes.`);
            if (3.4 <= currentScenario.state.rtoTarget) {
              appendLog(`RESTORE SUCCESS: Measured RTO 3.4m met Target RTO (${currentScenario.state.rtoTarget}m). RPO data loss: 0.05m.`);
            } else {
              appendLog(`RTO SLA BREACH: Recovery 3.4m exceeded strict target (${currentScenario.state.rtoTarget}m).`, true);
            }
          }, 1200);
        } else {
          appendLog(`Primary DB restored. Read replica re-syncing.`);
        }
      });
    }

    if (rto) {
      rto.addEventListener('input', (e) => {
        currentScenario.state.rtoTarget = parseInt(e.target.value, 10);
        if (lblRto) lblRto.textContent = `${e.target.value} min`;
      });
    }
    if (rpo) {
      rpo.addEventListener('input', (e) => {
        currentScenario.state.rpoTarget = parseInt(e.target.value, 10);
        if (lblRpo) lblRpo.textContent = `${e.target.value} min`;
      });
    }
  } else if (coId === 5) {
    const scp = document.getElementById('ctrl-scp');
    const bound = document.getElementById('ctrl-bound');
    const ident = document.getElementById('ctrl-identity');
    const res = document.getElementById('ctrl-resource');

    if (scp) {
      scp.addEventListener('click', () => {
        currentScenario.state.scpAllow = !currentScenario.state.scpAllow;
        scp.textContent = `[SCP: ${currentScenario.state.scpAllow ? 'ALLOW' : 'EXPLICIT DENY'}]`;
        scp.className = `px-2 py-0.5 border ${currentScenario.state.scpAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
    if (bound) {
      bound.addEventListener('click', () => {
        currentScenario.state.boundaryAllow = !currentScenario.state.boundaryAllow;
        bound.textContent = `[BOUNDARY: ${currentScenario.state.boundaryAllow ? 'ALLOW' : 'RESTRICTED'}]`;
        bound.className = `px-2 py-0.5 border ${currentScenario.state.boundaryAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
    if (ident) {
      ident.addEventListener('click', () => {
        currentScenario.state.identityAllow = !currentScenario.state.identityAllow;
        ident.textContent = `[IDENTITY: ${currentScenario.state.identityAllow ? 'ALLOW' : 'NO POLICY'}]`;
        ident.className = `px-2 py-0.5 border ${currentScenario.state.identityAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
    if (res) {
      res.addEventListener('click', () => {
        currentScenario.state.resourceAllow = !currentScenario.state.resourceAllow;
        res.textContent = `[RESOURCE: ${currentScenario.state.resourceAllow ? 'ALLOW' : 'DENY BUCKET'}]`;
        res.className = `px-2 py-0.5 border ${currentScenario.state.resourceAllow ? 'border-primary-container text-primary-container' : 'border-error text-error'} font-mono text-[10px]`;
      });
    }
  } else if (coId === 6) {
    const btnDrift = document.getElementById('ctrl-drift');
    const btnReconcile = document.getElementById('ctrl-reconcile');

    if (btnDrift) {
      btnDrift.addEventListener('click', () => {
        currentScenario.state.isDrifted = true;
        btnDrift.textContent = '[UNMANAGED DRIFT ACTIVE]';
        btnDrift.className = 'px-2.5 py-1 border border-error text-error bg-error-container/20 font-mono text-[10px]';
        const cloudNode = currentScenario.nodes.find(n => n.id === 'cloud');
        if (cloudNode) cloudNode.fault = true;
        appendLog(`OUT-OF-BAND DRIFT: Operator launched 8x p4d.24xlarge GPU nodes via Console without IaC declaration!`, true);
        updateMetricChips({ error: "DRIFT DETECTED", cost: "$32.80/hr" });
      });
    }

    if (btnReconcile) {
      btnReconcile.addEventListener('click', () => {
        currentScenario.state.isDrifted = false;
        if (btnDrift) {
          btnDrift.textContent = '[INTRODUCE ROGUE DRIFT]';
          btnDrift.className = 'px-2.5 py-1 border border-outline text-outline font-mono text-[10px]';
        }
        const cloudNode = currentScenario.nodes.find(n => n.id === 'cloud');
        if (cloudNode) cloudNode.fault = false;
        appendLog(`TERRAFORM APPLY: Reconciling state. Destroying 8 unmanaged rogue GPU instances. Drift eliminated.`);
        updateMetricChips({ error: "0.00%", cost: "$0.48/hr" });
      });
    }
  }
}

/**
 * Unmounts canvas, cancels animation frame, and cleans up event listeners
 */
export function unmountLab() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (resizeObserver && canvas) {
    resizeObserver.unobserve(canvas);
    resizeObserver = null;
  }
  if (canvas) {
    canvas.removeEventListener('click', handleCanvasClick);
    canvas = null;
    ctx = null;
  }
  logContainer = null;
  currentScenario = null;
}

