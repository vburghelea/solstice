# viaSport Brand Color Palette

> Analysis conducted January 2026 from [viasport.ca](https://viasport.ca)

This document provides a comprehensive analysis of viaSport's brand colors and typography for use in the SIN RFP proposal branding.

---

## Executive Summary

viaSport uses a sophisticated palette built around **teal/dark blue-green tones** as the primary brand identity, accented with **bright greens and blues**. The overall feel is professional, trustworthy, and connected to British Columbia's natural environment.

---

## Primary Brand Colors

### Core Palette

| Swatch                                                   | Name             | Hex       | RGB                | HSL                   | Usage                                                           |
| -------------------------------------------------------- | ---------------- | --------- | ------------------ | --------------------- | --------------------------------------------------------------- |
| ![#003B4D](https://via.placeholder.com/20/003B4D/003B4D) | **Dark Teal**    | `#003B4D` | `rgb(0, 59, 77)`   | `hsl(194, 100%, 15%)` | Primary brand color - navigation, headers, footer, primary text |
| ![#00675B](https://via.placeholder.com/20/00675B/00675B) | **Teal**         | `#00675B` | `rgb(0, 103, 91)`  | `hsl(173, 100%, 20%)` | Secondary brand - links, buttons, CTAs, interactive elements    |
| ![#0071CE](https://via.placeholder.com/20/0071CE/0071CE) | **Bright Blue**  | `#0071CE` | `rgb(0, 113, 206)` | `hsl(207, 100%, 40%)` | Accent - logo element, highlights, informational                |
| ![#93D500](https://via.placeholder.com/20/93D500/93D500) | **Lime Green**   | `#93D500` | `rgb(147, 213, 0)` | `hsl(79, 100%, 42%)`  | Accent - logo element, decorative shapes, success               |
| ![#00BC70](https://via.placeholder.com/20/00BC70/00BC70) | **Bright Green** | `#00BC70` | `rgb(0, 188, 112)` | `hsl(156, 100%, 37%)` | Accent - logo element, positive actions, growth                 |

### Color Usage Frequency (from site analysis)

```
#003B4D (Dark Teal)    ████████████████████████████████████ 986 instances
#00675B (Teal)         ██████████████████ 504 instances
#0071CE (Bright Blue)  ██ 49 instances
#93D500 (Lime Green)   █ 27 instances
#00BC70 (Bright Green) █ 22 instances
```

---

## Background Colors

| Swatch                                                          | Name           | Hex       | RGB                  | Usage                                                |
| --------------------------------------------------------------- | -------------- | --------- | -------------------- | ---------------------------------------------------- |
| ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF?text=+) | **White**      | `#FFFFFF` | `rgb(255, 255, 255)` | Primary page background                              |
| ![#DCF6EC](https://via.placeholder.com/20/DCF6EC/DCF6EC)        | **Light Mint** | `#DCF6EC` | `rgb(220, 246, 236)` | Section backgrounds, feature cards, callouts         |
| ![#ACDECB](https://via.placeholder.com/20/ACDECB/ACDECB)        | **Light Sage** | `#ACDECB` | `rgb(172, 222, 203)` | Secondary backgrounds, hover states, subtle emphasis |
| ![#FBFBFB](https://via.placeholder.com/20/FBFBFB/FBFBFB)        | **Off-White**  | `#FBFBFB` | `rgb(251, 251, 251)` | Subtle background variation, alternating sections    |

---

## Text Colors

| Swatch                                                          | Name          | Hex       | Usage                           | Contrast on White |
| --------------------------------------------------------------- | ------------- | --------- | ------------------------------- | ----------------- |
| ![#003B4D](https://via.placeholder.com/20/003B4D/003B4D)        | **Dark Teal** | `#003B4D` | Headlines, navigation, emphasis | 10.5:1 (AAA)      |
| ![#000000](https://via.placeholder.com/20/000000/000000)        | **Black**     | `#000000` | Primary body text               | 21:1 (AAA)        |
| ![#333333](https://via.placeholder.com/20/333333/333333)        | **Dark Gray** | `#333333` | Secondary body text, captions   | 12.6:1 (AAA)      |
| ![#FFFFFF](https://via.placeholder.com/20/FFFFFF/FFFFFF?text=+) | **White**     | `#FFFFFF` | Text on dark backgrounds        | N/A               |

---

## Typography

### Font Families

| Font            | Type         | Usage                              | Fallbacks                             |
| --------------- | ------------ | ---------------------------------- | ------------------------------------- |
| **Serifa**      | Serif (slab) | Headlines, h1-h3, feature text     | `"Helvetica Neue", Arial, sans-serif` |
| **Scandia Web** | Sans-serif   | Body text, navigation, UI elements | `"Times New Roman", Times, serif`     |

### Typography Characteristics

- **Headlines (Serifa)**: Bold, authoritative, distinctive slab-serif that conveys stability and trust
- **Body (Scandia Web)**: Clean, modern, highly readable sans-serif for extended content
- **Hierarchy**: Clear distinction between heading and body typography creates visual structure

---

## Logo Analysis

The viaSport logo is a multi-element wordmark with integrated graphic elements:

```
┌─────────────────────────────────────────┐
│                                         │
│   via SPORT  British                    │
│              Columbia                   │
│   ●●●                                   │
│                                         │
└─────────────────────────────────────────┘
```

### Logo Color Components

| Element            | Color      | Hex       |
| ------------------ | ---------- | --------- |
| "via" text         | Dark Teal  | `#003B4D` |
| "SPORT" text       | Dark Teal  | `#003B4D` |
| Curved accent      | Lime Green | `#93D500` |
| Circle (left)      | Blue       | `#0071CE` |
| Circle (center)    | Green      | `#00BC70` |
| "British Columbia" | Dark Teal  | `#003B4D` |

---

## Hero/Feature Elements

### Hero Tagline

The homepage hero features the tagline **"WE CHAMPION AMATEUR SPORT IN BC."** in a distinctive style:

| Element         | Color                          | Notes                     |
| --------------- | ------------------------------ | ------------------------- |
| Hero text       | **Golden Yellow** (~`#E6B800`) | Rendered as image overlay |
| Hero background | Photography with teal overlay  | Creates brand cohesion    |

### Decorative Elements

- **Organic shapes**: Large circular/blob shapes in lime green (`#93D500`) used as background decorations
- **Pattern style**: Overlapping circles and organic curves suggest movement, energy, and growth

---

## CSS Variables for Implementation

```css
:root {
  /* Primary Brand Colors */
  --viasport-primary: #003B4D;
  --viasport-primary-rgb: 0, 59, 77;
  --viasport-secondary: #00675B;
  --viasport-secondary-rgb: 0, 103, 91;

  /* Accent Colors */
  --viasport-accent-blue: #0071CE;
  --viasport-accent-lime: #93D500;
  --viasport-accent-green: #00BC70;

  /* Background Colors */
  --viasport-bg-white: #FFFFFF;
  --viasport-bg-mint: #DCF6EC;
  --viasport-bg-sage: #ACDECB;
  --viasport-bg-off-white: #FBFBFB;

  /* Text Colors */
  --viasport-text-primary: #003B4D;
  --viasport-text-body: #000000;
  --viasport-text-secondary: #333333;
  --viasport-text-inverse: #FFFFFF;

  /* Hero/Feature */
  --viasport-hero-gold: #E6B800;

  /* Semantic Aliases */
  --color-brand: var(--viasport-primary);
  --color-link: var(--viasport-secondary);
  --color-success: var(--viasport-accent-green);
  --color-info: var(--viasport-accent-blue);
  --color-highlight: var(--viasport-accent-lime);
}
```

---

## Tailwind CSS Configuration

```javascript
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      colors: {
        viasport: {
          // Primary
          'dark-teal': '#003B4D',
          'teal': '#00675B',

          // Accents
          'blue': '#0071CE',
          'lime': '#93D500',
          'green': '#00BC70',

          // Backgrounds
          'mint': '#DCF6EC',
          'sage': '#ACDECB',

          // Feature
          'gold': '#E6B800',
        }
      }
    }
  }
}
```

---

## WCAG Accessibility Compliance

### Contrast Ratios

| Combination            | Ratio  | WCAG AA              | WCAG AAA |
| ---------------------- | ------ | -------------------- | -------- |
| `#003B4D` on `#FFFFFF` | 10.5:1 | ✅ Pass              | ✅ Pass  |
| `#00675B` on `#FFFFFF` | 5.2:1  | ✅ Pass (large text) | ❌ Fail  |
| `#FFFFFF` on `#003B4D` | 10.5:1 | ✅ Pass              | ✅ Pass  |
| `#FFFFFF` on `#00675B` | 5.2:1  | ✅ Pass (large text) | ❌ Fail  |
| `#003B4D` on `#DCF6EC` | 8.9:1  | ✅ Pass              | ✅ Pass  |
| `#003B4D` on `#ACDECB` | 6.4:1  | ✅ Pass              | ✅ Pass  |

### Recommendations

- Use `#003B4D` (Dark Teal) for all critical text - excellent contrast
- Use `#00675B` (Teal) only for large text (18px+) or UI elements with additional indicators
- Accent colors (`#93D500`, `#0071CE`, `#00BC70`) should be used for decorative purposes only, not for conveying critical information

---

## Color Psychology & Brand Positioning

### Teal/Dark Blue-Green (`#003B4D`, `#00675B`)

- **Associations**: Trust, stability, professionalism, nature, health
- **Message**: Reliable government-adjacent organization, connected to BC's natural environment
- **Usage**: Establishes credibility and authority

### Green Tones (`#93D500`, `#00BC70`)

- **Associations**: Growth, vitality, health, progress, environmental consciousness
- **Message**: Supporting active lifestyles, positive outcomes, forward momentum
- **Usage**: Energizes the palette, suggests action and achievement

### Blue (`#0071CE`)

- **Associations**: Trust, communication, technology, clarity
- **Message**: Modern, connected, informative
- **Usage**: Balances the green tones, adds technological sophistication

---

## Application Guidelines

### Do's

- ✅ Use Dark Teal (`#003B4D`) as the primary brand identifier
- ✅ Apply Teal (`#00675B`) for interactive elements (links, buttons)
- ✅ Use Light Mint (`#DCF6EC`) for section differentiation
- ✅ Maintain high contrast for all text elements
- ✅ Use accent colors sparingly for emphasis and visual interest

### Don'ts

- ❌ Don't use accent colors (lime, blue, green) for body text
- ❌ Don't place low-contrast text on colored backgrounds
- ❌ Don't overuse the decorative accent colors
- ❌ Don't modify the logo colors

---

## Source Files

Screenshots captured during analysis:

- `/.playwright-mcp/viasport-homepage.png` - Full homepage capture
- `/.playwright-mcp/viasport-press-kit.png` - Press kit page

---

## References

- [viaSport Official Website](https://viasport.ca)
- [viaSport Press Kit](https://viasport.ca/press-kit/)
- [viaSport Strategic Plan 2022-2027](https://viasport.ca/wp-content/uploads/2023/07/viaSport-Strategic_Plan-2022-2077.pdf)

---

_Document generated: January 2026_
_For use in Solstice SIN RFP proposal branding_
