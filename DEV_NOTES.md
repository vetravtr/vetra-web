# Development Notes - Fintech Asset Web

## 🏗️ Standards & Best Practices

### CSS Variables
This project uses a comprehensive system of CSS variables defined in `@/styles/global.css`.
**ALWAYS** use these variables instead of hardcoded hex values to ensure consistency.

**Examples:**
- Colors: `var(--color-background-card)`, `var(--color-text-secondary)`, `var(--color-glow-to-coin)`
- Fonts: `var(--font-sans)`, `var(--font-serif)`

### Component Reusability
Before creating a new UI element, check if it can be composed from existing components:
- `AlignmentLayout`: for horizontal centering and padding.
- `SectionLayout`: for vertical section spacing.
- `Title` / `Description`: for standard typography.
- `Button` / `Badge`: for interactive elements.

## 🏛️ Recent Architectural Decisions

### 1. API Proxy for CORS & Security (BFF Pattern)
To fetch data from external APIs without CORS issues or exposing API keys, we use an **Internal API Proxy** (`src/pages/api/...`).
- **Reserves**: Fetches from external financial API (server-side) to bypass CORS.
- **Newsletter**: Acts as a **BFF (Backend for Frontend)**. It securely holds the Brevo API Key on the server and exposes a simplified endpoint to the client. Matches the frontend's specific needs (email only) to the backend's complexity.


### 2. Assets Handling
- **Images**: Use `astro:assets` (`import myImg from '../assets/img.png'`) whenever possible for automatic optimization (WebP, resizing).
- **Backgrounds**: For usage in standard CSS `background-image`, access the `.src` property of the imported image: `start-${MyImage.src}`.

### 3. Whitepaper & Interactive Sections
- Complex interactive look & feel (tabs, sticky scroll) is implemented using vanilla JS where necessary (for now) or reactive setups.
- **Sticky Sidebar**: The Whitepaper sidebar uses `sticky top-24` but requires its parent container to share the full height of the content column (often achieved with grid or flex).

### 4. Performance Strategy
- **Fonts**: We use `@fontsource` to self-host fonts. This avoids extra DNS lookups to Google Fonts and improves FCP. Imports are done in the Layout frontmatter to ensure Vite bundles them correctly.
- **Heavy Scripts (GSAP/Lenis)**:
    - **Dynamic Import**: We use `await import('gsap')` inside `async` functions to load these libraries only after hydration, reducing TBT.
    - **Mobile Exclusion**: For extremely heavy logic (like GSAP ScrollTrigger in `WhyChooseVetra`), we wrap the import in a conditional check `if (!window.matchMedia("(min-width: 1024px)").matches) return;`. This prevents the library from even downloading on mobile devices.
- **Images**: LCP images (like the Hero background) use `loading="eager"` and `fetchpriority="high"`. Mobile-specific LCP images are also optimized this way.

## 🛠️ Troubleshooting & Tips

- **"Module not found"**: Check if you are importing from `@/components` vs `../components`. The project uses standard relative paths mostly, be consistent.
- **GSAP Context**: When using GSAP animations, ensure they are cleaned up or scoped correctly if we move to a SPA-like navigation (currently Multi-Page App, so less critical but good practice).
- **Mobile Images**: If images stretch on mobile, check `object-contain` vs `object-cover` and explicit height/width constraints in Tailwind.

## ⚠️ Checklist for New Pages
1. Create file in `src/pages/`.
2. Wrap content in `Layout`.
3. Use `SectionLayout` for main blocks.
4. Ensure `last-of-type` or similar CSS doesn't break footer spacing.
