# Integrated LV Design System

## Color Palette

### Brand Colors
- **Primary (Military Green):** `#3A443E`
- **Accent (Orange):** `#FF6F12`

### Neutral Grays (Warm, Not Blue)
- **Gray 100:** `#f4f7f5` - Card backgrounds
- **Gray 200:** `#e8ebe9` - Borders, dividers
- **Gray 300:** `#d1d5d3` - Input borders
- **Gray 400:** `#9ca09e` - Muted text
- **Gray 500:** `#6b716f` - Secondary text
- **Gray 900:** `#1a1d1b` - Dark text

### Semantic Colors
- **Success:** `#10b981` (resolved tickets)
- **Warning:** `#FF6F12` (urgent items - uses accent)
- **Error:** `#ef4444` (destructive actions)

---

## Typography Rules

### Unified Pill/Badge/Label Typography
**ALL badges, pills, dropdowns, and labels MUST use:**
```css
font-size: 0.75rem          /* text-xs */
font-weight: 600            /* font-semibold */
letter-spacing: 0.025em     /* tracking-wide */
text-transform: uppercase   /* uppercase */
```

**CSS Class:** `.badge-text` or `.badge-status`

### Monospace Usage
**ONLY use monospace for:**
- Ticket numbers: `.mono-id` (text-xs, font-bold, tracking-wider, uppercase)
- Serial numbers: `.mono-code` (text-xs, text-muted-foreground)
- Hardware IDs
- Any technical codes

**NOT for:** Titles, descriptions, body text, names

### Typography Hierarchy
```
Page Titles:     text-3xl font-bold tracking-tight
Section Titles:  text-xl font-semibold tracking-tight
Card Titles:     text-lg font-semibold
Labels:          text-xs font-semibold uppercase tracking-wide (badge-text)
Body:            text-sm leading-relaxed
Muted:           text-xs text-muted-foreground
```

---

## Component Patterns

### Badges
**Status Badges:**
```tsx
<Badge className="badge-status bg-accent/10 text-accent border-accent/30">
  OPEN
</Badge>
```

**Priority Badges:**
```tsx
// Urgent
<Badge className="badge-status bg-accent text-white border-accent">
  URGENT
</Badge>

// Normal
<Badge className="badge-status bg-primary/20 text-primary border-primary/30">
  NORMAL
</Badge>
```

**Count Badges:**
```tsx
<Badge className="bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-bold rounded-full">
  5
</Badge>
```

### Cards
**Standard:**
```tsx
<Card className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
```

**Interactive:**
```tsx
<Card className="card-hover cursor-pointer border-2 hover:border-accent/20">
```

**Emphasized:**
```tsx
<Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
```

### Buttons
**Hierarchy:**
```tsx
// Primary
<Button className="bg-primary hover:bg-primary/90">

// CTA/Accent
<Button className="bg-accent hover:bg-accent/90">

// Success
<Button className="bg-green-600 hover:bg-green-700">

// Outline
<Button variant="outline" className="border-2">
```

### Links
**Consistent:**
```tsx
<Link className="link-accent">  // Uses: text-accent font-semibold hover:underline
```

---

## Spacing System
- Between sections: `space-y-6`
- Within cards: `space-y-4`
- Between small items: `gap-2` or `space-y-2`
- Card padding: `p-6` (default) or `p-4` (compact)

---

## Icon Sizing
- **Default:** `h-5 w-5`
- **Sidebar:** `h-5 w-5`
- **Meta info:** `h-3.5 w-3.5`
- **Empty states:** `h-12 w-12`

---

## Hover Effects
**Cards:**
```css
hover:shadow-md
hover:scale-[1.01]
transition-all duration-200
```

**Images:**
```css
hover:scale-110
transition-transform duration-300
```

---

## Priority Indicators
**Visual System:**
- **Urgent:** Accent orange bar + orange badge
- **High:** Accent/70 orange bar + badge
- **Normal:** Primary green bar
- **Low:** Muted gray bar

---

## Usage Guidelines

### DO:
✅ Use `.badge-text` for all labels
✅ Use `.mono-id` for ticket/serial numbers
✅ Use `.link-accent` for all links
✅ Use warm grays (#f4f7f5 base)
✅ Stick to green/orange/neutral palette
✅ Maintain consistent spacing
✅ Use hover effects on interactive elements

### DON'T:
❌ Introduce blue colors
❌ Use monospace for body text
❌ Mix font sizes in badges
❌ Use arbitrary colors
❌ Skip hover states
❌ Use inconsistent borders

---

**This design system ensures every component looks cohesive and professional!**


