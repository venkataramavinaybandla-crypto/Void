# VOID / CLOUD INFRASTRUCTURE RECORD

Static scientific telemetric record for **Cloud Infrastructure and Services (25CS2206E)**.

VOID reimagines distributed systems, virtualized hypervisors, VPC routing topologies, and cloud financial engineering through cold, monospaced astronomical observatory instrumentation.

---

## Architecture & System Overview

- **[00 / EPHEMERIS] (`#/`)**: Geodesic syllabus overview across all 6 Course Outcomes (CO1–CO6), live `EMPTY` / `PARTIAL` / `READY` telemetry badges, celestial SVG projection with animated dots, and 3-row cluster metrics.
- **[01 / LESSON] (`#/lesson/co1` .. `#/lesson/co6`)**: Generic recursive shape-based renderer (`src/render.js`), multiple-file horizontal sub-tabs, top hairline reading-progress bar, per-section completion checkboxes persisted to `localStorage` (`void:progress:coN`), and sticky sidebar with syllabus outline and observatory log.
- **[02 / LABORATORY] (`#/lab/co1` .. `#/lab/co6`)**: Interactive Canvas 2D simulation engine (`VOID-SIM v1.0`). DPR-crisp, resize-safe, paused when tab is hidden, respecting `prefers-reduced-motion`. Houses 6 distinct cloud architectural scenarios:
  - **CO1**: Request Trace (User > DNS > CDN > ALB > App > DB with Customer vs. Provider Shared Responsibility fault injection).
  - **CO2**: Autoscale Race (Traffic ramp rate vs. VM warm-up delay with buffer saturation breach).
  - **CO3**: Tiers Cannot Talk (Public/Private subnets, stateful Security Groups vs. stateless Network ACL return-rule ephemeral port traps).
  - **CO4**: Restore Under Time (Primary, replica, S3 vault with RTO/RPO target verification and failover benchmarking).
  - **CO5**: AccessDenied (Hierarchical IAM evaluation ladder: SCP > Permissions Boundary > Identity Policy > Resource Policy).
  - **CO6**: Drift & Spike (Declarative IaC desired state vs. actual live cloud drift with rogue resource cost meter spikes).
- **[03 / SOURCE MANUSCRIPT] (`#/source`)**: Course codex strip (25CS2206E, 4 credits, L-T-P-S 2-0-2-4, prerequisite OSSP), interactive transmission tree, and raw ASCII line-numbered code viewer with copy buttons.

---

## Adding Content

You can add or update manuscripts at any time without code modifications or schema constraints:

1. Drop `.yaml`, `.yml`, `.json`, or `.md` files into any folder:
   - `/content/co1`
   - `/content/co2`
   - `/content/co3`
   - `/content/co4`
   - `/content/co5`
   - `/content/co6`
2. **Zero Code Changes**: Files are discovered automatically using Vite's dynamic glob pattern.
3. **No Restart Required**: Vite Hot Module Replacement (HMR) updates the running application instantly.
4. **No Schema Lock-In**: The recursive renderer (`src/render.js`) parses data by its shape (headings, lists, markdown paragraphs, accordions, tables, code panels, and click-to-reveal question cards) rather than fixed property keys.
5. **Custom Lab Overrides**: Any YAML file containing keys like `lab`, `scenario`, `nodes`, `links`, or `steps` will defensively override the built-in laboratory scenario for that CO.

---

## Development & Build Commands

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Build production bundle (passes even with zero content files)
npm run build

# Preview production build locally
npm run preview
```

