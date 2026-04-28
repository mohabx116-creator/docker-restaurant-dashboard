---
name: Premium Restaurant SaaS
colors:
  surface: '#fbf8ff'
  surface-dim: '#dbd9e1'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fb'
  surface-container: '#efecf5'
  surface-container-high: '#eae7ef'
  surface-container-highest: '#e4e1ea'
  on-surface: '#1b1b21'
  on-surface-variant: '#454652'
  inverse-surface: '#303036'
  inverse-on-surface: '#f2eff8'
  outline: '#767683'
  outline-variant: '#c6c5d4'
  surface-tint: '#4c56af'
  primary: '#000666'
  on-primary: '#ffffff'
  primary-container: '#1a237e'
  on-primary-container: '#8690ee'
  inverse-primary: '#bdc2ff'
  secondary: '#006e1c'
  on-secondary: '#ffffff'
  secondary-container: '#91f78e'
  on-secondary-container: '#00731e'
  tertiary: '#380b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c1800'
  on-tertiary-container: '#e17c5a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#343d96'
  secondary-fixed: '#94f990'
  secondary-fixed-dim: '#78dc77'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005313'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#7b2e12'
  background: '#fbf8ff'
  on-background: '#1b1b21'
  surface-variant: '#e4e1ea'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
  kpi-value:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  sidebar_width: 260px
  gutter: 24px
  card_padding: 20px
  container_margin: 32px
---

## Brand & Style
The design system is engineered to evoke a sense of high-end hospitality management and operational excellence. It targets restaurant owners and executive chefs who require a tool that feels as sophisticated and organized as their front-of-house service. 

The aesthetic follows a **Corporate / Modern** direction, drawing inspiration from high-performance administrative dashboards. It prioritizes clarity, systematic organization, and a "calm" interface that reduces cognitive load during busy kitchen or floor hours. The visual language balances the authority of deep navy tones with the breathability of vast white space and soft gray transitions.

## Colors
The color palette is anchored by a deep navy primary, reserved for structural elements like the sidebar to provide a strong visual frame. The content area uses a "Paper" strategy: white surfaces sitting atop a soft gray background to define workspace boundaries clearly.

Semantic colors are strictly regulated:
- **Primary (Navy):** Used for navigation, core branding, and primary action emphasis.
- **Success (Green):** Used for completed orders, positive revenue trends, and active status.
- **Warning (Amber):** Specific to "Pending" or "Preparing" states that require attention.
- **Error (Red):** Reserved for "Cancelled" orders, stock alerts, or critical system errors.

## Typography
This design system utilizes **Inter** across all levels to ensure maximum legibility and a systematic, tech-forward feel. The hierarchy is established through significant weight changes rather than extreme size shifts. 

Headlines use a tighter letter-spacing to maintain a "premium" editorial feel, while labels and status badges use slightly increased tracking and semi-bold weights to remain legible at small scales. Body text is optimized for long-form data entry and table reading.

## Layout & Spacing
The layout employs a **Fluid Grid** for the main content area, paired with a **Fixed Sidebar**. This ensures that the dashboard remains functional across varying screen sizes while maintaining a consistent navigation anchor. 

A strict 8px rhythm governs all spacing. Main content containers feature a 32px margin from the screen edges, while internal card components use 20px or 24px padding to ensure data does not feel cramped. Layouts should utilize a 12-column system for dashboard widgets, allowing cards to span 3, 4, 6, or 12 columns depending on data density.

## Elevation & Depth
The design system uses **Ambient Shadows** and **Tonal Layers** to create a sense of organized hierarchy. 

The sidebar and background sit at the lowest level (Level 0). Cards and main content containers sit at Level 1, utilizing a soft, diffused shadow (`0px 4px 20px rgba(0, 0, 0, 0.05)`) to lift them off the gray background. Hover states on interactive elements like KPI cards or buttons trigger a Level 2 elevation with a slightly deeper shadow and subtle Y-axis translation. Outlines are kept extremely light (#E0E0E0) to define borders without adding visual noise.

## Shapes
The shape language is defined by **Rounded** corners to soften the professional aesthetic and make the SaaS feel approachable. 

The standard corner radius is 8px for smaller components like input fields and buttons. Larger "Soft Cards" and modal containers utilize a 12px radius. Status badges and tags utilize a fully rounded (pill) shape to distinguish them from interactive buttons.

## Components

### Sidebar & Navigation
The sidebar uses the primary navy background. Nav items feature a transparent background in their default state, transitioning to a subtle white opacity (10%) or a solid accent stripe on the left when active. Icons should be "Duotone" or "Light" stroke styles for a premium feel.

### Status Badges
Badges are used to signify order and table status. They use a low-opacity background of the semantic color (e.g., 10% Green) with high-contrast bold text of the same color. 
- **Pending:** Amber
- **Preparing:** Primary Navy or Blue
- **Completed:** Success Green
- **Cancelled:** Danger Red

### KPI Cards
These are the focal point of the dashboard. They must include:
1.  A descriptive label (Label-sm).
2.  A prominent value (KPI-value).
3.  A trend indicator (e.g., "+12% vs last week") using success/danger colors.
4.  A subtle background sparkline (optional) to show movement.

### Premium CTA & Inputs
Buttons feature an 8px radius with a slight gradient or solid navy fill. "Premium" actions (like "Export Report") can utilize a subtle shadow to emphasize importance. Form fields use a soft gray fill (#F9FAFB) with a 1px border that shifts to the primary navy on focus.

### Tables & Lists
Tables should be clean with no vertical borders. Horizontal dividers should be 1px wide in a very light gray. Header rows use a light gray background (#F4F6F8) and uppercase labels for clear distinction from data rows.