# Sinsay Design Guidelines

> Extracted from [sinsay.com](https://www.sinsay.com/pl/pl) on 2026-03-27.
> Use these tokens and guidelines to ensure our application is visually consistent with the Sinsay brand.

## Assets

| Asset | File | Notes |
|---|---|---|
| Homepage screenshot | [assets/sinsay-homepage.png](../assets/sinsay-homepage.png) | Viewport screenshot |
| Logo (SVG) | [assets/logo.svg](../assets/logo.svg) | Official wordmark, dark `#16181D` fill |
| Favicon | [assets/sinsay-favicon.ico](../assets/sinsay-favicon.ico) | 16×16 ICO |
| Design tokens (JSON) | [assets/design-tokens.json](../assets/design-tokens.json) | All tokens in structured format |

---

## Brand Identity

**Sinsay** is a fast-fashion e-commerce brand targeting young adults with affordable clothing. The visual language is **clean, minimal, and modern** with occasional bold promotional accents (sale red, warm orange). All user-facing text on the Polish site is in **Polish**.

### Logo

The Sinsay wordmark is a custom-drawn SVG path in near-black `#16181D`. It has no icon — only the lowercase wordmark "sinsay".

- Use on white/light backgrounds: fill `#16181D`
- Use on dark backgrounds: fill `#ffffff`
- File: [`assets/logo.svg`](../assets/logo.svg)

---

## Color Palette

All colors extracted from CSS custom properties (`--color-*`) on sinsay.com.

### Primary (Warm Orange)

The brand primary is a warm, golden orange used for primary CTAs, highlights, and the "Sinsay Club" loyalty badge.

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#E09243` | Primary buttons, active accents |
| `--color-primary-60` | `#B2671B` | Hover state |
| `--color-primary-40` | `#F2B06D` | Light variant |
| `--color-primary-10` | `#FFF2E5` | Background tint |

### Neutral / Dark Scale

The near-black `#16181D` is the brand's primary dark color (not pure black). Used for logo, text, dark CTA buttons.

| Token | Hex | Usage |
|---|---|---|
| Logo / brand dark | `#16181D` | Logo fill, dark buttons |
| `--color-dark-90` | `#18191a` | Near-black text |
| `--color-dark-80` | `#303133` | Body text, nav links |
| `--color-dark-70` | `#494a4d` | Secondary text |
| `--color-dark-60` | `#616366` | Muted text |
| `--color-dark-50` | `#7b7d80` | Placeholder |
| `--color-dark-30` | `#afb0b2` | Disabled text |
| `--color-dark-20` | `#c8c9cc` | Borders |
| `--color-dark-10` | `#e3e4e5` | Dividers |
| `--color-dark-5` | `#f1f2f4` | Subtle backgrounds |
| White | `#ffffff` | Backgrounds |

### Semantic / Functional Colors

| Role | Hex | CSS var |
|---|---|---|
| Page background | `#ffffff` | — |
| Surface (cards etc.) | `#f6f6f6` | — |
| Body text | `#333333` | — |
| Secondary text | `#494a4d` | `--color-dark-70` |
| Muted / placeholder | `#7b7d80` | `--color-dark-50` |
| Border default | `#e3e4e5` | `--color-dark-10` |
| Error / Sale accent | `#E90000` | `--color-red-50` |
| Success | `#0db209` | `--color-green-50` |
| Info | `#2e90e5` | `--color-blue-50` |
| Warning | `#ff9900` | `--color-orange-50` |

### Accent / Promotional

| Role | Hex | Usage |
|---|---|---|
| Promo bar background | `#E90000` | Top announcement bar |
| Sale badge / stickers | `#E90000` | Discount labels |
| Feminine sticker | `#E66593` | Category stickers |

---

## Typography

### Font Family

Sinsay uses **Euclid Circular B** (a custom geometric sans-serif), falling back to Arial/Helvetica.

```
font-family: "Euclid Circular B", "Euclid", Arial, Helvetica, "Helvetica Neue", sans-serif;
```

> **Note for our app:** Euclid Circular B is a commercial font. If unavailable, use `Inter` or `DM Sans` as a close geometric sans-serif substitute. Alternatively, load via CDN if licensed.

### Font Sizes

| Token | Size | Usage |
|---|---|---|
| `--font-size-default-xs` | `10px` | Micro labels |
| `--font-size-default-s` | `12px` | Captions, badges |
| `--font-size-default-m` | `14px` | Secondary body |
| `--font-size-base` | `16px` | Body text (default) |
| `--font-size-default-xl` | `18px` | Large body |
| `--font-size-heading-s` | `20px` | H4/H5 |
| `--font-size-heading-m` | `24px` | H3 |
| `--font-size-heading-l` | `32px` | H2 |
| `--font-size-heading-xl` | `48px` | H1 |
| `--font-size-heading-mega` | `80px` | Hero / campaign |

### Font Weights

| Token | Value | Usage |
|---|---|---|
| `--font-weight-regular` | `400` | Body text, product names |
| `--font-weight-medium` | `500` | Headings, prices |
| `--font-weight-semibold` | `600` | Buttons, nav labels |
| `--font-weight-bold` | `700` | Display / hero headings |

### Line Height

| Token | Value | Usage |
|---|---|---|
| `--dt-font-line-height-tight` | `120%` | Headings, prices |
| `--dt-font-line-height-compact` | `130%` | Sub-headings |
| `--dt-font-line-height-default` | `150%` | Body text |

---

## Spacing Scale

Based on a base-4 / base-8 system.

| Token | Value | Notes |
|---|---|---|
| `--size-s` / `--spacing-base-space-s` | `4px` | Tight gaps |
| `--size-sm` / `--spacing-base-space-sm` | `8px` | Component internal spacing |
| `--size-m` / `--spacing-base-space-m` | `16px` | Default padding |
| `--spacing-other-space-24` | `24px` | Layout gutter (tablet/desktop) |
| `--size-l` / `--spacing-base-space-l` | `32px` | Section padding |
| `--spacing-other-space-40` | `40px` | — |
| `--spacing-other-space-48` | `48px` | — |
| `--size-xl` / `--spacing-base-space-xl` | `64px` | Large section spacing |
| `--size-xxl` / `--spacing-base-space-xxl` | `128px` | Hero / mega spacing |

### Layout Gutters

| Context | Value |
|---|---|
| Mobile gutter | `16px` |
| Tablet gutter | `24px` |
| Desktop gutter | `24px` |
| Desktop large margin | `64px` |

---

## Border Radius

Sinsay uses mostly **sharp / 0px radius** for primary buttons and cards. Rounded variants are used for pills and circles.

| Token | Value | Usage |
|---|---|---|
| `--radius-default` | `4px` | Default small rounding |
| `--radius-base-xs` | `2px` | Subtle rounding |
| `--radius-base-s` | `4px` | Cards, inputs |
| `--radius-base-sm` | `8px` | Tags, badges |
| `--radius-base-m` | `16px` | Modals, panels |
| `--radius-pill-*` | `8px–32px` | Pill-shaped elements |
| `--dt-radius-shape-pill` | `999px` | Full pill |
| Primary button radius | `0px` | **No rounding** — sharp corners |

> **Key brand detail:** Primary CTA buttons use `border-radius: 0px` (completely square corners). This is a deliberate brand choice.

---

## Elevation / Shadows

| Level | Value |
|---|---|
| `--elevation-01` | `0px 2px 12px rgba(24,25,26,0.08), 0px 1px 2px rgba(26,13,0,0.08)` |
| `--elevation-02` | `0px 4px 16px rgba(24,25,26,0.1), 0px 1px 4px rgba(26,13,0,0.1)` |
| `--elevation-03` | `0px 6px 24px rgba(24,25,26,0.12), 0px 1px 6px rgba(26,13,0,0.1)` |
| `--elevation-04` | `0px 8px 40px rgba(24,25,26,0.14), 0px 2px 12px rgba(26,13,0,0.12)` |

Shadows use a warm-tinted dark (not pure black) with two layers for realism.

---

## Breakpoints

| Name | Width |
|---|---|
| Mobile | `0px` |
| Tablet | `640px` |
| Desktop small | `1008px` |
| Desktop large | `1540px` |

---

## Component Patterns

### Header

- Background: `#ffffff`
- Height: `60px`
- Logo: SVG wordmark, centered
- Nav links: `16px`, weight `400`, color `#303133`
- Icons (account, wishlist, cart): monochromatic, `24px`
- Search bar: rounded input with magnifier icon

### Top Promo Bar

- Background: `#E90000` (vivid red)
- Text: `#ffffff`, bold, centered
- Contains promotional messages and sale info

### Primary Button

```css
background-color: #E09243;
color: #ffffff;
border: 1.6px solid #E09243;
border-radius: 0px;       /* Sharp corners — key brand detail */
padding: 12px 32px;
font-size: 16px;
font-weight: 600;
font-family: "Euclid Circular B", Arial, sans-serif;
text-transform: uppercase;
letter-spacing: 0.6px;
```

### Secondary / Outline Button

```css
background-color: transparent;
color: #16181D;
border: 1.6px solid #16181D;
border-radius: 0px;
padding: 12px 32px;
font-size: 16px;
font-weight: 600;
```

### Dark Button

```css
background-color: #16181D;
color: #ffffff;
border-radius: 0px;
padding: 12px 32px;
font-size: 16px;
font-weight: 600;
```

### Navigation

- Main nav categories: `Polecane`, `Kobieta`, `Dom`, `Dziecko`, `Mężczyzna`
- Font: `16px`, weight `400`
- Color: `#303133`
- No underline by default; underline on hover

### Product Cards

- White background `#ffffff`
- Subtle shadow (`--elevation-01`)
- Image occupies top section
- Product name: regular weight, `14–16px`
- Price: medium weight (`500`), `16px`
- Sale price: red `#E90000`
- Original price: line-through, muted

### Sticker / Badge Labels

- Sale: red background `#E90000`, white text, `border-radius: 4px`
- Category sticker: pink `#E66593`
- Font: `12px`, weight `600`, uppercase

### Form Inputs / Search

- Border: `1px solid #e3e4e5`
- Background: `#ffffff`
- Border radius: `4px` (subtle)
- Focus border: `#16181D` or `#2e90e5`
- Placeholder color: `#7b7d80`
- Font size: `16px`

---

## Iconography

Sinsay uses a custom icon set (`--di-*` CSS variables containing inline SVG data URIs). Icons come in two sizes:
- `16px` — inline / compact contexts
- `24px` — standard UI icons

All icons are monochromatic and follow the text color of their context.

---

## Do's and Don'ts

**Do:**
- Use `#E09243` orange for primary CTAs
- Use `#16181D` (near-black) for logo, dark buttons, strong UI elements
- Use **0px border-radius** on primary buttons (sharp corners are a brand signature)
- Keep backgrounds white/light grey — Sinsay is a clean, airy design
- Use `#E90000` only for sale/error states (not general accent)
- Use "Euclid Circular B" or a geometric sans-serif fallback

**Don't:**
- Round primary CTA buttons — Sinsay buttons are sharp-cornered
- Use pure black `#000000` for UI text (use `#333333` or `#303133`)
- Mix too many accent colors — the design is restrained
- Use heavy shadows — Sinsay uses very subtle layered shadows

---

## Tailwind CSS Config Mapping

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E09243',
          dark: '#B2671B',
          light: '#F2B06D',
          subtle: '#FFF2E5',
        },
        brand: {
          dark: '#16181D',
          red: '#E90000',
          pink: '#E66593',
        },
        neutral: {
          90: '#18191a',
          80: '#303133',
          70: '#494a4d',
          60: '#616366',
          50: '#7b7d80',
          40: '#949699',
          30: '#afb0b2',
          20: '#c8c9cc',
          10: '#e3e4e5',
          5: '#f1f2f4',
        },
      },
      fontFamily: {
        sans: ['"Euclid Circular B"', 'Euclid', 'Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'xs': '10px',
        'sm': '12px',
        'md': '14px',
        'base': '16px',
        'lg': '18px',
        'h5': '20px',
        'h4': '24px',
        'h3': '32px',
        'h2': '48px',
        'h1': '80px',
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '8px',
        lg: '16px',
        xl: '32px',
        pill: '999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        32: '128px',
      },
      boxShadow: {
        'elevation-1': '0px 2px 12px rgba(24,25,26,0.08), 0px 1px 2px rgba(26,13,0,0.08)',
        'elevation-2': '0px 4px 16px rgba(24,25,26,0.1), 0px 1px 4px rgba(26,13,0,0.1)',
        'elevation-3': '0px 6px 24px rgba(24,25,26,0.12), 0px 1px 6px rgba(26,13,0,0.1)',
        'elevation-4': '0px 8px 40px rgba(24,25,26,0.14), 0px 2px 12px rgba(26,13,0,0.12)',
      },
      screens: {
        sm: '640px',
        md: '1008px',
        lg: '1540px',
      },
    },
  },
}
```
