---
name: Deep Space Telemetry Network Specimen
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#c4c6cd'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#8e9197'
  outline-variant: '#43474d'
  surface-tint: '#b4c8e3'
  primary: '#fffdff'
  on-primary: '#1e3247'
  primary-container: '#cfe3ff'
  on-primary-container: '#52657d'
  inverse-primary: '#4d6077'
  secondary: '#c4c7ca'
  on-secondary: '#2d3133'
  secondary-container: '#44474a'
  on-secondary-container: '#b3b5b8'
  tertiary: '#fffdff'
  on-tertiary: '#2a313d'
  tertiary-container: '#dbe1f1'
  on-tertiary-container: '#5d6471'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#b4c8e3'
  on-primary-fixed: '#071d31'
  on-primary-fixed-variant: '#35485f'
  secondary-fixed: '#e0e3e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#dce2f3'
  tertiary-fixed-dim: '#c0c7d6'
  on-tertiary-fixed: '#151c27'
  on-tertiary-fixed-variant: '#404754'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Space Mono
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-xl-mobile:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Mono
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26.4px
    letterSpacing: 0em
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.14em
  label-sm:
    fontFamily: Space Mono
    fontSize: 9px
    fontWeight: '400'
    lineHeight: 12px
    letterSpacing: 0.18em
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system reimagines computer networking architecture as deep-space radio astronomy telemetry. It approaches protocol analysis, routing hierarchies, packet streams, and interface topologies not as consumer dashboard abstractions, but as precision observational records captured in an optical astrophysics observatory journal.

The aesthetic fuses early astronomical cataloging and star charts with exact monospaced system telemetry. The personality is unyielding, scientific, cold, and absolute. There are no illusions of depth, skeuomorphic physical bevels, glows, saturated indicators, or blurred glass. The screen functions as an unilluminated vacuum where data points exist only by virtue of exact coordinates, 1px rules, and precise registration marks.

The target audience comprises network systems architects, low-level protocol engineers, and deep-systems researchers who demand high information density, structural legibility, zero decorative latency, and strict typographic hierarchy reminiscent of precision instrument drafting.

## Colors

The palette operates under absolute chromatic rationing, strictly enforcing zero-light void states with crisp monochromatic and celestial ink.

- **Primary (`#CFE3FF`)**: Cold blue-white starlight. Rationed exclusively for active protocol states, dynamic node triggers, hero vector diagrams, and focal telemetry points. It is never diluted with opacity or softened with glowing drop shadows.
- **Secondary / Ink (`#EDEFF2`)**: Uncoated parchment/stellar white. Applied to primary technical body copy, tabular data, and high-priority readout strings.
- **Tertiary / Dim Ink (`#6B7280`)**: Observational slate gray. Assigned to marginalia, cross-hair coordinate markers, grid line tick identifiers, line numbering, and secondary metadata.
- **Neutral / Vacuum (`#000000`)**: Absolute void. Every canvas, sheet, overlay, and container shares this unlit black core. Surfaces and partitions do not use elevated gray tones; they are defined strictly by 1px stroke lines in `#1C1F24` (hairline boundary rules).

Functional states:
- Active / Selected: Outlined or inscribed in `#CFE3FF`.
- Inactive / Quiescent: `#6B7280` text over a `#000000` base with `#1C1F24` borders.
- Destructive / Critical Fault: Signaled typographically using bracketed mono tags `[FAULT]` rather than synthetic high-saturation reds.

## Typography

The typographic hierarchy juxtaposes cold technical monospaced coordinates (`Space Mono`) with structured geometric body prose (`Space Grotesk`). 

Key rules:
- **Headlines (`Space Mono`)**: Structural, fixed-width telemetry readouts and observational chapter headers. Formatted in plain weight or subtle bold without stylistic distortion.
- **Body Measure (`Space Grotesk`)**: Strictly capped at a maximum width of 62 characters per line (`~580px`) to preserve the narrow measure of classical observatory reports and Tufte-style technical monographs.
- **Labels & Ephemeris Data (`Space Mono`)**: Set in strict uppercase at 9px to 11px with expansive tracking (`0.14em` to `0.18em`). Formatted systematically with celestial dividers: `RA 14h 29m / CO3 / NETWORK LAYER / 2.4 HRS`.
- **Numerals**: Numerical lists and step markers rely on padded zero notation (`01`, `02`, `03`) to maintain monospaced vertical grid alignment across all lines.

## Layout & Spacing

The layout model is governed by an explicit structural grid aligned with mechanical precision. Rather than invisible layout containers, boundaries are delineated by 1px rules in `#1C1F24` intersecting with `+` registration tick marks at column junctures.

Structure:
- **Grid Architecture**: 12-column fixed-proportion framework on desktop platforms with a dedicated 3-column right margin reserved for Tufte-style sidenotes, figure plates, and real-time protocol telemetry.
- **Reflow & Breakpoints**:
  - Desktop (`>= 1200px`): Full 12-column grid. Main narrative occupies columns 2–8; marginalia, packet headers, and notes occupy columns 9–12.
  - Tablet (`768px - 1199px`): 8-column layout. Sidenotes fold beneath associated figure diagrams as captioned rows.
  - Mobile (`< 768px`): 4-column linear strip. Outer margins collapse to `1rem` (`margin-mobile`). All borders retain absolute registration with horizontal divider rules.
- **Spatial Rhythm**: Components and data cells snap to an 8px grid baseline. Empty space is crisp and mechanical rather than expansive and atmospheric; information density remains high, mimicking dense scientific tables.

## Elevation & Depth

This design system completely rejects depth simulation. There are:
- No drop shadows or ambient blurs.
- No tonal elevation layers (surfaces do not step up through lighter charcoal tones).
- No glassmorphic backdrops or translucent materials.

Hierarchy is achieved entirely through planar demarcation:
1. **Hairline Boundaries**: Structural hierarchy is communicated solely through 1px border intersections (`#1C1F24`). Higher priority containers or active focal modules transition their border stroke to `#CFE3FF`.
2. **Text Contrast Tiers**: Visual order is driven by typography: active primary values in `#EDEFF2`, secondary telemetry in `#6B7280`, and targeted highlights in `#CFE3FF`.
3. **Registration Anchors**: Modal overlays or contextual flyouts do not hover with drop shadows; they dock flush into the grid with full-bleed `#000000` backing and a solid 1px `#CFE3FF` outer registration rule accompanied by monospaced coordinate tags in the top-left corner (e.g., `LOC: [0x4F:MODAL]`).

## Shapes

The shape system is strictly rectilinear. The roundedness value is `0` across every touchpoint, container, input, and interactive control. Curves are reserved entirely for vector astronomical charts and topological graph nodes.

- **Corners**: Exactly 0px radius. Every element terminates in crisp 90-degree right angles.
- **Intersection Tokens**: Where two structural layout lines cross, an absolute `+` character or 5px hairline crosshair is positioned at the nexus to visually cement the astronomical instrument aesthetic.
- **Outlines**: All panels, buttons, and badges utilize 1px solid hairline strokes. Double lines (parallel 1px strokes with 2px gap) indicate administrative boundaries and primary network layer demarcations.

## Components

### Buttons & Interactive Controls
- **Default Action**: Sharp 0px box, `#000000` background, 1px border in `#6B7280`. Text in `Space Mono` 11px uppercase (`#EDEFF2`) with leading bracket markers: `[ EXEC_PING ]`.
- **Primary / Focal Action**: 1px border in `#CFE3FF`, text in `#CFE3FF`. On hover/focus, inverts to `#CFE3FF` solid background with `#000000` text. Transitions are immediate (0ms duration, instantaneous mechanical state change).
- **Disabled State**: Text and border in `#1C1F24`, cursor not-allowed, stripped of interactive state markers.

### Input Fields & Select Boxes
- **Structure**: Rectangular input boxes built with `#000000` fill and 1px `#1C1F24` borders.
- **Labels**: Rendered as superscript coordinate tags (`Space Mono`, 9px, `#6B7280`) positioned above the field or docked into the top border line.
- **Focus**: Border switches to 1px `#CFE3FF`. A blinking block cursor (`▋`) replaces soft browser cursors.
- **Value Text**: `Space Mono` 13px in `#EDEFF2`.

### Badges & Status Chips
- Non-rounded terminal tags enclosed in monospaced bracket syntax: `[SYN_SENT]`, `[ACK]`, `[DROPPED]`.
- Active states use `#CFE3FF` text with a 1px `#CFE3FF` border. Quiescent states use `#6B7280` text with `#1C1F24` borders. No pill shapes or soft backgrounds are permitted.

### Cards & Telemetry Panels
- Flat `#000000` surface outlined by a 1px border in `#1C1F24`.
- Header bar includes an integrated coordinate string (`RA 04h / AZ 210° // LATENCY`) separated by a hairline divider.
- Corners are accented with exterior crosshairs (`+`) at layout intersections.

### Checkboxes & Radio Selectors
- **Checkbox**: 12px x 12px square box with 0px corner radius, 1px `#6B7280` border. Active state renders a centered solid 4px `#CFE3FF` square dot (no checkmarks).
- **Radio Selector**: 12px x 12px square box rotated 45 degrees (diamond geometry). Active state fills the inner diamond with `#CFE3FF`.

### Lists & Data Tables
- Continuous horizontal 1px hairline rules in `#1C1F24` separating records.
- Line numbers set in `Space Mono` 11px `#6B7280` along the left gutter.
- Row hover highlights entire line with a solid 1px `#CFE3FF` left border marker (`> ` prompt indicator).

### Marginalia & Sidenotes (Tufte Style)
- Pinned alongside the primary content stream in the outer desktop grid columns.
- Font: `Space Grotesk` 14px with `Space Mono` 9px uppercase headers (`NOTE 03 // BGP METRIC`).
- Figure references follow strict scientific nomenclature: `FIG. 3.2: Distance-vector update, hop 2` accompanied by minimalist line diagrams.