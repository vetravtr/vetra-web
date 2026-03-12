# Fintech Asset Web

A premium, high-performance landing page for a Fintech Asset management platform, built with Astro and Tailwind CSS.

## 🚀 Technologies

- **Astro** 5.15.5 - Modern web framework with Server-Side Rendering (SSR).
- **@astrojs/node** - Node.js serving adapter.
- **Tailwind CSS** 4.1.17 - Utility-first CSS framework (v4 alpha).
- **TypeScript** - Static typing for safer code.
- **GSAP** - GreenSock Animation Platform for complex animations.
- **Lenis** - Smooth scrolling library.
- **@fontsource** - Self-hosted fonts for better privacy and performance.

## ✨ Features

- **Performance First**: 
    - **Self-hosted Fonts**: Zero layout shift and privacy-friendly.
    - **Smart Loading**: Dynamic imports for heavy scripts (GSAP, ScrollTrigger).
    - **Mobile Optimized**: Heavy animations are completely disabled on mobile devices to save bandwidth.
- **Dynamic Real-Time Reserves**: Fetches data from an external API with a Next.js-style proxy to handle CORS, featuring loading skeletons.
- **Interactive Whitepaper**: A dedicated page with a sticky sidebar navigation and responsive tabbed content.
- **Video Backgrounds**: Implemented in the Newsletter section for visual engagement.
- **Partner Carousel**: Infinite scrolling marquee of SVGs using standard CSS animations.
- **Premium UI/UX**:
    - **Glassmorphism** & **Glow Effects** (PulseGlow).
    - **Custom Design System** via CSS variables.
    - **Responsive Design** optimized for desktop and mobile.
- **SEO Optimized**: Semantic HTML, proper meta tags, and structured data.

## 📁 Project Structure

```
/
├── public/          # Static assets
├── src/
│   ├── assets/      # Optimized images and icons
│   ├── components/  # Reusable UI components
│   │   ├── common/  # Global components (Header, Footer, Button)
│   │   └── sections/# Page sections (Hero, RealTimeReserves, WhitepaperContent)
│   ├── layouts/     # Page layouts (Layout.astro, SectionLayout.astro)
│   ├── pages/       # Application routes
│   │   ├── api/     # API routes (e.g., for proxying external requests)
│   │   ├── index.astro
│   │   ├── contact-us.astro
│   │   └── whitepaper.astro
│   ├── styles/      # Global styles and CSS variables
│   └── utils/       # Helper functions (cn.ts)
└── package.json
```

## 🧞 Commands

All commands are run from the project root:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Generates production build in `./dist/`          |
| `npm run preview`         | Preview locally before deploying                 |

## 🎨 Key Components

- **AlignmentLayout**: standardized layout wrapper for consistent spacing.
- **SectionLayout**: Base wrapper for page sections.
- **Badge**: Decorative pill/badge component.
- **Button**: Primary and Outline button variants with hover effects.
- **Title / Description**: Standardized typography components.
- **PulseGlow**: Visual effect component for background glows.

## 📱 Responsiveness

The project uses Tailwind CSS standard breakpoints, with specific attention to mobile (`max-sm`) and desktop (`lg`) layouts.

## 🚀 Deployment

## 🚀 Deployment

This project uses the **Vercel Adapter** for server-side rendering of API routes.

### Recommended Hosting: Vercel

1.  Push your code to a Git repository (GitHub/GitLab/Bitbucket).
2.  Import the project into Vercel.
3.  Vercel will automatically detect Astro.
4.  **Important**: Add the Environment Variables in the Vercel Dashboard ("Settings" -> "Environment Variables").

### Environment Variables

| Variable | Description |
| :--- | :--- |
| `BREVO_API_KEY` | API Key from Brevo (Sendinblue) |
| `BREVO_LIST_ID` | (Optional) List ID to add contacts to. Default: 2 |
| `FORM_ID` | Form ID from Formspree |

### Build command (if running manually)
```bash
npm run build
```
The output will be in `.vercel/output`.



## 🔗 Useful Links

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [GSAP Documentation](https://greensock.com/docs/)
