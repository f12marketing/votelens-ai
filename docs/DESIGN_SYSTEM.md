# VoteLens AI Design System

## Overview

A modern, minimal design system for an AI-powered election intelligence platform. The design emphasizes clarity, readability, and insight-first presentation of data.

## Design Philosophy

**Core Principles:**
- **Insight-First**: Data and insights take precedence over decorative elements
- **Minimal Professional**: Clean, uncluttered interface with purposeful use of color
- **Analytical Clarity**: Information density without overwhelming the user
- **Modern Intelligence**: Contemporary aesthetic inspired by financial terminals and AI interfaces

## Color Palette

### Neutral Backgrounds

```css
--background-primary: 0 0% 100%;      /* #FFFFFF */
--background-secondary: 0 0% 98%;    /* #FAFAFA */
--background-tertiary: 0 0% 96%;     /* #F5F5F5 */
--background-elevated: 0 0% 100%;     /* #FFFFFF with shadow */
--background-overlay: 0 0% 0% / 80%;  /* Dark overlay */
```

### Dark Mode Backgrounds

```css
--background-primary: 222 47% 11%;   /* #1A1F2E */
--background-secondary: 222 47% 14%; /* #1E2436 */
--background-tertiary: 222 47% 17%;  /* #22293D */
--background-elevated: 222 47% 20%;  /* #262E44 */
```

### Accent Colors (Limited Palette)

```css
/* Primary - Brand Blue */
--primary: 221 83% 53%;              /* #3B82F6 */
--primary-hover: 221 83% 48%;         /* #2563EB */
--primary-subtle: 221 83% 97%;        /* #EFF6FF */

/* Success - Green */
--success: 142 76% 36%;               /* #22C55E */
--success-subtle: 142 76% 96%;        /* #DCFCE7 */

/* Warning - Amber */
--warning: 38 92% 50%;               /* #F59E0B */
--warning-subtle: 38 92% 96%;         /* #FEF3C7 */

/* Error - Red */
--error: 0 84% 60%;                  /* #EF4444 */
--error-subtle: 0 84% 96%;            /* #FEE2E2 */

/* AI Accent - Purple */
--ai-accent: 263 70% 50%;            /* #8B5CF6 */
--ai-accent-subtle: 263 70% 96%;      /* #EDE9FE */

/* Insight Categories */
--insight-trend: 142 76% 36%;         /* Green for trends */
--insight-anomaly: 38 92% 50%;        /* Amber for anomalies */
--insight-prediction: 263 70% 50%;    /* Purple for predictions */
--insight-demographic: 221 83% 53%;   /* Blue for demographics */
```

### Text Colors

```css
--text-primary: 222 47% 11%;         /* #1A1F2E */
--text-secondary: 215 16% 47%;        /* #475569 */
--text-tertiary: 215 16% 65%;         /* #64748B */
--text-muted: 215 16% 80%;            /* #94A3B8 */
--text-disabled: 215 16% 90%;        /* #CBD5E1 */

/* Dark Mode */
--text-primary: 0 0% 100%;            /* #FFFFFF */
--text-secondary: 0 0% 80%;           /* #E2E8F0 */
--text-tertiary: 0 0% 65%;            /* #94A3B8 */
--text-muted: 0 0% 50%;               /* #64748B */
```

### Border Colors

```css
--border-subtle: 215 16% 90%;         /* #E2E8F0 */
--border-default: 215 16% 80%;        /* #CBD5E1 */
--border-strong: 215 16% 65%;         /* #64748B */

/* Dark Mode */
--border-subtle: 215 16% 25%;         /* #334155 */
--border-default: 215 16% 30%;        /* #475569 */
--border-strong: 215 16% 40%;         /* #64748B */
```

## Typography System

### Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-display: 'Inter', sans-serif;
```

### Type Scale

```css
/* Display */
--text-display-xl: 4.5rem;     /* 72px - Hero titles */
--text-display-lg: 3.75rem;    /* 60px - Large headlines */
--text-display-md: 3rem;       /* 48px - Page titles */
--text-display-sm: 2.25rem;    /* 36px - Section headers */

/* Heading */
--text-h1: 2rem;               /* 32px - Main headings */
--text-h2: 1.5rem;             /* 24px - Subheadings */
--text-h3: 1.25rem;            /* 20px - Card titles */
--text-h4: 1.125rem;           /* 18px - Small headings */

/* Body */
--text-lg: 1.125rem;           /* 18px - Large body */
--text-base: 1rem;             /* 16px - Default body */
--text-sm: 0.875rem;           /* 14px - Small body */
--text-xs: 0.75rem;            /* 12px - Labels, captions */

/* Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Typography Usage

- **Display**: Hero sections, landing page titles
- **H1**: Page titles
- **H2**: Section headers
- **H3**: Card titles, widget headers
- **H4**: Subsection headers
- **Body**: Content text, descriptions
- **Small**: Metadata, timestamps, labels
- **Mono**: Data values, code, technical content

## Spacing System

### Scale

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Usage Guidelines

- **Tight spacing** (1-2): Labels, button padding, icon spacing
- **Normal spacing** (3-4): Card padding, form spacing
- **Comfortable spacing** (6-8): Section margins, grid gaps
- **Generous spacing** (12+): Page margins, major sections

## Card System

### Card Variants

**Default Card:**
```css
background: var(--background-elevated);
border: 1px solid var(--border-subtle);
border-radius: 8px;
padding: 1.5rem;
shadow: 0 1px 3px rgba(0,0,0,0.05);
```

**Interactive Card:**
```css
background: var(--background-elevated);
border: 1px solid var(--border-subtle);
border-radius: 8px;
padding: 1.5rem;
shadow: 0 1px 3px rgba(0,0,0,0.05);
transition: all 200ms ease;
hover-shadow: 0 4px 12px rgba(0,0,0,0.1);
hover-border: var(--primary);
```

**Insight Card:**
```css
background: var(--background-elevated);
border: 1px solid var(--border-subtle);
border-radius: 12px;
padding: 1.5rem;
shadow: 0 2px 8px rgba(0,0,0,0.06);
```

**Stat Card:**
```css
background: var(--background-elevated);
border: 1px solid var(--border-subtle);
border-radius: 8px;
padding: 1.25rem;
shadow: 0 1px 2px rgba(0,0,0,0.04);
```

### Card Components

**Header:**
- Title: text-h3, font-semibold, text-primary
- Subtitle: text-sm, text-secondary
- Icon: 32x32px, accent color

**Body:**
- Content: text-base, text-secondary
- Metrics: text-h2, font-bold, text-primary
- Labels: text-xs, text-muted, uppercase, tracking-wide

**Footer:**
- Actions: flex row, gap 2
- Metadata: text-xs, text-muted

## Table Styling

### Base Table

```css
background: var(--background-primary);
border-radius: 8px;
overflow: hidden;
border: 1px solid var(--border-subtle);
```

### Table Header

```css
background: var(--background-tertiary);
padding: 0.75rem 1rem;
border-bottom: 1px solid var(--border-subtle);
text: text-xs, font-semibold, uppercase, tracking-wide, text-secondary
```

### Table Row

```css
padding: 0.75rem 1rem;
border-bottom: 1px solid var(--border-subtle);
transition: background 150ms ease;
hover-background: var(--background-secondary)
```

### Table Cell

```css
text: text-sm, text-secondary
align: left
```

### Status Indicators

```css
/* Success */
background: var(--success-subtle);
text: var(--success);
border-radius: 9999px;
padding: 2px 8px;
text-xs, font-medium

/* Warning */
background: var(--warning-subtle);
text: var(--warning);
border-radius: 9999px;
padding: 2px 8px;
text-xs, font-medium

/* Error */
background: var(--error-subtle);
text: var(--error);
border-radius: 9999px;
padding: 2px 8px;
text-xs, font-medium
```

## AI Insight Cards

### Structure

```css
.ai-insight-card {
  background: var(--background-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
}
```

### Insight Types

**Trend Insight:**
- Icon: TrendingUp (green)
- Badge: Green background, green text
- Confidence: 0-100% scale
- Timestamp: text-xs, text-muted

**Anomaly Insight:**
- Icon: AlertTriangle (amber)
- Badge: Amber background, amber text
- Priority indicator
- Action required badge

**Prediction Insight:**
- Icon: Sparkles (purple)
- Badge: Purple background, purple text
- Probability score
- Confidence interval

**Demographic Insight:**
- Icon: Brain (blue)
- Badge: Blue background, blue text
- Data source indicator
- Sample size

### Confidence Indicator

```css
.confidence-bar {
  height: 4px;
  background: var(--background-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 300ms ease;
}
```

## Sidebar Design

### Structure

```css
.sidebar {
  width: 256px;
  height: 100vh;
  background: var(--background-primary);
  border-right: 1px solid var(--border-subtle);
  position: fixed;
  left: 0;
  top: 64px;
  z-index: 10;
  padding: 1rem;
}
```

### Navigation Items

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  text: text-sm, font-medium, text-secondary;
  transition: all 150ms ease;
}

.nav-item-active {
  background: var(--primary);
  text: text-primary-foreground;
}

.nav-item-hover {
  background: var(--background-tertiary);
  text: text-primary;
}
```

### Navigation States

- **Default**: text-secondary, transparent background
- **Hover**: text-primary, background-tertiary
- **Active**: text-primary-foreground, background-primary

## Navbar Design

### Structure

```css
.navbar {
  height: 64px;
  background: var(--background-primary) / 95%;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-subtle);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 0 1.5rem;
}
```

### Logo

```css
.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  text: text-primary-foreground, font-bold, text-sm
}

.logo-text {
  text: text-xl, font-bold, tracking-tight, text-primary
}
```

### User Actions

```css
.user-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--background-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  text: text-sm, font-medium, text-secondary
}
```

## Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-xs: 0;           /* 0px - 639px */
--breakpoint-sm: 640px;       /* 640px - 767px */
--breakpoint-md: 768px;       /* 768px - 1023px */
--breakpoint-lg: 1024px;      /* 1024px - 1279px */
--breakpoint-xl: 1280px;      /* 1280px - 1535px */
--breakpoint-2xl: 1536px;     /* 1536px+ */
```

### Responsive Behavior

**Sidebar:**
- Mobile: Hidden (hamburger menu)
- Tablet: Collapsed (icons only)
- Desktop: Full width

**Grid:**
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3-4 columns

**Cards:**
- Mobile: Full width
- Tablet: 2 columns
- Desktop: 3 columns

**Tables:**
- Mobile: Horizontal scroll
- Tablet: Full width
- Desktop: Full width

## Animation Guidelines

### Duration

```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Easing

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Animations

**Fade In:**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Slide Up:**
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Scale In:**
```css
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

**Shimmer:**
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

### Usage Guidelines

- **Hover States**: duration-fast, ease-default
- **Modal Transitions**: duration-normal, ease-in-out
- **Page Transitions**: duration-slow, ease-out
- **Loading States**: shimmer animation
- **Micro-interactions**: duration-fast, ease-out

## Chart Styling

### Chart Colors

```css
--chart-primary: var(--primary);
--chart-secondary: var(--ai-accent);
--chart-success: var(--success);
--chart-warning: var(--warning);
--chart-error: var(--error);
--chart-neutral: var(--text-secondary);
```

### Chart Grid

```css
.chart-grid {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
```

### Chart Tooltip

```css
.chart-tooltip {
  background: var(--background-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text: text-xs, text-secondary
}
```

## Component Examples

### Button

```css
.button-primary {
  background: var(--primary);
  color: var(--background-primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 150ms ease;
}

.button-primary-hover {
  background: var(--primary-hover);
}
```

### Input

```css
.input {
  background: var(--background-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: border-color 150ms ease;
}

.input-focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-subtle);
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-primary {
  background: var(--primary-subtle);
  color: var(--primary);
}
```

## Accessibility

### Color Contrast

- Text to background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

### Focus States

```css
.focus-ring {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-subtle);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Usage Guidelines

### When to Use Accent Colors

- **Primary**: Primary actions, CTAs, brand elements
- **Success**: Positive outcomes, completed states
- **Warning**: Caution, attention needed
- **Error**: Errors, destructive actions
- **AI Accent**: AI-related features, insights, predictions

### When to Use Neutrals

- **Backgrounds**: Page backgrounds, card backgrounds
- **Borders**: Separators, outlines
- **Text**: Body text, secondary information
- **Icons**: Functional icons, decorative elements

### Design Principles in Practice

1. **Hierarchy**: Use size, weight, and color to establish clear visual hierarchy
2. **Spacing**: Use consistent spacing to create rhythm and flow
3. **Contrast**: Ensure sufficient contrast for readability
4. **Simplicity**: Avoid unnecessary decoration; focus on content
5. **Consistency**: Apply patterns consistently across the interface
