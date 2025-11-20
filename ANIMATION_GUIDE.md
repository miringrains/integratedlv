# Animation & Interaction Guide

## Philosophy
Subtle, tasteful interactions that enhance usability without being distracting. All animations serve a purpose and align with the military green/orange brand.

---

## Core Hover Pattern

### Card Hover (Default)
```
Default: bg-card (#f4f7f5) + border-transparent
Hover:   bg-white + border-primary (military green)
Speed:   300ms ease-out
```

**Effect:** Creates a subtle "lift and define" without scaling or heavy shadows.

**Usage:**
- Location cards
- Hardware cards
- SOP cards
- Any clickable card

**CSS Class:** `.card-hover`

---

### Ticket Card Hover (Special)
```
Default: bg-card + border-gray-200
Hover:   bg-white + border-primary + shadow-sm
Speed:   300ms ease-out
```

**Effect:** Slightly more definition for ticket cards due to content density.

**CSS Class:** `.ticket-card-hover`

---

## Color Usage Rules

### Military Green (#3A443E)
**Use for:**
- Hover border states
- Normal priority indicators
- Active navigation items
- Primary action buttons
- Title hover color

### Orange (#FF6F12)
**Use RARELY for:**
- CTA buttons only ("New Ticket", "Create")
- Urgent priority badges
- Important alerts
- Critical actions
- **NEVER for hover states** (too sharp)

### White
**Use for:**
- Hover background (creates lift effect)
- Card content backgrounds
- Button text on colored buttons

---

## Interaction Patterns

### 1. Card Interactions
**On Hover:**
- Background: card → white
- Border: transparent/subtle → primary (green)
- Title text: foreground → primary (green)
- Icon: subtle scale (1 → 1.1)
- Duration: 300ms

**On Click:**
- No additional animation
- Immediate navigation

### 2. Links
**On Hover:**
- Color: accent (orange)
- Underline appears
- No other effects

**CSS:** `.link-accent`

### 3. Buttons
**Primary (Green):**
- Hover: Slightly darker green
- Active: Even darker
- No scale, no shadow growth

**Accent (Orange) - CTAs Only:**
- Hover: Slightly darker orange
- Reserved for: New Ticket, Create, Submit

**Success (Green):**
- For: Mark Resolved, Complete
- Hover: Darker green

### 4. Priority Indicators
**Thin bar on ticket cards:**
- Urgent: Accent (orange)
- High: Accent/70 (lighter orange)
- Normal: Primary (green)
- Low: Muted (gray)

**Never animates** - static visual indicator

### 5. Status Badges
**Static elements** - no hover animation
- Just display information
- Bordered, consistent typography
- Color indicates state

### 6. Icons
**Subtle enhancement:**
- Small scale on hover: `group-hover:scale-110`
- Smooth: `transition-transform duration-300`
- Only for decorative icons (MapPin, etc.)
- NOT for functional icons (close buttons, etc.)

---

## Transitions

### Speed Guidelines
- **Fast (200ms):** Button hover, small changes
- **Medium (300ms):** Card hover, color transitions (DEFAULT)
- **Slow (500ms):** Modal open, large movements

### Easing
- Default: `ease-out`
- Cards: `ease-out`
- Modals: `ease-in-out`

---

## What We DON'T Do

❌ **NO scale transforms** on cards (dated, corny)
❌ **NO shadow growth** on hover (2015 vibes)
❌ **NO neon effects** (not professional)
❌ **NO rainbow gradients** (not brand-aligned)
❌ **NO spin animations** (unless loading spinner)
❌ **NO bounce effects** (too playful)
❌ **NO orange hover states** (too sharp)

---

## What We DO

✅ **Background: card → white** (lift effect)
✅ **Border: subtle → green** (define)
✅ **Text: foreground → green** (engagement)
✅ **Smooth 300ms transitions** (professional)
✅ **Subtle icon scale** (polish)
✅ **Orange for CTAs only** (intentional)

---

## Implementation

### Standard Card Component
```tsx
<Card className="card-hover cursor-pointer group">
  <CardHeader>
    <CardTitle className="group-hover:text-primary transition-colors duration-300">
      Title
    </CardTitle>
    <Icon className="group-hover:scale-110 transition-transform duration-300" />
  </CardHeader>
</Card>
```

### Ticket Card Component
```tsx
<Card className="ticket-card-hover cursor-pointer group">
  {/* Content with green priority bar */}
  <h3 className="group-hover:text-primary transition-colors duration-300">
    Title
  </h3>
</Card>
```

### CTA Button (Orange - Rare Use)
```tsx
<Button className="bg-accent hover:bg-accent-dark transition-colors">
  Create Ticket
</Button>
```

### Primary Button (Green - Common)
```tsx
<Button className="bg-primary hover:bg-primary-dark transition-colors">
  Save
</Button>
```

---

## Result

**Subtle, professional, brand-aligned interactions that enhance usability without being distracting or dated.**

The hover effect creates a sense of "this card is active" through the white background and green border definition, reserving orange for the truly important actions.

**Ready to implement?** This will make the portal feel modern and cohesive! ✨

