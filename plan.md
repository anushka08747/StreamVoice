# StreamVoice: Implementation Plan

Tagline: Your stream, explained out loud.
Hackathon: OneAquaHealth IEEE Global Hackathon (Devpost). Track 4 (Awareness & Storytelling) is the declared track. Validation, map, gamification and FHIR export are supporting features.
Deadline: Oct 4, 2026 9:00pm PDT (Oct 5, 9:30am IST). Submit at least 1 hour early.

## 0. Instructions for the coding agent
- All scope in this document is in scope. Build in the phase order below so that a working end-to-end demo exists as early as possible, then layer features on.
- Core principle: **the AI never invents numbers.** Plain code computes every statistic. The LLM only narrates facts handed to it, and a verifier rejects any output that contains numbers or claims not traceable to those facts.
- No em dashes anywhere in user-facing text, README, or Devpost copy. Use commas, colons, or hyphens.
- Sample data must be clearly labeled as sample data in the UI (persistent banner) and in the README.
- Commit early and often with clear messages. Keep the repo public-ready from the first commit (no secrets, `.env.example` provided).

## 1. Product summary

StreamVoice turns citizen observations about urban streams into a short spoken briefing in plain language, with a health map, a One Health explainer, a human validation step for suspicious entries, and light gamification for volunteers.

A volunteer opens a stream in the web app and clicks play. They hear, for example: "This month, 6 people checked Maple Creek. Water clarity dropped compared with last month, and fewer insect species were spotted. That can signal runoff pollution. Here is why that matters for the birds, pets, and people who use this stream."

Target users: citizen science volunteers (primary), reviewers or coordinators (validation), and community members or students (listener-level toggle).

## 2. Tech stack

- Next.js 14+ (App Router) with TypeScript, Tailwind CSS
- Leaflet + OpenStreetMap tiles for the map (no API key needed)
- Vitest for unit tests
- Zod for schemas and runtime validation of LLM output
- LLM: Gemini API via the `@google/genai` SDK, behind a thin adapter (`lib/llm/`) so the provider can be swapped later. Model set by `LLM_MODEL` (default `gemini-2.5-flash`; use a newer Flash model if available on your key). Use JSON mode for every call: `responseMimeType: "application/json"` plus a `responseSchema` derived from the Zod schemas, and still validate the output with Zod
- Voice: Gemini TTS (server-side, via API route) as the primary voice, with the browser Web Speech API (`speechSynthesis`) as the automatic fallback, both behind a provider interface
- Deploy: Vercel. API routes are stateless. Client state in `localStorage`
- Package manager: pnpm or npm (pick one and keep it)

Environment variables (`.env.example`):
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=
LLM_MODEL=gemini-2.5-flash
TTS_PROVIDER=gemini
# set TTS_PROVIDER=browser to force the browser voice (uses no API calls)
TTS_MODEL=gemini-2.5-flash-preview-tts
TTS_VOICE=Kore
DEMO_FALLBACK=true
```

## 3. Repository structure

```
streamvoice/
  README.md
  DEVPOST.md
  LICENSE (MIT)
  plan.md
  .env.example
  data/
    streams.json
    observations.json
    one-health-notes.json
  src/
    app/
      page.tsx                  # map + stream list
      streams/[id]/page.tsx     # stream panel + briefing player
      review/page.tsx           # reviewer queue
      contribute/page.tsx       # add observation form
      profile/page.tsx          # volunteer profile, streaks, badges
      api/
        briefing/route.ts
        validate/route.ts
        tts/route.ts            # optional server TTS
        fhir/validate/route.ts  # optional proxy to public HL7 test server
    lib/
      types.ts
      insights/
        score.ts
        trends.ts
        flags.ts
        facts.ts
        confidence.ts
      validation/
        rules.ts
        llmCheck.ts
        pipeline.ts
      narration/
        outline.ts
        sections.ts
        verify.ts
        fallback.ts
        prompts.ts
      llm/
        client.ts
        gemini.ts
      tts/
        provider.ts
        browser.ts
        server.ts
      fhir/
        mapper.ts
        bundle.ts
      gamification/
        streaks.ts
        badges.ts
      store/
        observations.ts         # localStorage-backed store
        profile.ts
    styles/
      clay.css                  # tokens and clay shadow recipes
    components/
      clay/                     # ClayCard, ClayButton, ClayChip, ClayInput, ClayToggle, ClayFrame, ClayBadge
      MapView.tsx
      StreamPanel.tsx
      HealthBadge.tsx
      TrendArrow.tsx
      Sparkline.tsx
      BriefingPlayer.tsx
      Captions.tsx
      SourceLine.tsx
      OneHealthCard.tsx
      ListenerControls.tsx
      ObservationForm.tsx
      ReviewQueue.tsx
      DataBanner.tsx
      BadgeShelf.tsx
  tests/
    insights.test.ts
    validation.test.ts
    verify.test.ts
    fhir.test.ts
```

## 4. Data model (`src/lib/types.ts`)

```ts
type Stream = {
  id: string; name: string; lat: number; lng: number;
  description: string; // one sentence, plain language
};

type Observation = {
  id: string;
  streamId: string;
  observerId: string;
  observedAt: string;            // ISO date
  clarity: 1 | 2 | 3 | 4 | 5;    // 1 = very murky, 5 = very clear
  smell: "none" | "earthy" | "sewage" | "chemical" | "other";
  species: string[];             // simple labels, e.g. "mayfly nymph", "heron"
  litter: 0 | 1 | 2 | 3;         // 0 none, 3 heavy
  weather: "dry" | "light_rain" | "heavy_rain" | "unknown";
  notes?: string;
  status: "accepted" | "flagged" | "confirmed" | "corrected" | "rejected";
  flags: ValidationFlag[];
};

type ValidationFlag = {
  code: string;                  // e.g. "FISH_BUT_HEAVY_POLLUTION"
  message: string;               // plain-language reason shown to reviewer
  source: "rule" | "llm";
};

type Fact = {
  id: string;                    // "F1", "F2", ...
  kind: "count" | "score" | "trend" | "risk" | "period";
  text: string;                  // neutral, code-generated statement
  values: Record<string, number | string>;
  sourceObservationIds: string[];
};
```

An observation counts toward insights only if status is `accepted`, `confirmed`, or `corrected`. `flagged` and `rejected` are excluded until a reviewer acts.

## 5. Sample data (clearly labeled)

Create `data/streams.json`, `data/observations.json`, `data/one-health-notes.json`.

- 3 fictional streams: "Maple Creek" (declining, runoff story), "Heron Brook" (stable and healthy), "Millrace Channel" (improving after cleanup).
- Observations spread across the current and previous calendar month relative to a fixed `ANCHOR_DATE` constant (so the demo never depends on today's date). 20 to 24 observations total, 5 to 8 volunteers.
- Maple Creek: previous month clarity around 4, species diversity 4 to 5. Current month clarity around 2 to 3, diversity 2, one litter increase, one heavy_rain day.
- Deliberately inconsistent entries (3 minimum, must trigger flags in the demo):
  1. "fish and many species seen" with clarity 1 and smell "sewage"
  2. clarity 5 with notes saying "green scum on surface"
  3. litter 0 with notes saying "bags of trash along bank"
- Include `one-health-notes.json`: a curated, static table keyed by risk flag code (`RUNOFF_SIGNAL`, `LITTER_RISING`, `ODOR_REPORTED`, `LOW_BIODIVERSITY`, `LOW_DATA`), each with short notes for people, pets, wildlife, and environment, in 3 reading levels. The LLM must use only these notes for the "why this matters" content.
- Add a visible label in the UI and README: "Sample data for demonstration. The pipeline accepts any observations that match the schema."

## 6. Insight engine (pure functions, no AI)

All functions are deterministic and unit tested. Only counted observations are used.

### 6.1 Period handling
- `currentPeriod`: the 30 days ending at `ANCHOR_DATE`. `previousPeriod`: the 30 days before that.

### 6.2 Health score (0 to 100) per stream per period
Weighted blend, documented in README:
- Clarity: 40% (mean clarity scaled 1 to 5 into 0 to 100)
- Species diversity: 30% (distinct species count, capped at 6, scaled)
- Litter: 15% (inverse of mean litter, scaled 0 to 3)
- Smell: 15% (none/earthy = 100, other = 50, sewage/chemical = 0, averaged)
Return null if fewer than 2 counted observations in the period.

### 6.3 Trend
- Delta = current score minus previous score.
- `improving` if delta >= +8, `declining` if delta <= -8, otherwise `stable`. `unknown` if either score is null.

### 6.4 Risk flags (codes)
- `RUNOFF_SIGNAL`: mean clarity dropped by >= 1 AND distinct species fell by >= 20%, optionally strengthened if heavy_rain observed.
- `LITTER_RISING`: mean litter increased by >= 0.75.
- `ODOR_REPORTED`: at least one sewage or chemical smell in current period.
- `LOW_BIODIVERSITY`: distinct species <= 2 in current period.
- `LOW_DATA`: fewer than 3 counted observations in current period.

### 6.5 Confidence label
- High: >= 6 counted observations and >= 2 distinct observers and no unresolved flags.
- Medium: 3 to 5 counted observations or a single observer.
- Low: fewer than 3 or unresolved flagged entries in the period.

### 6.6 Facts builder (`facts.ts`)
Produce an ordered list of `Fact` objects with IDs `F1..Fn` covering: observation count and observer count, period range, health score and trend, each changed metric (clarity, species, litter), each risk flag, and confidence. Every fact carries `sourceObservationIds`. The facts list is the only content the narration layer may use, plus the One Health notes keyed by active risk flags.

## 7. Validation pipeline (Track 3 touch)

Runs when an observation is created (contribute form) and on seed load.

1. Rule checks (`rules.ts`), each with a code and plain-language message:
   - `FISH_BUT_HEAVY_POLLUTION`: species includes fish or many species with clarity 1 and sewage/chemical smell
   - `CLEAR_BUT_ALGAE_NOTE`: clarity >= 4 with notes mentioning scum, algae, bloom, foam
   - `NO_LITTER_BUT_TRASH_NOTE`: litter 0 with notes mentioning trash, bags, bottles, dumping
   - `OUTLIER_VS_STREAM`: clarity differs by >= 3 from the stream's median in the last 30 days
   - `RAIN_CLARITY_MISMATCH`: heavy_rain with clarity 5 (unusual, ask to confirm)
2. LLM second opinion (`llmCheck.ts`): sends the observation fields and notes, asks for JSON `{ suspicious: boolean, reason: string }`. Used only to catch contradictions the rules miss. If LLM is unavailable, skip silently.
3. Result: any flag sets status to `flagged`. Otherwise `accepted`.
4. Reviewer queue (`/review`): shows flagged entries with the reason, the raw fields, and three actions: Confirm (status `confirmed`), Correct (edit fields, status `corrected`), Reject (status `rejected`). Show running stats: flagged, confirmed, corrected, rejected, and an "AI flag precision" figure (confirmed-as-problem share).
5. Briefings display how many entries were reviewed and how many are excluded pending review.

## 8. Narration pipeline (constrained LLM)

Goal: a spoken script of a requested length and listener level, using only verified facts.

Inputs: facts list, active One Health notes, `level` (child | adult | scientist), `minutes` (1 | 2 | 3).

Word budget: minutes x 150 words, tolerance plus or minus 15%.

### 8.1 Two-pass generation (own implementation)
1. Outline pass (`outline.ts`): LLM receives facts and returns JSON: an ordered list of beats, each `{ beat: string, factIds: string[] }`, sized to the word budget (1 minute: 3 beats, 2 minutes: 5 beats, 3 minutes: 7 beats). Required beats: opening with count and stream name, what changed, what it may signal, why it matters (One Health), confidence and how to help.
2. Section pass (`sections.ts`): for each beat, LLM writes 1 to 3 sentences. Output JSON array of `{ text: string, factIds: string[] }`. Keep each call small so length targets are met.
3. Assemble sentences into the script. Compute word count. If outside tolerance, run one targeted expand or trim pass on specific beats.

### 8.2 Prompt rules (`prompts.ts`)
- State the listener level style: child (short sentences, simple words, friendly tone), adult (plain, practical), scientist (precise terms, mention scores and confidence).
- "Use only the numbers and statements in the provided facts. Do not add new numbers, species, causes, or places."
- Hedged causality only: use "can signal", "may point to". Never state a definite cause.
- Output JSON only, matching the Zod schema.
- Avoid em dashes.

Gemini call settings (apply to outline, section, and validation calls):
- Low temperature (0.2 to 0.4) so outputs stay close to the facts.
- Minimize or disable the "thinking" budget on Flash for these short calls to keep latency low.
- Handle 429 and 5xx with one retry and exponential backoff, then fall through to the deterministic fallback.
- Never expose `GEMINI_API_KEY` to the client. All LLM and TTS calls go through API routes.

### 8.3 Verifier (`verify.ts`)
After generation, for every sentence:
- Extract all numbers (digits and number words) and check each exists in the cited facts' values or can be derived directly (count, delta). Reject if not.
- Check `factIds` all exist.
- Reject definitive causal language (regex list: "is caused by", "because of the", "proves").
- Reject any species or place name not present in the facts or notes.
On failure: retry that section up to 2 times with the failure reason appended. If still failing, use the deterministic fallback for that beat.

### 8.4 Deterministic fallback (`fallback.ts`)
Template-based narration built directly from facts and notes at the same three levels. Used when the LLM is down, rate limited, `DEMO_FALLBACK=true` and a call fails, or verification fails. The UI labels the briefing source as "AI-narrated" or "Template-narrated".

### 8.5 Caching
Cache briefings in `localStorage` keyed by a hash of (facts, level, minutes). Provide a "Regenerate" button. Pre-generate and commit briefings for the 3 sample streams at all level and length combinations to `data/pregenerated/` for guaranteed demo reliability, used only when the LLM call fails.

### 8.6 API: `POST /api/briefing`
Request: `{ stream, observations, level, minutes }`. The server recomputes facts itself (never trust client facts), runs the pipeline, returns `{ script: Sentence[], facts, wordCount, source: "ai" | "template", confidence, oneHealth }`.

## 9. Voice

- `TtsProvider` interface: `speak(sentences, { onSentenceStart, onEnd })`, `pause()`, `resume()`, `stop()`.
- `server.ts` (primary): `POST /api/tts` takes a chunk of script text and calls Gemini TTS (`TTS_MODEL`, voice `TTS_VOICE`) with the same `GEMINI_API_KEY`. Gemini TTS returns raw PCM audio (24kHz, 16-bit, mono), so wrap it in a WAV header before sending it to the browser. Pass a short style instruction matching the listener level (child: warm and gentle, adult: calm and clear, scientist: neutral and precise).
- Chunking and captions: synthesize one audio clip per narration beat (3 to 7 calls per briefing), not one giant call and not one call per sentence. Start playing the first clip while the rest load (prefetch the next chunk during playback). Within a clip, highlight sentences by estimated timing proportional to character count, using the real clip duration.
- Caching: cache audio by hash of (text, voice, style) in `localStorage`/IndexedDB on the client and in an in-memory map on the server. Add a "Regenerate" action.
- Pre-generated demo audio: with the briefing script pre-generation, also generate and commit audio for the 3 sample streams across all 3 levels and 3 lengths (27 clips sets) to `public/audio/`. Serve these first when the stream, level, and length match, so the demo is instant and works if the API is rate limited.
- `browser.ts` (fallback): queue one utterance per sentence, fire `onSentenceStart(index)` for caption highlighting. Pick a sensible default voice, expose rate (0.8x to 1.3x) and voice choice. Used automatically when the Gemini TTS call fails, times out (over 8 seconds), is rate limited, or when `TTS_PROVIDER=browser`.
- The UI shows which voice is active ("AI voice" or "Device voice") so a fallback is never silent or confusing.
- Player UI: play/pause, skip sentence, progress bar, speed, captions toggle, listener level and length selectors, "Regenerate".

## 10. UI and UX

This is a desktop-first responsive web app, not a mobile app. Primary target is laptop and desktop browsers (1280px wide and up, designed and demoed at 1920x1080 and 1440x900). It must degrade gracefully to tablet and narrow browser windows, but do not design around touch or phone gestures. Accessible, minimal jargon.

Web app layout
- Home and stream pages use a two-pane layout: the map fills the left 60 to 65 percent, and a persistent clay side panel on the right holds the stream list or the selected stream's details. No page reloads when picking a stream (client-side routing, keep the map mounted).
- Top navigation bar with the logo, links (Map, Contribute, Review, Profile), and the volunteer/reviewer role toggle.
- Max content width of 1440px on large monitors, centered, with generous gutters.
- Below 1024px, the side panel becomes a slide-over drawer. Below 768px, stack the map above the panel. This is only a graceful fallback.
- Support mouse hover states, keyboard shortcuts for the player (space to play/pause, left and right arrows to skip a sentence, `c` to toggle captions), and visible focus for keyboard users.
- Browser audio autoplay rules: never autoplay. Audio starts only after a click or key press on the play control, and the AudioContext or audio element is created in that user gesture.

- Home (`/`): map with color-coded markers (green, amber, red by health score, grey for unknown), trend arrow on each, with the stream list in the persistent side panel next to the map (collapses to a drawer on narrow windows). Sample data banner always visible.
- Stream panel (`/streams/[id]`): health score, trend arrow, sparkline of score across periods, risk flag chips with plain-language labels, confidence label, listener controls, briefing player with live captions, `SourceLine` ("Based on 12 observations from 5 volunteers, 2 reviewed. 1 entry waiting for review."), One Health cards per finding (people, pets, wildlife, environment), and a "Contribute an observation" button.
- Contribute (`/contribute`): 3-step guided form with plain-language labels and icons (clarity slider with example descriptions, smell options, species picker with simple names, litter scale, weather, notes). Runs the validation pipeline on submit and shows the result: "Thanks, added" or "We have a quick question about this entry".
- Review (`/review`): see section 7.
- Profile (`/profile`): lightweight local profile (display name only, no auth), role toggle (Volunteer or Reviewer), streak count, badges, and the volunteer's contribution history.
- Accessibility: keyboard navigable, visible focus, aria-live for captions, color is never the only signal (icons and labels on markers), contrast AA, respects reduced motion.
- Visual style: claymorphism. See section 10.1 for the full design system. Large touch targets, no clutter.

### 10.1 Design system: claymorphism

Goal: a soft, puffy, 3D "clay" look that feels friendly and approachable for volunteers of all ages, with a calm water theme. Everything looks like it was molded from clay: thick rounded shapes, soft colored shadows, inner highlights, and tactile press states. Accessibility is not negotiable: the clay look must never reduce legibility.

Core rules
- Every card, button, input, chip, marker, and badge is a clay object: very large border radius, a soft colored outer drop shadow, an inner top-left highlight, and an inner bottom-right shade.
- Pastel, slightly desaturated surfaces on a light misty background. No hard borders, no flat 1px outlines, no pure black or pure white.
- Generous spacing and chunky sizing. Minimum interactive target 44px (comfortable for mouse, keyboard, and touch). Corners: 20 to 32px on cards, fully round on buttons and chips.
- Elevation levels: `clay-sm` (chips, inputs), `clay-md` (cards), `clay-lg` (player, map frame, modals). Pressed or active elements invert to an inset look.
- Keep the layout simple. Clay needs room, so avoid dense tables and tiny text.

Design tokens (define as CSS variables and in `tailwind.config`)
```
--bg:            #E6F0F5   /* misty water background */
--surface:       #F3F8FB   /* clay card surface */
--ink:           #1F3A4D   /* primary text, deep navy */
--ink-soft:      #4A6475   /* secondary text, verify AA */
--aqua:          #7FD1C7   /* primary action */
--sky:           #8EC5F2
--lilac:         #B9A8F0
--sun:           #FFD38A
--coral:         #FF9E9E
--leaf:           #A8E0A0
--health-good:   #6CCB8C
--health-warn:   #F6C25B
--health-bad:    #F07C7C
--health-unknown:#B8C4CC
--shadow-dark:   rgba(80, 120, 150, 0.30)   /* tinted, never grey or black */
--shadow-light:  rgba(255, 255, 255, 0.90)
--inner-light:   rgba(255, 255, 255, 0.70)
--inner-dark:    rgba(80, 120, 150, 0.18)
--radius-card:   28px
--radius-pill:   999px
```
Dark mode: optional. If added, use deep teal-navy surfaces with the same clay structure and re-tune shadows.

Reusable clay recipe (implement as Tailwind utilities `clay-sm`, `clay-md`, `clay-lg`, `clay-pressed`)
```css
.clay-md {
  background: var(--surface);
  border-radius: var(--radius-card);
  box-shadow:
    10px 10px 22px var(--shadow-dark),
    -8px -8px 18px var(--shadow-light),
    inset 5px 5px 10px var(--inner-light),
    inset -5px -5px 10px var(--inner-dark);
}
.clay-pressed {
  box-shadow:
    inset 6px 6px 12px var(--inner-dark),
    inset -6px -6px 12px var(--inner-light);
}
```
Tint accent elements (primary button, selected chip, markers) with a colored surface plus a slightly darker tinted shadow of the same hue, not the generic blue-grey.

Typography
- Rounded, friendly typeface loaded with `next/font`: Nunito (body) and Fredoka or Baloo 2 (headings, numbers). Weights 500 to 700. Base size 16px or larger, headings bold, generous line height.
- Text color is always `--ink` or `--ink-soft` on light clay surfaces. Verify WCAG AA contrast (4.5:1 for body text, 3:1 for large text and UI components) for every text and background pairing, including text on the colored buttons and chips.

Component treatments
- Buttons: pill shaped, puffy, tinted. Primary uses `--aqua` with `--ink` text. On press: scale to 0.97 and switch to the inset `clay-pressed` look, with a short spring transition.
- Cards (`StreamPanel`, `OneHealthCard`, review items): `clay-md`, 28px radius, icon in a small tinted clay bubble.
- Inputs and sliders: inputs are inset (debossed) clay wells. Clarity slider is a groove with a round clay knob and labeled example stops.
- Map: wrap Leaflet in a thick `clay-lg` frame with rounded corners and an inner bevel. Use a light, desaturated basemap (for example CARTO Positron) with correct attribution. Stream markers are puffy clay balls colored by health score with a distinct icon inside (check, minus, alert, question) and a small trend arrow, so color is never the only signal.
- Health score: a clay dial or ring with the number in the heading font at the center.
- Sparkline: drawn in a debossed clay panel.
- Risk flag chips: small clay pills with an icon and a plain-language label.
- Player: a big puffy round play/pause button as the focal point, a progress bar shaped as a groove with a clay ball knob, speed and level controls as segmented clay toggles, and captions in an inset clay card with the current sentence highlighted by a tinted background.
- Badges and streaks: chunky 3D clay tokens that "pop" with a small spring animation when earned.
- Navigation: a floating clay pill bar at the top of the page with the active item inset. It collapses into a menu button on narrow windows.
- Banner for sample data: a clay strip using `--sun`, always visible, text in `--ink`.
- Empty, loading, and error states use clay skeletons and a friendly illustration or icon, never raw error text.

Motion
- Short springy transitions (150 to 250ms) for hover lift, press squish, and badge pop.
- Honor `prefers-reduced-motion`: disable the springs and animations and keep static states.

Accessibility guardrails for the clay style
- Visible focus rings (3px, high contrast tint) on every interactive element, since soft shadows hide default outlines.
- Do not rely on shadow depth alone to show state. Selected and active states must also change color, icon, or label.
- Keep text off textured or heavily shaded areas. Text sits on flat clay surface fills.
- Test at low screen brightness, on a laptop panel and an external monitor, and with a contrast checker, because soft pastel shadows wash out easily.

Implementation notes
- Centralize all clay styles in `src/styles/clay.css` plus Tailwind utilities so components stay clean. Do not hand-write shadows in components.
- Build a small primitives set first: `ClayCard`, `ClayButton`, `ClayChip`, `ClayInput`, `ClayToggle`, `ClayFrame`, `ClayBadge`. Every screen composes from these.
- Provide a `/design` route (dev only) that shows all primitives and states, for quick visual QA.

## 11. Gamification (Track 5 touch)

- Streaks (`streaks.ts`): consecutive weeks with at least one counted observation per volunteer.
- Badges (`badges.ts`), computed from observations:
  - First Drop (first observation)
  - Regular (3-week streak)
  - Sharp Eye (3 observations confirmed by a reviewer)
  - Stream Keeper (observations on 3 different streams)
  - Heard It First (listened to a full briefing, tracked locally)
- After a contribution, show "Your observation changed Maple Creek's score" and offer to play the updated briefing. This closes the loop that motivates repeat participation.

## 12. FHIR export (Track 7 touch)

- `mapper.ts`: map each observation to a FHIR R4 `Observation` resource.
  - `status`: `final` for accepted/confirmed/corrected, `preliminary` for flagged, `entered-in-error` for rejected
  - `category`: `survey`
  - `code`: custom code system `https://streamvoice.example/fhir/CodeSystem/stream-observation` with codes for clarity, smell, species, litter, weather
  - `subject`: reference to a FHIR `Location` resource for the stream
  - `effectiveDateTime`: `observedAt`
  - `valueInteger` or `valueString` or `valueCodeableConcept` per element
  - `performer`: reference to a `Practitioner`/`Person` placeholder using `observerId`
  - validation flags and reviewer decision as `note`
- `bundle.ts`: assemble a `Bundle` of type `collection` containing the Location, the Observations, and any Persons.
- UI: "Download FHIR bundle (JSON)" on the stream panel.
- Optional: `/api/fhir/validate` posts the bundle to a public HL7 FHIR test server `$validate` endpoint and shows the result. Fail gracefully if unreachable.
- README note: explain this is a pilot mapping to show interoperability, and state which codes are custom.

## 13. Testing

Vitest, minimum coverage:
- Score, trend, flags, and confidence functions with edge cases (null scores, equal values, empty periods).
- Facts builder produces stable IDs and correct source observation IDs.
- Validation rules fire on the three planted inconsistent entries and not on clean ones.
- Verifier rejects invented numbers, unknown fact IDs, definitive causal wording, and unknown species names.
- Fallback narration passes the verifier.
- FHIR mapper output has required fields and valid status mapping.
Run tests in CI via a simple GitHub Actions workflow.

## 14. Phased build order

Phase 1: Foundation
- Scaffold Next.js + TS + Tailwind, lint, Vitest, `.env.example`, MIT license.
- Types, sample data, `ANCHOR_DATE`, one-health notes.
- Design tokens, `clay.css`, Tailwind clay utilities, fonts, and the clay primitives (`ClayCard`, `ClayButton`, `ClayChip`, `ClayInput`, `ClayToggle`, `ClayFrame`, `ClayBadge`) with a dev-only `/design` showcase route.
Acceptance: app boots, data loads, tests run, and `/design` renders every primitive in default, hover, pressed, focus, and disabled states with AA contrast.

Phase 2: Insight engine
- Score, trends, flags, confidence, facts builder with tests.
Acceptance: facts for Maple Creek show a decline and `RUNOFF_SIGNAL`; Heron Brook stable.

Phase 3: Validation
- Rules, LLM check, pipeline, review queue UI.
Acceptance: the 3 planted entries are flagged; reviewer actions change status and update insights.

Phase 4: Narration
- LLM adapter, outline and section passes, verifier, fallback, caching, `/api/briefing`.
Acceptance: briefings for all 3 levels and 3 lengths pass the verifier; fallback works with the API key removed.

Phase 5: Voice and player
- Gemini TTS route with WAV wrapping, per-beat chunking and prefetch, caching, browser TTS fallback, caption sync, player controls.
Acceptance: play, pause, skip, speed, captions, and keyboard shortcuts work in desktop Chrome, Safari, Firefox, and Edge; audio never autoplays; with the API key removed the browser voice takes over without errors.

Phase 6: Map and stream UI
- Leaflet map, markers, stream panel, sparkline, risk chips, One Health cards, source line.
Acceptance: end-to-end flow from map to spoken briefing.

Phase 7: Contribute and gamification
- Observation form, validation on submit, streaks, badges, profile, role toggle.
Acceptance: submitting an observation updates the score and briefing.

Phase 8: FHIR export
- Mapper, bundle, download button, optional validate route.
Acceptance: bundle downloads and passes a validator or the public test server.

Phase 9: Voice hardening and pre-generated audio
- Generate and commit the pre-generated audio set for all sample streams, levels, and lengths. Tune the style instructions per listener level and pick the best voice. Add the active-voice indicator and a user voice choice if time allows.
Acceptance: demo plays instantly from pre-generated audio, and live generation works for new observations.

Phase 10: Polish, docs, deploy
- Accessibility pass (keyboard-only walkthrough, screen reader spot check), responsive check at 1920, 1440, 1280, 1024, and 768px widths, error states, loading states.
- Claymorphism QA: confirm every screen uses the clay primitives, check contrast of all text on pastel surfaces, verify focus rings and non-shadow state cues, test reduced motion, and review on a laptop screen and an external monitor at low brightness.
- README, DEVPOST.md, architecture diagram, pre-generated briefings.
- Deploy to Vercel, verify with a clean browser profile, test with the API key removed.

## 15. Documentation deliverables

README.md must include: what it is, the problem, screenshots or GIF, quick start, env vars, architecture diagram (Mermaid), the health score formula, the responsible-AI design (code computes, LLM narrates, verifier checks, humans confirm), data disclosure (sample data), FHIR mapping notes, testing, limitations, and future work (real OneAquaHealth data integration, multilingual narration, offline use).

DEVPOST.md (paste-ready, no em dashes) must include:
- Track alignment: Track 4 primary, with how Tracks 2, 3, 5, and 7 elements support it.
- Project description: problem, solution, target users, expected impact on ecosystem and human health.
- How it addresses each judging criterion: Impact (30%), Innovation (20%), Technical (20%), UX (15%), Feasibility (15%).
- Honest limitations, including that the demo uses sample data.
- Links: repo, live demo, video.

## 16. Demo video script (3 to 5 minutes)

1. 0:00 to 0:30: The problem. Volunteers collect data and never hear what it means.
2. 0:30 to 1:15: Open the map, tap Maple Creek, show the score, trend, and risk chips. Press play on the 2-minute adult briefing with captions.
3. 1:15 to 2:00: Show the source line and One Health cards. Switch to the child level and replay a short clip.
4. 2:00 to 3:00: Validation. Show the flagged "fish seen but heavily polluted" entry in the review queue. Correct it and show the briefing update.
5. 3:00 to 3:45: Contribute an observation, watch the score change, earn a badge.
6. 3:45 to 4:30: Architecture in one slide: code computes, LLM narrates, verifier checks, humans confirm. Show the FHIR export.
7. 4:30 to 5:00: Impact and scale. Close on the tagline.

## 17. Submission checklist

- [ ] Track stated: Track 4 (Awareness & Storytelling)
- [ ] Project description pasted from DEVPOST.md
- [ ] Demo video (3 to 5 minutes) uploaded and linked
- [ ] Public GitHub repo with source and documentation
- [ ] Live prototype link works in a clean browser profile
- [ ] Sample data disclosure visible in app, README, and Devpost
- [ ] No secrets committed, `.env.example` present
- [ ] Submitted at least 1 hour before the deadline
- [ ] Confirm the hackathon period and deadline with oneaquahealth@ieee.org if still unclear

## 18. Risks and mitigations

- No real data access: use labeled sample data, keep the pipeline schema-driven.
- LLM drift or invented numbers: verifier plus deterministic fallback plus pre-generated briefings.
- Gemini TTS latency, quota, or preview-model changes: per-beat chunking with prefetch, aggressive caching, committed pre-generated audio for the demo, and automatic fallback to the browser voice.
- Browser voice inconsistency across devices (fallback only): sentence-by-sentence queue and voice selection.
- API outage during demo: `DEMO_FALLBACK=true` and pre-generated briefings.
- Time pressure: follow phase order strictly, and commit working increments after each phase.
