<h1 align="center">StreamVoice</h1>

<p align="center">
  <strong>Your stream, explained out loud.</strong>
</p>

<p align="center">
  <em>Volunteers collect observations about urban streams and rarely hear what the data means.<br/>StreamVoice turns those observations into a short, verified, spoken briefing in plain language.</em>
</p>

<p align="center">
  <a href="#the-problem"><img src="https://img.shields.io/badge/Track_4-Awareness_%26_Storytelling-6366F1?style=for-the-badge&labelColor=151935" alt="Track 4: Awareness and Storytelling" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" /></a>
  <a href="#ai-architecture"><img src="https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 2.5 Flash" /></a>
  <a href="#voice"><img src="https://img.shields.io/badge/Gemini_TTS-4285F4?style=for-the-badge" alt="Gemini TTS" /></a>
  <a href="#map"><img src="https://img.shields.io/badge/Leaflet_+_CARTO-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet and CARTO" /></a>
  <a href="#fhir-export"><img src="https://img.shields.io/badge/FHIR_R4-E34F26?style=for-the-badge&logo=hl7&logoColor=white" alt="FHIR R4" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#the-problem">The Problem</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#ai-architecture">AI Architecture</a> ·
  <a href="architecture.md">Architecture Deep Dive</a> ·
  <a href="#future-scope">Future Scope</a>
</p>

> **Sample data for demonstration.** The three creeks are real places in northern New Jersey, but every observation, volunteer, and score in this repository is fictional. The pipeline accepts any observations that match the schema in [`src/lib/types.ts`](src/lib/types.ts).

---

## The Problem

### Data Goes In, Understanding Never Comes Out

Citizen science programs ask volunteers to visit a stream and record how clear the water is, what it smells like, which insects and animals they spot, and how much litter is on the bank. That data is valuable, but it usually ends up in a spreadsheet or a dashboard built for specialists. The loop breaks:

```
Volunteer visits stream → Records observations → Data sits in a spreadsheet
        → Volunteer never learns what it meant → Motivation fades → Fewer visits
```

Meanwhile, the people who live next to a stream (parents, dog walkers, students) have no easy way to answer a simple question: *is this stream doing okay, and does it matter to me?*

### The One Health Gap

Stream health is not only an environmental issue. Murky water, sewage odors, and disappearing insect life can signal risks that reach **people, pets, and wildlife** at the same time. This is the One Health view: the health of ecosystems, animals, and humans is connected. Most tools present a number without explaining any of those connections.

### Why AI Alone Is Not the Answer

A large language model can summarize data in friendly language, but it can also invent numbers, overstate causes, or mention species nobody saw. For a public health message, that is not acceptable.

**StreamVoice lets AI do what it is good at (narration) and keeps it away from what it is bad at (facts).**

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. OBSERVE     │     │  2. VALIDATE    │     │  3. COMPUTE     │     │  4. LISTEN      │
│                 │     │                 │     │                 │     │                 │
│ Volunteer fills │────▷│ Rule checks +   │────▷│ Code builds     │────▷│ AI narrates the │
│ a 3-step form   │     │ AI second       │     │ score, trend,   │     │ facts, verifier │
│ in one minute   │     │ opinion, human  │     │ risk flags and  │     │ checks it, and  │
│                 │     │ review queue    │     │ a list of facts │     │ a voice reads it│
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Step 1: Observe.** A guided form records clarity (1 to 5), smell, species spotted, litter (0 to 3), weather, and optional notes.

**Step 2: Validate.** Five rule checks catch contradictions (for example, "fish and many species seen" with very murky water and a sewage smell). An optional Gemini second opinion catches what the rules miss. Flagged entries are held back until a reviewer confirms, corrects, or rejects them.

**Step 3: Compute.** Plain TypeScript functions calculate a 0 to 100 health score, the trend against the previous 30 days, risk flags, and a confidence label. The result is a numbered list of neutral facts (`F1`, `F2`, ...), each linked to the observations behind it.

**Step 4: Listen.** Gemini writes a short script one beat at a time, citing fact IDs. A verifier rejects any sentence with a number, species, or place not found in the cited facts. Gemini TTS reads the script aloud with live captions. If anything fails, a deterministic template narrator and the browser's built-in voice take over.

---

## Features

### Spoken Briefings with Live Captions
- **One to three minute** audio summaries at **three listener levels**: child, adult, scientist
- **Per-beat audio**: one Gemini TTS clip per section of the script, with the next clip prefetched while the current one plays
- **Live captions** highlight the current sentence, timed proportionally to each sentence's length within the real clip duration
- Player controls: play and pause, skip sentence, speed (0.8x, 1x, 1.3x), captions toggle, regenerate
- Keyboard shortcuts: `space` to play or pause, arrow keys to skip, `c` for captions
- Never autoplays: audio starts only from a click or key press
- The UI always shows which narrator and voice are active: **AI-narrated** or **Template-narrated**, **AI voice** or **Device voice**

### Verified AI Narration
- Code decides which facts each beat may cite and how many words it gets; the LLM only writes sentences
- Every sentence passes a **verifier**: numbers must exist in the cited facts, fact IDs must exist, definitive causal wording is rejected, and unknown species or place names are rejected
- Failed beats are retried twice with the failure reason, then replaced by the template narration for that beat
- The server **recomputes facts itself** and re-runs validation rules on every request; it never trusts facts sent by the client

### Health Map
- Leaflet map with **CARTO Voyager** basemap tiles (falls back to OpenStreetMap tiles without a key)
- Stream markers colored by health band with a **distinct glyph** (check, minus, alert, question) and a **trend arrow**, so color is never the only signal
- The map stays mounted while the side panel switches between the stream list and a stream's details

### Stream Panel
- Health score ring, trend chip with point change, sparkline across periods
- Risk signal chips with plain-language labels
- **Source line**: "Based on 4 observations from 4 volunteers, 0 reviewed. 1 entry is waiting for review. Confidence: Low."
- **One Health cards** for each active risk: what it can mean for people, pets, wildlife, and the environment

### Human Validation
- Five rule checks plus an optional LLM second opinion on new submissions
- Reviewer queue with **Confirm as recorded**, **Correct** (inline field editing), and **Reject**
- Running statistics: flagged, confirmed, corrected, rejected, and **flag precision** (share of resolved flags that caught a real problem)
- Volunteer and reviewer roles via a local role switch

### Gamification
- **Week streaks** for consecutive weeks with at least one counted observation
- **Five badges**: First Drop, Regular, Sharp Eye, Stream Keeper, Heard It First
- After submitting, volunteers see *"Your observation changed Berrys Creek's score from 49 to 55"* (example) with a button to play the updated briefing

### FHIR Export
- Download any stream's observations as a **FHIR R4 Bundle** (`Location`, `Person`, `Observation` resources)
- Optional validation against the public HAPI FHIR test server

---

## Tech Stack

### Frontend
| Technology | Purpose |
|:---|:---|
| **Next.js 14** (App Router) | Full-stack React framework with server-side API routes |
| **React 18** | UI component library |
| **TypeScript** (strict) | End-to-end type safety |
| **Tailwind CSS 3** | Utility styling on top of CSS design tokens in `globals.css` |
| **Lucide React** | Line icons throughout (no emojis) |
| **DM Sans + DM Mono** | Typography via `next/font` |

### Map
| Technology | Purpose |
|:---|:---|
| **Leaflet 1.9** + **React Leaflet 4** | Interactive map, loaded client-side only |
| **CARTO Voyager** raster tiles | Light basemap (requires a free CARTO key) |
| **OpenStreetMap** tiles | Automatic fallback when no CARTO key is set |

### AI and Voice
| Technology | Purpose |
|:---|:---|
| **Gemini 2.5 Flash** via `@google/genai` | Briefing narration and validation second opinion, in JSON mode |
| **Gemini 2.5 Flash Preview TTS** | Server-side speech synthesis (voice `Kore`) |
| **Web Speech API** | Browser voice fallback |
| **Zod** + `zod-to-json-schema` | Response schemas for Gemini and runtime validation of every response |

### Data and Testing
| Technology | Purpose |
|:---|:---|
| **localStorage** | Observations, profile, cached briefings (per browser, no account needed) |
| **Vitest** | Unit tests for insights, validation, verifier, fallback narration, FHIR, streaks |
| **GitHub Actions** | Runs tests and a production build on every push |

---

## AI Architecture

StreamVoice follows one rule: **the AI never invents numbers.** Code computes, the LLM narrates, a verifier checks, and humans confirm.

```
                       ┌──────────────────┐
                       │   Observations   │
                       └────────┬─────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Validation rules   │ ← 5 deterministic checks
                     │  (+ Gemini opinion) │ ← new submissions only, skipped if unavailable
                     └────┬───────────┬────┘
                 flagged  │           │ accepted
                ┌─────────▼───┐       │
                │  Reviewer   │───────┤ confirmed / corrected
                │  queue      │       │
                └─────────────┘       │
                     ┌────────────────▼────────────────┐
                     │  Insight engine (pure code)     │
                     │  score · trend · risks · facts  │
                     └────────────────┬────────────────┘
                                      │  F1..Fn + One Health notes
                     ┌────────────────▼────────────────┐
                     │  Outline (code)                 │ ← 3, 5 or 7 beats, word budget
                     └────────────────┬────────────────┘
                                      │
                ┌─────────────────────▼─────────────────────┐
                │  Per-beat narration (parallel)            │
                │  Gemini JSON mode → Verifier              │
                │  pass ──▷ keep    fail ──▷ retry (max 2)  │
                │  still failing ──▷ template for that beat │
                └─────────────────────┬─────────────────────┘
                                      │
                     ┌────────────────▼────────────────┐
                     │  Length check: one expand or    │
                     │  trim pass if outside ±15%      │
                     └────────────────┬────────────────┘
                                      │
                     ┌────────────────▼────────────────┐
                     │  Player: Gemini TTS per beat    │
                     │  ──▷ browser voice on failure   │
                     └─────────────────────────────────┘
```

### Guardrails

| Guardrail | How it works |
|:---|:---|
| **No invented numbers** | Every digit and number word in a sentence must appear in the values or text of the facts it cites |
| **No unknown fact IDs** | Every `factId` a sentence cites must exist |
| **Hedged causality only** | Rejects "is caused by", "because of the", "proves", "definitely", "for certain"; prompts require "can signal" or "may point to" |
| **No new species or places** | Known species and stream names may appear only if they occur in the facts or the curated One Health notes |
| **Curated health context** | "Why this matters" content comes only from a static table of notes keyed by risk code, written at three reading levels |
| **Server-side trust boundary** | The API recomputes facts and re-runs validation rules; the Gemini key never reaches the browser |
| **Low temperature, no thinking** | Temperature 0.2 to 0.3, thinking budget 0, JSON-only responses validated by Zod |
| **No em dashes** | Rejected by the verifier, matching the project style rule |

See [architecture.md](architecture.md) for the full pipeline, data flow, and API contracts.

---

## Health Score

Computed per stream over the counted observations (`accepted`, `confirmed`, or `corrected`) in a 30-day period:

```
score = 0.40 × clarity + 0.30 × species + 0.15 × litter + 0.15 × smell
```

| Component | Weight | Scaling to 0 to 100 |
|:---|:---|:---|
| Clarity | 40% | Mean clarity, 1 to 5 mapped linearly |
| Species diversity | 30% | Distinct species seen, capped at 6 |
| Litter | 15% | Inverse of mean litter on the 0 to 3 scale |
| Smell | 15% | None or earthy = 100, other = 50, sewage or chemical = 0, averaged |

| Rule | Value |
|:---|:---|
| Minimum data | Score is `null` with fewer than 2 counted observations |
| Trend | Change of +8 or more is **improving**, -8 or less is **declining**, otherwise **stable** |
| Health bands | 65 and above **Healthy**, 45 to 64 **Needs attention**, below 45 **Concerning** |
| Period anchor | Fixed `ANCHOR_DATE` of 2026-09-30 so the demo never depends on today's date |

### Risk Flags

| Code | Fires when |
|:---|:---|
| `RUNOFF_SIGNAL` | Mean clarity drops by 1 or more **and** distinct species fall by 20% or more |
| `LITTER_RISING` | Mean litter rises by 0.75 or more |
| `ODOR_REPORTED` | At least one sewage or chemical smell this period |
| `LOW_BIODIVERSITY` | 2 or fewer distinct species this period |
| `LOW_DATA` | Fewer than 3 counted observations this period |

The score is a transparent heuristic for awareness, not a regulatory water quality index.

---

## Voice

| Layer | Condition | What plays |
|:---|:---|:---|
| **AI voice** | Gemini key set and `TTS_PROVIDER=gemini` | Gemini TTS, one clip per beat, 24 kHz PCM wrapped in a WAV header on the server |
| **Device voice** | TTS request fails, is rate limited, takes over 8 seconds, or `TTS_PROVIDER=browser` | Browser `speechSynthesis`, one utterance per sentence |
| **Captions only** | Browser has no speech support | Captions remain readable with a visible notice |

When the AI voice fails mid-briefing, playback resumes from the same sentence in the device voice. Each listener level gets its own speaking style: warm and gentle for children, calm and clear for adults, neutral and precise for scientists.

---

## Map

The three sample streams are real waterways in the New Jersey Meadowlands area, each paired with a fictional data story:

| Stream | Location | Sample data story |
|:---|:---|:---|
| **Berrys Creek** | East Rutherford, beside the Meadowlands sports complex | Declining: clarity and species drop after a storm, litter rising, runoff signal |
| **Mill Creek** | Secaucus, along the Mill Creek Marsh preserve | Stable and healthy |
| **Overpeck Creek** | Overpeck County Park, Ridgefield Park | Improving |

Each stream also has one planted inconsistent entry so the validation and review flow can be demonstrated.

---

## FHIR Export

A pilot mapping that shows how volunteer observations could flow into health data systems.

| StreamVoice | FHIR R4 |
|:---|:---|
| Stream | `Location` with name, description, position |
| Volunteer | `Person` placeholder (`Volunteer o1`) |
| Observation | `Observation` with category `survey` and five `component` entries |
| `accepted`, `confirmed`, `corrected` | `status: final` |
| `flagged` | `status: preliminary` |
| `rejected` | `status: entered-in-error` |
| Notes, validation flags, review status | `note` entries |

The code system `https://streamvoice.example/fhir/CodeSystem/stream-observation` and its codes (`clarity`, `smell`, `species`, `litter`, `weather`) are **custom** and not part of any standard terminology.

---

## Design

| Principle | Implementation |
|:---|:---|
| **Calm and credible** | Soft lavender background, white cards with gentle shadows, indigo gradient actions |
| **Color is never the only signal** | Every health color is paired with a glyph, a label, or a number |
| **Zero emojis** | Lucide line icons only |
| **Keyboard first** | Visible 3px focus rings, skip link, player shortcuts |
| **Screen reader support** | `aria-live` captions, labelled progress bar, `aria-pressed` toggles, role-labelled charts |
| **Reduced motion** | Animations and transitions disabled under `prefers-reduced-motion` |
| **Desktop first** | Designed for 1280px and up; sidebar becomes a slide-out menu and panels stack on narrow windows |

---

## Project Structure

```
streamvoice/
├── data/
│   ├── streams.json                # 3 real creeks (fictional data)
│   ├── observations.json           # 24 sample observations, 6 volunteers
│   └── one-health-notes.json       # Curated notes per risk code, 3 reading levels
├── scripts/
│   └── gen-observations.js         # Regenerates observations.json
├── src/
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── app/                    # The application (sidebar layout)
│   │   │   ├── (explore)/          # Map + stream list and stream detail panel
│   │   │   ├── contribute/         # 3-step observation form
│   │   │   ├── review/             # Reviewer queue
│   │   │   └── profile/            # Streaks, badges, history
│   │   └── api/
│   │       ├── briefing/           # Facts + narration pipeline
│   │       ├── validate/           # Rules + Gemini second opinion
│   │       ├── tts/                # Gemini TTS, WAV wrapping, cache
│   │       └── fhir/validate/      # Proxy to public HAPI FHIR server
│   ├── components/                 # Player, map, cards, sidebar, UI primitives
│   └── lib/
│       ├── insights/               # score, trends, flags, confidence, facts
│       ├── validation/             # rules, llmCheck, pipeline
│       ├── narration/              # outline, prompts, sections, verify, fallback
│       ├── llm/                    # Provider adapter (Gemini)
│       ├── tts/                    # Provider interface, server and browser voices
│       ├── fhir/                   # mapper, bundle
│       ├── gamification/           # streaks, badges
│       └── store/                  # Seed data, localStorage-backed app state
└── tests/                          # Vitest suites
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- A [Google AI Studio](https://aistudio.google.com) API key (optional; the app runs without one)
- A [CARTO](https://carto.com/basemaps) basemap key (optional; falls back to OpenStreetMap tiles)

### 1. Clone and Install

```bash
git clone <your-repo-url> streamvoice
cd streamvoice
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key        # server only, never sent to the browser
LLM_MODEL=gemini-2.5-flash
TTS_PROVIDER=gemini                       # set to "browser" to force the device voice
TTS_MODEL=gemini-2.5-flash-preview-tts
TTS_VOICE=Kore
DEMO_FALLBACK=true                        # fall back to template narration on failure
NEXT_PUBLIC_CARTO_KEY=your_carto_key      # map tiles, visible to the browser by design
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or go straight to [http://localhost:3000/app](http://localhost:3000/app).

### 4. Test

```bash
npm test
```

### 5. Deploy to Vercel

```bash
npm run build      # verify the production build locally
```

1. Import the GitHub repository in [Vercel](https://vercel.com)
2. Add the variables from `.env.local` to the project settings
3. Deploy

### Demo Without Any Keys

Leave `GEMINI_API_KEY` empty. Briefings are built by the template narrator (labelled **Template-narrated**), the browser voice reads them (labelled **Device voice**), and every other feature works unchanged.

---

## Testing

| Suite | Covers |
|:---|:---|
| `insights.test.ts` | Score, trend, confidence tiers, null scores, stable fact IDs and sources, declining, stable and improving sample streams |
| `validation.test.ts` | The three planted entries are flagged, the 21 clean entries are not, rain and clarity mismatch, flagged entries excluded from insights |
| `verify.test.ts` | Verifier rejects invented numbers, unknown fact IDs, causal wording, unknown species; fallback narration passes the verifier at all 9 level and length combinations |
| `fhir.test.ts` | Status mapping, required Observation fields, bundle contents, week streak counting |

---

## Limitations

- **Sample data only.** No real OneAquaHealth data is connected yet.
- **Single browser.** State lives in localStorage; there are no accounts, and the reviewer role is a local switch.
- **Pre-generated demo audio is not committed.** Briefing audio is generated live and cached in memory, so the first play of each beat waits on Gemini TTS.
- **Briefing length is approximate.** Short briefings can overshoot the word budget, and the AI occasionally repeats a point across beats.
- **English only.**

---

## Future Scope

### Near Term
- **Pre-generated briefings and audio** for the sample streams, served first for an instant demo
- **Shared backend** with real reviewer accounts and audit history
- **Photo uploads** attached to observations for reviewer context

### Next
- **Real data integration** with OneAquaHealth and other citizen science programs through the same schema
- **Multilingual narration** with per-language verifier rules
- **Offline contributions** that sync when back online

### Later
- **Coordinator dashboards** for program leads across many streams
- **Alerts** to subscribers when a stream turns concerning
- **Standard FHIR terminology** in place of the custom code system, in partnership with public health agencies

---


---

<p align="center">
  MIT License · Built for the people, pets, and wildlife who share our streams.
</p>
