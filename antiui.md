## Design System: PUBLIC SERVICE CITIZEN PORTAL COMPLAINT



### Pattern

- **Name:** Minimal Single Column

- **Conversion Focus:** Single CTA focus. Large typography. Lots of whitespace. No nav clutter. Mobile-first.

- **CTA Placement:** Center, large CTA button

- **Color Strategy:** Minimalist: Brand + white #FFFFFF + accent. Verify CTA label text against its button fill at 4.5:1 minimum; use 7:1 only for an explicit AAA normal-text target.

- **Sections:** Hero headline > Short description > Benefit bullets (3 max) > CTA > Footer



### Style

- **Name:** Accessible & Ethical

- **Mode Support:** Light supported | Dark supported

- **Keywords:** Accessible, inclusive interface, high contrast, large text (16px+), keyboard navigation, screen reader friendly, accessibility standards aware, focus state, semantic

- **Best For:** Government, healthcare, education, inclusive products, large audience, legal compliance, public

- **Performance:** cost:low|drivers:none | **Accessibility:** risk:low|requires:contrast-text-4.5,keyboard,visible-focus,reduced-motion



### Colors

| Role | Hex | CSS Variable |

|------|-----|--------------|

| Primary | `#0F172A` | `--color-primary` |

| On Primary | `#FFFFFF` | `--color-on-primary` |

| Secondary | `#334155` | `--color-secondary` |

| On Secondary | `#FFFFFF` | `--color-on-secondary` |

| Accent/CTA | `#0369A1` | `--color-accent` |

| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |

| Background | `#F8FAFC` | `--color-background` |

| Foreground | `#020617` | `--color-foreground` |

| Card | `#FFFFFF` | `--color-card` |

| Card Foreground | `#020617` | `--color-card-foreground` |

| Muted | `#E8ECF1` | `--color-muted` |

| Muted Foreground | `#475569` | `--color-muted-foreground` |

| Border | `#E2E8F0` | `--color-border` |

| Destructive | `#DC2626` | `--color-destructive` |

| On Destructive | `#FFFFFF` | `--color-on-destructive` |

| Ring | `#0F172A` | `--color-ring` |



*Notes: High contrast navy + blue*



### Typography

- **Heading:** Atkinson Hyperlegible

- **Body:** Atkinson Hyperlegible

- **Mood:** accessible, readable, inclusive, WCAG, dyslexia-friendly, clear

- **Best For:** Accessibility-critical sites, government, healthcare, inclusive design

- **Google Fonts:** https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap

- **CSS Import:**

```css

@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap');

```



### Key Effects

Clear focus rings (3-4px), ARIA labels, skip links, responsive design, reduced motion, 44x44px touch targets



### Avoid (Anti-patterns)

- Ornate design

- Low contrast

- Motion effects

- AI purple/pink gradients



### Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)

- [ ] cursor-pointer on all clickable elements

- [ ] Hover states with smooth transitions (150-300ms)

- [ ] Light mode: text contrast 4.5:1 minimum

- [ ] Focus states visible for keyboard nav

- [ ] prefers-reduced-motion respected

- [ ] Responsive: 375px, 768px, 1024px, 1440px