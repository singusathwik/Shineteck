# DESIGN.md — Shineteck Inc. Enterprise Design System

> **Single Source of Truth for AI Agents, Engineers, and Designers building Shineteck Inc. Web Applications.**
> *Compliant with Google Stitch & Awesome-Design-MD Standards.*

---

## 1. Visual Persona & Design Philosophy

Shineteck Inc. is an elite IT Consulting, Workforce Governance, and Enterprise Solutions provider. The visual language conveys:
- **Executive Trust & Precision**: Crisp, high-contrast, structured enterprise density (comparable to Linear, Deel, Stripe, and Workday).
- **Modern Elegance (Anti-Slop)**: Restrained specular highlights, double-bezel cards, micro-tooltips, subtle depth shadows, and fluid 60fps ambient motion.
- **Dual Mode Coherence**: Clean, executive Light Mode for daylight operational workflows and deep Navy/Obsidian for high-focus identity terminals.

---

## 2. Color Palette & Semantic Tokens

### Brand Core
- **Primary Navy**: `#0f2b48` (`--brand-navy`) — Header accents, executive buttons, primary titles.
- **Deep Obsidian**: `#071524` (`--brand-obsidian`) — Root background for terminals and badge cards.
- **Electric Corporate Blue**: `#2563eb` (`--brand-blue`) — Primary focus rings, active tabs, interactive links.
- **Energy Amber**: `#e27a3f` (`--brand-amber`) — Secondary logo mark accent, overtime warnings, pending status.
- **Emerald Growth**: `#439b61` (`--brand-emerald`) — Approved status, SOC-2 verification badges, positive margins.

### Neutrals (Light Workspace)
- **Canvas Base**: `#f8fafc` (`slate-50`)
- **Card Background**: `#ffffff` (`white`)
- **Bezel Frame**: `#f1f5f9` (`slate-100`)
- **Hairline Borders**: `#e2e8f0` (`slate-200`) & `#cbd5e1` (`slate-300`)
- **Primary Text**: `#0f172a` (`slate-900`)
- **Muted Text**: `#64748b` (`slate-500`)
- **Subtle Captions**: `#94a3b8` (`slate-400`)

---

## 3. Typography Hierarchy

```css
/* Display & Headlines */
font-family: 'Outfit', -apple-system, sans-serif;
font-weight: 700 | 800 | 900;
letter-spacing: -0.025em;

/* Body, Navigation & Forms */
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
font-weight: 400 | 500 | 600 | 700;

/* Numeric Identifiers, Currencies, Dates & Codes */
font-family: 'JetBrains Mono', monospace;
font-weight: 500 | 700;
```

---

## 4. Component Anatomy & Tokens

### Double-Bezel Card (`.enterprise-card`)
- Outer shell: `rounded-2xl p-1 bg-slate-100/90 border border-slate-200/80 shadow-xl shadow-slate-200/60`
- Inner core: `bg-white rounded-xl p-6 sm:p-8 border border-slate-200/70`

### Interactive Button Tokens
- **Primary CTA (`.enterprise-btn-primary`)**:
  `px-4 py-2.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-2 cursor-pointer`
- **Secondary Action (`.enterprise-btn-secondary`)**:
  `px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer`

### Form Controls
- Inputs: `bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs`

### Enterprise Table (`.enterprise-table`)
- Wrap in `.table-container` with horizontal overflow protection.
- Header: `bg-slate-50 text-[10.5px] uppercase font-bold text-slate-500 tracking-wider font-display py-3 px-4`
- Rows: `hover:bg-slate-50/80 transition-colors border-b border-slate-100 py-3.5 px-4 text-xs`

---

## 5. Interaction Patterns & Motion

- **Keyboard First**: Global Command Palette accessible via `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS).
- **Perceived Speed**: Always use `SkeletonTable` or `SkeletonCard` during asynchronous data fetches.
- **GPU Acceleration**: Interactive canvas particles rendered via `requestAnimationFrame` with mouse interaction repelling physics.
- **Exporting & Reporting**: High-density tables must include an **"Export CSV"** trigger with clean header sanitization.

---

## 6. Anti-Patterns & Banned Implementations

❌ **NEVER** use default unstyled browser alert dialogs — use tailored in-card or toast notification banners.  
❌ **NEVER** use default monospace browser fonts — always use `font-mono` mapped to `JetBrains Mono`.  
❌ **NEVER** build flat borderless cards with harsh black dropshadows.  
❌ **NEVER** leave long data loading states with empty screens or raw spinners — always provide skeleton loaders.  
