# DESIGN.md — Shineteck Inc. Enterprise Design System

> **Single Source of Truth for AI Agents, Engineers, and Designers building Shineteck Inc. Web Applications.**
> *Compliant with Google Stitch & Awesome-Design-MD Standards.*

---

## 1. Visual Persona & Design Philosophy

Shineteck Inc. is an elite IT Consulting, Workforce Governance, and Enterprise Solutions provider. The visual language conveys:
- **Executive Trust & Precision**: Crisp, high-contrast, structured enterprise density (comparable to Linear, Deel, Stripe, and Workday).
- **Eye-Comfortable Warm Slate Palette (Anti-Glare / Anti-Fatigue)**: Uses rich tonal contrast with a warm slate-mist background (`#eef2f6`), deep executive navy sidebar (`#071524`), crisp porcelain cards (`#ffffff`), and distinct table striping so users never experience blinding white fatigue.
- **Human-Centric Visual Anchors (Avatars & Monograms)**: Every personnel row features a prominent, high-contrast Employee Avatar / Monogram badge so faces and personnel are instantly recognizable at a glance.
- **Dual Mode Coherence**: Clean, executive Light Mode for daylight operational workflows and deep Navy/Obsidian for high-focus identity terminals.

---

## 2. Color Palette & Semantic Tokens

### Brand Core
- **Deep Executive Frame**: `#071524` (`--brand-obsidian`) — Sidebar navigation, auth backdrops, terminal framing.
- **Primary Navy**: `#0f2b48` (`--brand-navy`) — Header accents, executive buttons, primary titles.
- **Corporate Accent Blue**: `#2563eb` (`--brand-blue`) — Primary focus rings, active tabs, interactive links.
- **Energy Amber**: `#e27a3f` (`--brand-amber`) — Secondary logo mark accent, overtime warnings, pending status.
- **Emerald Growth**: `#439b61` (`--brand-emerald`) — Approved status, SOC-2 verification badges, positive margins.

### Neutrals (Eye-Friendly Layering)
- **Canvas Base**: `#eef2f6` (Warm Slate Mist with subtle top radial gradient — never stark #ffffff)
- **Card Background**: `#ffffff` (`white` with `#d9e2ec` defined borders)
- **Bezel Frame**: `#f1f5f9` (`slate-100` double-bezel wrapper)
- **Table Header**: `#eaf0f7` (Distinct slate-blue header tone)
- **Zebra Rows**: Alternating `#ffffff` and `#f8fafc` with `#e3effa` hover highlight
- **Primary Text**: `#0f172a` (`slate-900`)
- **Muted Text**: `#475569` (`slate-600`) & `#64748b` (`slate-500`)

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

### Employee Avatar & Visual Face Anchors (`<EmployeeAvatar />`)
- Prominent 32px-48px avatar badge in all table rows, directory cards, approvals, and headers.
- Displays employee photo with fallback to color-coded monogram initials (Blue, Indigo, Purple, Emerald, Amber, Teal, Rose).
- Displays status ring badge (Active = Emerald, Pending = Amber, Inactive = Rose).

### High-Density Table System (`.table-container` & `.enterprise-table`)
- Wrap in `.table-container` with border `#cbd5e1` and soft depth shadow.
- Header: `#eaf0f7` with bold slate labels and 2px `#cbd5e1` separator.
- Zebra Rows: Alternating `#ffffff` and `#f8fafc` with soothing `#e3effa` hover.

### Double-Bezel Card (`.enterprise-card`)
- Outer shell: `rounded-2xl p-1 bg-slate-100 border border-slate-300 shadow-md`
- Inner core: `bg-white rounded-xl p-6 border border-slate-200`

---

## 5. Anti-Patterns & Banned Implementations

❌ **NEVER** build flat 100% all-white pages without background contrast (causes blinding user fatigue).  
❌ **NEVER** render tabular employee names without visual face/monogram avatar anchors.  
❌ **NEVER** use default unstyled browser alerts or raw empty states without skeleton loaders.  
❌ **NEVER** use harsh neon glare colors — use calibrated, eye-friendly executive tones.  
