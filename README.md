# DecoVision

> AI-powered interior design — redesign any room from a photo or a text description

DecoVision lets you transform any room using AI. Upload a photo and watch it get redesigned in your chosen style, or simply describe your dream space in text and let the AI build it from scratch. Every generated design is automatically scored for layout feasibility and environmental sustainability.

---

## Features

- **Two generation modes**
  - **Room Redesign** — upload a room photo and transform it into a new style
  - **Text-to-Design** — describe your ideal room and generate it from scratch
- **8 Design Themes** — Modern, Minimalist, Scandinavian, Industrial, Bohemian, Traditional, Coastal, Mid-Century Modern
- **7 Room Types** — Living Room, Bedroom, Bathroom, Kitchen, Dining Room, Home Office, Kids Room
- **Feasibility & Sustainability Scoring** — every design is analysed across 9 weighted factors covering room dimensions, furniture density, walkable clearance, lighting efficiency, and eco-friendly materials
- **Design Gallery** — all generated designs are automatically saved and browsable with download and delete support
- **Dark / Light / System theme** — full theme switching via next-themes
- **Responsive** — works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 + shadcn/ui + Radix UI |
| Styling | Tailwind CSS 4 |
| AI Image API | OpenAI gpt-image-1 |
| Language | TypeScript 5 |
| Runtime / Package Manager | Bun |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/HansithaReddy/DecoVision.git
cd DecoVision
```

### 2. Install Bun (if not already installed)

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 3. Install dependencies

```bash
bun install
```

### 4. Get an OpenAI API key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in and click **Create new secret key**
3. Copy the key — you won't be able to see it again

> Make sure your OpenAI account has access to the `gpt-image-1` model.

### 5. Set up environment variables

Create a `.env.local` file in the root of the project:

```env
OPENAI_API_KEY=sk-your-key-here
```

### 6. Run the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
DecoVision/
├── app/
│   ├── (main)/
│   │   ├── gallery/
│   │   │   └── page.tsx          # Gallery page
│   │   ├── layout.tsx            # Sidebar + header shell
│   │   └── page.tsx              # Main design page
│   ├── api/
│   │   ├── generate-design/
│   │   │   └── route.ts          # OpenAI image generation endpoint
│   │   └── predict-scores/
│   │       └── route.ts          # Feasibility & sustainability scoring endpoint
│   ├── globals.css
│   └── layout.tsx                # Root layout (fonts, theme, metadata)
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── app-sidebar.tsx           # Navigation sidebar (Design + Gallery)
│   ├── design-controls.tsx       # Theme/room selectors + Generate button
│   ├── image-dropzone.tsx        # Drag-and-drop room photo upload
│   ├── output-image.tsx          # AI-generated design display
│   ├── room-details-form.tsx     # Room dimensions, furniture, lighting inputs
│   ├── score-panel.tsx           # Feasibility & sustainability score display
│   ├── site-header.tsx           # Top header with sidebar toggle + theme switcher
│   ├── theme-provider.tsx        # next-themes provider
│   ├── theme-toggle.tsx          # Light / Dark / System toggle
│   └── uploaded-image.tsx        # Uploaded room photo preview
├── lib/
│   ├── constants.ts              # ROOM_TYPES, DESIGN_THEMES
│   ├── design-scorer.ts          # Scoring engine (feasibility + sustainability)
│   └── utils.ts                  # cn() class merge utility
├── types/
│   └── index.ts                  # Shared TypeScript types
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
└── vercel.json                   # Vercel deployment config
```

---

## How the Scoring Works

After every generation, DecoVision computes two scores between 0 and 100.

### Feasibility Score
Measures how practical the room layout is, based on 5 weighted factors:

| Factor | Weight | What it checks |
|---|---|---|
| Furniture Density | 35% | Total furniture footprint vs room area |
| Walking Clearance | 30% | Remaining floor space after furniture (min 20%) |
| Room Proportions | 15% | Aspect ratio — penalises very narrow rooms |
| Item Count | 10% | Number of items vs ideal (1 per 2.5 m²) |
| Design Intent | 10% | Keywords in prompt: "open plan", "cramped", etc. |

### Sustainability Score
Measures the environmental impact of the design, based on 4 weighted factors:

| Factor | Weight | What it checks |
|---|---|---|
| Material Eco-Score | 35% | Inferred from furniture names: bamboo/wood score high, plastic/PVC score low |
| Lighting Efficiency | 30% | Natural = 100%, LED = 85%, Fluorescent = 55%, Incandescent = 30% |
| Eco Design Intent | 25% | Keywords in prompt: "sustainable", "recycled", "biophilic", "eco-friendly" |
| Style Alignment | 10% | Minimalist/Scandinavian score high; Luxury/Industrial score lower |

Each score includes an expandable per-factor breakdown and a plain-language explanation.

---

## Usage

### Room Redesign Mode
1. Upload a photo of your room using the drag-and-drop zone
2. Choose a **Design Theme** and **Room Type**
3. Optionally add a description (e.g. "add more natural light")
4. Fill in room dimensions, furniture, and lighting for scoring
5. Click **Generate Design**
6. View the redesigned room alongside feasibility and sustainability scores

### Text-to-Design Mode
1. Leave the photo upload empty
2. Choose a **Design Theme** and **Room Type**
3. Describe your ideal room in the text box
4. Click **Generate Design**
5. View the AI-generated room design and scores

### Gallery
All generated designs are automatically saved to your gallery. Navigate to **Gallery** in the sidebar to browse, download, or delete your designs.

---

## Deployment

This project is configured for one-click deployment on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HansithaReddy/DecoVision)

After deploying, add `OPENAI_API_KEY` in your Vercel project's **Environment Variables** settings.