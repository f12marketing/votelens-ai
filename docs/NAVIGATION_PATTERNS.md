# Navigation Design Patterns

## Overview

Navigation patterns for VoteLens AI following the design system principles: modern intelligence platform, minimal professional UI, and insight-first design.

## Sidebar Design

### Structure

```
┌─────────────────────────┐
│  Logo Section          │  (height: 64px)
├─────────────────────────┤
│  Navigation Items     │  (scrollable)
│  - Dashboard           │
│  - Upload              │
│  - Constituencies      │
│  - Insights            │
│  - Ask AI              │
│  - Reports             │
│  - Admin               │
├─────────────────────────┤
│  User Section          │  (bottom, height: 64px)
└─────────────────────────┘
```

### Dimensions

**Desktop (≥1024px):**
- Width: 256px
- Height: 100vh
- Position: Fixed, left: 0, top: 64px (below navbar)
- Z-index: 10

**Tablet (768px - 1023px):**
- Width: 64px (collapsed)
- Height: 100vh
- Position: Fixed, left: 0, top: 64px
- Z-index: 10

**Mobile (<768px):**
- Hidden by default
- Drawer overlay when open
- Width: 280px
- Z-index: 50

### Navigation Items

**Default State:**
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  color: hsl(var(--text-secondary));
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 150ms ease;
  cursor: pointer;
}
```

**Hover State:**
```css
.nav-item:hover {
  background: hsl(var(--background-tertiary));
  color: hsl(var(--text-primary));
}
```

**Active State:**
```css
.nav-item-active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

**Collapsed State (Tablet):**
```css
.nav-item-collapsed {
  width: 64px;
  padding: 0.75rem;
  justify-content: center;
}
```

### Navigation Item Structure

```tsx
<div className="nav-item">
  <Icon className="h-5 w-5" />
  <span className="nav-item-label">Label</span>
</div>
```

### Logo Section

```css
.logo-section {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  border-bottom: 1px solid hsl(var(--border-subtle));
}
```

```tsx
<div className="logo-section">
  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
    <span className="text-sm font-bold text-primary-foreground">VL</span>
  </div>
  <span className="ml-2 text-lg font-bold text-text-primary">VoteLens</span>
</div>
```

### User Section (Bottom)

```css
.user-section {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  border-top: 1px solid hsl(var(--border-subtle));
  margin-top: auto;
}
```

```tsx
<div className="user-section">
  <div className="h-8 w-8 rounded-full bg-background-tertiary flex items-center justify-center">
    <span className="text-sm font-medium text-text-secondary">JD</span>
  </div>
  <div className="ml-3 flex-1">
    <p className="text-sm font-medium text-text-primary">John Doe</p>
    <p className="text-xs text-text-muted">Admin</p>
  </div>
</div>
```

### Responsive Behavior

**Mobile:**
- Sidebar hidden by default
- Hamburger menu in navbar toggles drawer
- Backdrop overlay when drawer open
- Swipe to close gesture

**Tablet:**
- Sidebar collapsed to icon-only view
- Tooltip on hover shows full label
- Expand button to show full sidebar

**Desktop:**
- Full sidebar always visible
- No collapse behavior
- Active item highlighted

## Navbar Design

### Structure

```
┌─────────────────────────────────────────────────────────┐
│  Logo  |  Breadcrumb  |  Search  |  Actions  |  User   │
└─────────────────────────────────────────────────────────┘
```

### Dimensions

**All Viewports:**
- Height: 64px
- Position: Fixed, top: 0, left: 0, right: 0
- Z-index: 20
- Padding: 0 1.5rem

### Background

```css
.navbar {
  height: 64px;
  background: hsl(var(--background-primary) / 95%);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid hsl(var(--border-subtle));
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  padding: 0 1.5rem;
}
```

### Logo Component

```tsx
<div className="flex items-center gap-2">
  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
    <span className="text-sm font-bold text-primary-foreground">VL</span>
  </div>
  <span className="text-lg font-bold text-text-primary">VoteLens</span>
</div>
```

### Breadcrumb

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: hsl(var(--text-muted));
  font-size: 0.875rem;
}

.breadcrumb-item {
  color: hsl(var(--text-secondary));
  transition: color 150ms ease;
}

.breadcrumb-item:hover {
  color: hsl(var(--text-primary));
}

.breadcrumb-separator {
  color: hsl(var(--text-muted));
}
```

```tsx
<nav className="breadcrumb">
  <span className="breadcrumb-item">Dashboard</span>
  <span className="breadcrumb-separator">/</span>
  <span className="breadcrumb-item">Insights</span>
  <span className="breadcrumb-separator">/</span>
  <span className="breadcrumb-item font-medium text-text-primary">Trend Analysis</span>
</nav>
```

### Search Input

```css
.search-input {
  position: relative;
  width: 300px;
}

.search-input input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid hsl(var(--border-subtle));
  border-radius: 6px;
  background: hsl(var(--background-secondary));
  font-size: 0.875rem;
  transition: all 150ms ease;
}

.search-input input:focus {
  border-color: hsl(var(--primary));
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--primary-subtle));
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: hsl(var(--text-muted));
  pointer-events: none;
}
```

```tsx
<div className="search-input">
  <Search className="search-icon h-4 w-4" />
  <input type="text" placeholder="Search..." />
</div>
```

### Action Buttons

```css
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid hsl(var(--border-subtle));
  background: transparent;
  color: hsl(var(--text-secondary));
  transition: all 150ms ease;
  cursor: pointer;
}

.action-button:hover {
  background: hsl(var(--background-tertiary));
  color: hsl(var(--text-primary));
  border-color: hsl(var(--border-default));
}
```

```tsx
<div className="navbar-actions">
  <button className="action-button" aria-label="Notifications">
    <Bell className="h-4 w-4" />
  </button>
  <button className="action-button" aria-label="Settings">
    <Settings className="h-4 w-4" />
  </button>
</div>
```

### User Menu

```css
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background 150ms ease;
}

.user-menu:hover {
  background: hsl(var(--background-tertiary));
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: hsl(var(--background-tertiary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--text-secondary));
  font-size: 0.875rem;
  font-weight: 500;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--text-primary));
}

.user-role {
  font-size: 0.75rem;
  color: hsl(var(--text-muted));
}
```

```tsx
<div className="user-menu">
  <div className="user-avatar">JD</div>
  <div className="user-info">
    <span className="user-name">John Doe</span>
    <span className="user-role">Admin</span>
  </div>
  <ChevronDown className="h-4 w-4 text-text-muted" />
</div>
```

### Theme Toggle

```css
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid hsl(var(--border-subtle));
  background: transparent;
  color: hsl(var(--text-secondary));
  transition: all 150ms ease;
  cursor: pointer;
}

.theme-toggle:hover {
  background: hsl(var(--background-tertiary));
  color: hsl(var(--text-primary));
}
```

```tsx
<button className="theme-toggle" aria-label="Toggle theme">
  <Sun className="h-4 w-4" />
</button>
```

### Hamburger Menu (Mobile)

```css
.hamburger {
  display: none;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: hsl(var(--text-secondary));
  cursor: pointer;
}

@media (max-width: 767px) {
  .hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

```tsx
<button className="hamburger" aria-label="Toggle menu">
  <Menu className="h-6 w-6" />
</button>
```

## Responsive Layout Patterns

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────┐
│  Navbar (64px)                                      │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │  Main Content                            │
│ (256px)  │  (flex-1)                               │
│          │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Tablet Layout (768px - 1023px)

```
┌─────────────────────────────────────────────────────┐
│  Navbar (64px)                                      │
├────────┬────────────────────────────────────────────┤
│        │                                            │
│ Sidebar│  Main Content                              │
│ (64px) │  (flex-1)                                 │
│        │                                            │
│        │                                            │
└────────┴────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

```
┌─────────────────────────────────────────────────────┐
│  Navbar (64px)                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Main Content                                       │
│  (full width)                                       │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘

Sidebar as drawer overlay when toggled.
```

## Animation Guidelines

### Sidebar Animations

**Desktop/Tablet:**
- No slide animation (always visible)
- Hover states: 150ms ease

**Mobile Drawer:**
- Slide in from left: 300ms ease-out
- Backdrop fade: 200ms ease-in
- Swipe gesture: follows finger position

### Navbar Animations

- Hover states: 150ms ease
- Dropdown menus: 200ms ease-out
- Backdrop blur: instant

### Transitions

```css
/* Hover transitions */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Focus transitions */
transition: border-color 150ms ease, box-shadow 150ms ease;

/* Drawer slide */
transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
```

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate through navigation items
- **Enter/Space**: Activate navigation item
- **Escape**: Close dropdowns/drawers
- **Arrow Keys**: Navigate within dropdowns

### Focus States

```css
.nav-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--primary));
}

.action-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--primary));
}
```

### ARIA Labels

```tsx
<button aria-label="Toggle sidebar">
  <Menu className="h-6 w-6" />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

<button aria-label="Toggle theme">
  <Sun className="h-4 w-4" />
</button>
```

### Screen Reader Support

```tsx
<nav aria-label="Main navigation">
  <ul role="list">
    <li>
      <a href="/dashboard" aria-current="page">Dashboard</a>
    </li>
    <li>
      <a href="/upload">Upload</a>
    </li>
  </ul>
</nav>
```

## Usage Examples

### Basic Sidebar Implementation

```tsx
import { LayoutDashboard, Upload, Map, Brain, MessageSquare, FileText, Shield } from "lucide-react";

const navigationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Upload, label: "Upload", href: "/upload" },
  { icon: Map, label: "Constituencies", href: "/constituencies" },
  { icon: Brain, label: "Insights", href: "/insights" },
  { icon: MessageSquare, label: "Ask AI", href: "/ask-ai" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Shield, label: "Admin", href: "/admin" },
];

function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">VL</span>
        </div>
        <span className="ml-2 text-lg font-bold text-text-primary">VoteLens</span>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="nav-item-label">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="user-section">
        <div className="h-8 w-8 rounded-full bg-background-tertiary flex items-center justify-center">
          <span className="text-sm font-medium text-text-secondary">JD</span>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-text-primary">John Doe</p>
          <p className="text-xs text-text-muted">Admin</p>
        </div>
      </div>
    </aside>
  );
}
```

### Basic Navbar Implementation

```tsx
import { Search, Bell, Settings, Sun, Moon, ChevronDown, Menu } from "lucide-react";

function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="flex items-center gap-4">
        <button
          className="hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">VL</span>
          </div>
          <span className="text-lg font-bold text-text-primary">VoteLens</span>
        </div>
      </div>

      <nav className="breadcrumb hidden md:flex">
        <span className="breadcrumb-item">Dashboard</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item">Insights</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="search-input hidden lg:block">
          <Search className="search-icon h-4 w-4" />
          <input type="text" placeholder="Search..." />
        </div>

        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <button className="action-button" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          
          <button className="action-button" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="user-menu">
          <div className="user-avatar">JD</div>
          <div className="user-info hidden sm:block">
            <span className="user-name">John Doe</span>
            <span className="user-role">Admin</span>
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </div>
      </div>
    </header>
  );
}
```

## Best Practices

### Navigation Hierarchy

1. **Primary Navigation**: Main app sections (Dashboard, Insights, etc.)
2. **Secondary Navigation**: Sub-sections within primary sections
3. **Tertiary Navigation**: Filters, sorting, and context-specific actions

### Active State Management

- Highlight the current page in sidebar
- Update breadcrumb based on current route
- Maintain scroll position on navigation

### Performance

- Use CSS transforms for animations (GPU accelerated)
- Avoid layout thrashing during transitions
- Debounce search input
- Lazy load navigation items for large menus

### Mobile Considerations

- Touch targets minimum 44x44px
- Swipe gestures for drawer
- Haptic feedback for actions
- Prevent scroll on drawer when open
