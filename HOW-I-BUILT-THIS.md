# How I Built My Cinematic Portfolio

A behind-the-scenes, step-by-step guide of how this site was built: a personalized,
AI-assisted, production-deployed portfolio with scroll-driven motion and 3D backgrounds.

This guide is written so anyone can recreate the same result from zero. You do not need access
to my repository. Every step lists what to install, what to create, and what to run.

**The approach in one line:** scaffold a Next.js app with GSAP and Three.js, drive all content
from JSON, build a single-source design system, generate every image with Google Gemini and the
footer video with Google Veo, develop with Claude Code, then ship on Vercel.

---

## Prerequisites

Install these once:

- **Node.js 20 or newer** (this project uses Node 22). Check with `node -v`.
- **Git**. Check with `git --version`.
- A code editor (VS Code recommended).

Create these free accounts:

- **GitHub** (to store the code).
- **Vercel** (to host the site).
- **Google Gemini** access (to generate images).
- **Google Veo** access (to generate the footer video).
- **Claude Code** (to develop, optional but how this was built).

---

## 1. The Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, React Compiler) | Modern React 19, fast builds, first-class Vercel support |
| UI runtime | **React 19** | Latest concurrent React |
| Animation | **GSAP 3** with ScrollTrigger | Scroll-driven, frame-accurate cinematic motion |
| 3D / WebGL | **Three.js** | Particle fields, bokeh, and video textures behind sections |
| Styling | **CSS Modules** plus design tokens in `app/globals.css` | Scoped styles with one source of truth for the palette |
| Helpers | react-icons, clsx, tailwind-merge | Icons and small class utilities |
| Analytics | **@vercel/analytics** | Privacy-friendly traffic insight |
| Hosting | **Vercel** | Zero-config Next.js deploys with preview URLs |
| AI development | **Claude Code** | Pair-programmed every change |
| AI imagery | **Google Gemini** | Project thumbnails, profile avatar, section backgrounds |
| AI video | **Google Veo** | Ambient footer video |

---

## 2. Get a Base

You have two paths. Both end in the same place.

**Path A: start from an open-source template.** Building on a proven base is normal engineering
practice, and the value is in what you do with it. Clone any open-source Next.js portfolio that
already uses GSAP and Three.js (search GitHub for "nextjs gsap three portfolio"), then make it
your own.

```bash
git clone <template-repo-url> my-portfolio
cd my-portfolio
npm install
```

**Path B: start from zero.** Scaffold a fresh Next.js app and add the libraries yourself.

```bash
npx create-next-app@latest my-portfolio
# choose: App Router = yes, ESLint = yes, Tailwind optional
cd my-portfolio

npm install gsap three react-icons clsx tailwind-merge @vercel/analytics
```

Run the dev server to confirm everything works:

```bash
npm run dev          # opens http://localhost:3000
```

From here, everything below is what turns a blank base into the finished portfolio.

---

## 3. Drive All Content From JSON

Keep nothing personal hardcoded inside components. Put every name, role, and link in data files,
so re-skinning the whole site later is just editing JSON.

Create a `data/` folder with two files:

- `data/profile.json`: name, role, bio, stats, skills, experience, projects, publications, socials.
- `data/content.json`: static section copy such as the footer call-to-action and labels.

```jsonc
// data/profile.json (shape to copy)
{
  "name":  { "first": "Your", "last": "Name", "full": "Your Name" },
  "email": "you@example.com",
  "roles": { "short": "Your Role or Title" },
  "stats": [
    { "value": "5+",  "label": "Years Experience" },
    { "value": "10+", "label": "Projects Shipped" }
  ],
  "skills":       ["Skill A", "Skill B", "Skill C"],
  "experience":   [ { "role": "...", "company": "...", "period": "...", "bullets": ["..."] } ],
  "projects":     [ { "title": "...", "subtitle": "...", "image": "/assets/project-1.png", "tech": ["..."], "link": "..." } ],
  "publications": [ { "title": "...", "platform": "...", "year": "2024", "link": "..." } ],
  "socials":      [ { "label": "GitHub", "href": "https://github.com/your-username" } ]
}
```

In components, import the data instead of typing text:

```jsx
import profile from '@/data/profile.json'
// ...
<h1>{profile.name.full}</h1>
```

Tip: keeping content in JSON means a future redesign never touches your resume data.

---

## 4. Build the Design System

Define your palette once as CSS custom properties in `app/globals.css`, then reference those
tokens everywhere through CSS Modules. Changing the brand becomes a single-file edit.

```css
/* app/globals.css: the single source of truth */
:root {
  --hero-start: #f4d2f0;  --hero-mid: #cf7ad9;  --hero-end: #6d28d9;
  --accent: #c026d3;      --accent-hover: #a21caf;
  --surface-black: #15111d;
  --text-on-dark: #f5f5f5;
}
```

```css
/* any component module, e.g. styles/sections/Hero.module.css */
.button { background: var(--accent); }
.button:hover { background: var(--accent-hover); }
```

This site uses a magenta to purple palette on a deep-plum background. Pick your own values and
every section, glow, and particle color follows automatically.

---

## 5. Lay Out the Sections and 3D Scenes

Organize the page as a stack of full-height sections, each with its own CSS Module:

- One component per section under `components/sections/` (Hero, About, Projects, Experience,
  Publications, Footer, and so on).
- One WebGL scene per visual under `components/three/` (particle fields, bokeh, video textures).
- A single `app/page.js` that renders the sections in order and controls scrolling.

Three.js scenes use browser-only APIs, so load them client-side only:

```jsx
import dynamic from 'next/dynamic'
const HeroBackground = dynamic(() => import('@/components/three/HeroBackground'), { ssr: false })
```

Register GSAP and ScrollTrigger once in a small helper (`lib/gsap.js`) and import GSAP from there
so the plugin is always registered:

```js
// lib/gsap.js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }
```

Scrolling is controlled in code (a section-by-section snap that animates `scrollTop` with GSAP),
not native CSS scroll-snap, which keeps the motion consistent across devices.

---

## 6. Generate the Images With Gemini

Every image is AI-generated to match the palette. Write tight, reusable prompts, generate them in
Google Gemini, then save the files into `public/assets/` using the exact names your code expects
(for example `project-1.png`, `about.webp`, `work-experience.png`).

Append this shared palette line to every prompt so the set stays consistent:

`deep plum-black #1a1024, violet #6d28d9, magenta #c026d3, soft orchid/pink #d45ad9 / #f0abfc, no text, no logos`

**Project thumbnail (example):**
> Cinematic 3D product concept of your app: a softly glowing focal element surrounded by floating
> translucent UI panels (charts, graphs, meshes), magenta and violet palette over deep plum-black
> #1a1024, premium render, dark uncluttered left side for text overlay, 16:9. No legible text, no logos.

**Profile avatar (circular):**
> A clean circular-profile headshot framed shoulders-up and centered, on a smooth magenta to
> violet gradient (deep plum #1a1024 to magenta #c026d3) with soft orchid rim lighting, square 1:1
> so it crops cleanly into a circle. No text, no logos.

**Aspect ratios to request:** profile 1:1, project and background images 16:9, footer 4:3,
mobile footer 9:16. `next/image` covers and crops, so small mismatches are fine.

Workflow note: the Next.js dev image cache (`.next/dev/cache/images`) can keep serving an old
picture after you overwrite a file with the same name. Hard-refresh the browser (Cmd+Shift+R or
Ctrl+Shift+R). If it still shows the old image, delete that cache folder and reload.

---

## 7. Generate the Footer Video With Veo

Generate the ambient loop in Google Veo, then save it as `public/assets/footer-video.mp4`. Play
it directly as the footer background with a plain HTML video element (autoplay, muted, looping,
playsInline), with no shader and no effects.

**Veo prompt:**
> Cinematic abstract ambient loop: slow-drifting volumetric light and soft glowing particles in
> deep plum-black darkness, with gentle aurora-like ribbons of magenta and violet light undulating
> very slowly. Locked camera, almost imperceptible slow push-in. Brightest in the center, naturally
> dark at the edges. Seamless loop where the last frame matches the first. 16:9, 8 seconds. No
> text, no people.

```jsx
<video src="/assets/footer-video.mp4" autoPlay muted loop playsInline />
```

A muted, inline video autoplays in modern browsers, including mobile, so no JavaScript is needed
to start it.

---

## 8. Develop With Claude Code

Claude Code was used as a pair programmer for the entire customization. A productive loop is:
describe the change in plain language, let it edit the files, then refresh and review.

Representative work on this build:

- Re-themed the whole site to a new palette by editing the design tokens in one file.
- Redesigned the hero: removed the stock photo, moved the tagline under the name, widened the layout.
- Redesigned the about section: a circular profile avatar with a subtle Three.js bokeh background.
- Built custom Three.js scenes loaded client-side only with `dynamic(..., { ssr: false })`.
- Built the section-by-section snap scroll system with GSAP.
- Simplified the ending so the publications screen flows straight into the footer video.
- Debugged a "missing" image that turned out to be a stale image cache, not a broken file.

Helpful habit: keep a short rules file (this repo uses `AGENTS.md` and `CLAUDE.md`) listing your
conventions, for example "CSS Modules only," "palette tokens live in globals.css," "Three.js is
client-only," and "all content lives in profile.json." It keeps the AI consistent across sessions.

---

## 9. Build and Verify Locally

```bash
npm run build        # production build, catches type, lint, and route issues
npm run start        # serve the production build at http://localhost:3000
npm run lint         # eslint
```

Walk through every section at both desktop and mobile widths before you ship. Resize the browser
or use the device toolbar in dev tools.

---

## 10. Deploy to Vercel

First publish the code to your own GitHub account, then connect that repository to Vercel.

```bash
# create an empty repo on github.com first, for example your-username/portfolio, then:
git remote set-url origin https://github.com/your-username/portfolio.git   # or: git remote add origin <url>
git add -A
git commit -m "Personalized cinematic portfolio"
git branch -M main
git push -u origin main
```

Then on vercel.com:

1. Click **Add New** then **Project**, and import your GitHub repository.
2. The framework preset auto-detects **Next.js**, so no configuration is needed. The build command
   is `next build` and the output is handled automatically.
3. Add environment variables only if you introduce any. The base site needs none.
4. Click **Deploy**. You get a `your-project.vercel.app` URL in about a minute. After this, every
   push to a branch creates a preview deployment, and every push to `main` updates production.
5. Optional: open **Project**, then **Domains**, to attach a custom domain.

Because `@vercel/analytics` is installed and rendered in the layout, traffic appears in the Vercel
dashboard automatically.

---

## 11. Project Map

```
app/
  globals.css        # design tokens, the palette lives here
  layout.js          # metadata, fonts, analytics
  page.js            # section order and snap-scroll navigation
components/
  sections/          # Hero, About, Projects, Experience, Publications, Footer
  three/             # WebGL scenes, client-only
  ui/                # Navbar and small UI pieces
data/
  profile.json       # all personal content
  content.json       # static section copy
public/assets/       # AI-generated images and the footer video
styles/sections/     # one CSS Module per section
lib/
  gsap.js            # GSAP and ScrollTrigger registration
  siteConfig.js      # site URL for metadata and structured data
```

---

## Summary

Scaffold a Next.js app with GSAP and Three.js, drive all content from JSON, define the palette
once as design tokens, generate every image with Gemini and the footer loop with Veo, develop the
sections and motion with Claude Code, verify locally, then push to GitHub and deploy on Vercel.
Anyone can follow these steps to build the same kind of site from scratch.
