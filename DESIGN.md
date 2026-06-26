# Parallel Timeline — High-Level Design

> A phone-first, web-based app for exploring history as **parallel horizontal lanes**.
> Regions, themes, or long-running events become lanes; point events and time spans
> are placed along a shared horizontal time axis. The core idea is to make it easy to
> see *what was happening elsewhere* at a given moment — e.g. "what was happening in
> India during the 1848 revolutions in Europe."

**Status:** design draft for Claude Code handoff. Not yet implemented.
**Platform target:** responsive HTML/JS web app, phone-first, later wrappable as an Android app (Capacitor/TWA).

---

## 1. Goals & non-goals

### Goals
- **Parallel lanes.** Multiple stacked horizontal lanes sharing one time axis. A lane = a region, a theme, or a long event.
- **Point + span events.** Support both instantaneous events (a battle) and durations (WW2).
- **Two-axis zoom.**
  - *Horizontal zoom* changes time density: zooming in surfaces less-important events; zooming out collapses them.
  - *Vertical expand* drills a lane into sub-lanes (e.g. WW2 → theaters, key movements, phases).
- **Intuitive editing.** Add, rename, reorder (drag), and remove lanes directly on a phone.
- **Lightweight & offline-capable.** Single deployable bundle, works without a live backend once data is cached.
- **Extensible data.** Hand-authored data first; optional auto-population from Wikidata later.

### Non-goals (v1)
- No account system, no cloud sync, no multi-user collaboration.
- No full Wikipedia preprocessing — Wikidata import is an *optional adapter*, not the core.
- No map view (Running Reality already owns that metaphor).

---

## 2. Prior art (why this is differentiated)
- **Histropedia** — auto-sources timelines from Wikidata; great density handling, but organized by event density, *not* by geographic/thematic lanes. (HistropediaJS engine is non-commercial license — avoid as a hard dependency.)
- **Running Reality** — world-state-at-a-date via a map; different metaphor.
- **Timetoast / Office Timeline / Aeon Timeline** — support lanes/swimlanes but are manual authoring/presentation tools, not auto-populated explorers.

**Our wedge:** lanes-as-regions + level-of-detail zoom in *both* axes + clean phone UX. No existing tool combines these well.

---

## 3. Core concepts & data model

### Entities
- **Timeline** — the whole document; owns lanes and global view state.
- **Lane** — a horizontal track. Has a kind (`region` | `theme` | `event`), a title, an order index, and an optional parent lane (for vertical drill-down).
- **Event** — placed on a lane. Either a **point** (single date) or a **span** (start + end). Carries an `importance` score that drives level-of-detail.

### Suggested shape (JSON, illustrative — Claude Code to finalize)
```jsonc
{
  "id": "tl_world",
  "title": "World History",
  "lanes": [
    {
      "id": "lane_europe",
      "kind": "region",
      "title": "Europe",
      "order": 0,
      "parentId": null
    },
    {
      "id": "lane_india",
      "kind": "region",
      "title": "India",
      "order": 1,
      "parentId": null
    }
  ],
  "events": [
    {
      "id": "ev_1848",
      "laneId": "lane_europe",
      "title": "Revolutions of 1848",
      "kind": "span",
      "start": { "year": 1848 },
      "end":   { "year": 1849 },
      "importance": 90
    },
    {
      "id": "ev_dalhousie",
      "laneId": "lane_india",
      "title": "Dalhousie arrives as Governor-General",
      "kind": "point",
      "date": { "year": 1848 },
      "importance": 60
    }
  ]
}
```

### Date representation
- A `date` is `{ year, month?, day? }`. **Year may be negative** for BCE.
- Support `circa` / uncertainty as a boolean flag plus optional `precision` (`day` | `month` | `year` | `decade` | `century`). Render uncertain dates with a softened visual (dotted edge).
- All comparisons run on a single normalized numeric time value (e.g. fractional year) so zoom math stays simple.

### Importance & level-of-detail (LOD)
- Every event has an `importance` (0–100).
- The current horizontal zoom defines a **visibility threshold**. Zoomed out → only high-importance events render; zoom in → threshold drops and minor events fade in.
- This is the single most important UX mechanism — it prevents the "too many dots" overload that sinks comparable tools.

---

## 4. Interaction design

### Horizontal zoom (time density)
- Pinch / scroll-zoom along the time axis.
- Zoom level maps to a **pixels-per-year** scale and an **importance threshold**.
- Events appear/disappear with a short fade as they cross the threshold — never pop harshly.
- Labels collapse to ticks when space is tight; tap a tick to reveal.

### Vertical expand (drill-down)
- Tapping a lane's expand affordance splits it into **child sub-lanes**.
  - WW2 lane → European Theater / Pacific Theater / Home Front, etc.
  - A region lane → politics / science / culture sub-lanes.
- Child lanes share the parent's time axis and inherit its horizontal position.
- Collapsing re-merges children into the summary lane.
- Sub-lane data can be authored explicitly or generated (later) from a parent event's structure.

### Lane management (phone-friendly)
- **Add lane**: floating "+" → choose kind + title.
- **Reorder**: long-press drag handle, vertical drag to reorder; haptic feedback on Android.
- **Rename**: tap title inline.
- **Remove**: swipe or context menu, with undo snackbar.
- Lane header column is **sticky on the left**; time content scrolls horizontally beneath it.

### Navigation
- Infinite horizontal scroll in both directions (past ↔ future).
- "Jump to year" input and a "fit all events" button.
- Optional minimap strip showing event density across the full range.

---

## 5. Architecture

### Rendering strategy
- **Time axis + lanes** rendered on a single virtualized surface.
- Recommended: **Canvas (or WebGL)** for the event/lane layer (smooth zoom, thousands of events), with an **HTML/DOM overlay** for interactive bits (selected event card, lane headers, edit controls). Pure DOM is acceptable for an early prototype but will not scale to dense datasets.
- **Virtualization**: only render events within the visible time window + a small buffer. This is what keeps it fast on a phone.
- **Lane packing**: within a lane, place overlapping spans on stacked rows so they don't collide. Keep a simple greedy interval-packing algorithm.

### Suggested stack
- **Framework**: React (or Preact for size) + TypeScript.
- **State**: lightweight store (Zustand or similar) holding timeline doc + view state (scale, offset, expanded lanes, selection).
- **Styling**: utility CSS (Tailwind) for the polished, consistent phone UI.
- **Build**: Vite. Single static bundle, deployable to any static host.
- **Persistence (v1)**: local storage / IndexedDB for the user's timeline doc; export/import as JSON.
- **Android packaging (later)**: Capacitor (full app) or TWA (thin wrapper). Keep everything offline-capable and avoid hard runtime backend deps so wrapping stays trivial.

### Layering (conceptual)
```
┌──────────────────────────────────────────────┐
│ UI shell: toolbar, add-lane, jump-to-year     │  DOM
├──────────────┬───────────────────────────────┤
│ Lane headers │   Time content (events/spans)  │  headers DOM · content Canvas
│ (sticky L)   │   + DOM overlay for selection  │
├──────────────┴───────────────────────────────┤
│ Time axis ruler + minimap                     │  Canvas/DOM
└──────────────────────────────────────────────┘
        ▲ view state: scale, offset, threshold, expanded lanes
        ▲ data: timeline doc (lanes, events)
```

---

## 6. Data sources & extensibility
- **v1 — hand-authored JSON.** Ship a curated demo dataset (e.g. the 1848 cross-section across several regions). Authorable by hand or via a simple editor.
- **v2 — Wikidata adapter (optional).** A SPARQL query layer maps Wikidata properties into the data model:
  - point in time → `point` event
  - start / end time → `span` event
  - country / location → lane assignment
  - sitelink count or similar → seed for `importance`
  - Cache query results so the app stays offline-capable; never block the UI on a live query.
- Keep the importer behind a clean interface so other sources (CSV, a Google Sheet, a user's own life events) can plug in.

---

## 7. Suggested build phases (for Claude Code)
1. **Static skeleton** — time axis + fixed lanes + hard-coded events, horizontal scroll only.
2. **Horizontal zoom + LOD** — pixels-per-year scale, importance threshold, fade in/out.
3. **Lane editing** — add / rename / reorder (drag) / remove, sticky headers, undo.
4. **Vertical drill-down** — expand a lane into child sub-lanes and collapse back.
5. **Persistence + import/export** — IndexedDB, JSON in/out.
6. **Polish pass** — animation easing, haptics, minimap, jump-to-year, empty states.
7. **Wikidata adapter** (optional) — SPARQL → data model, cached.
8. **Android packaging** — Capacitor/TWA wrap, offline verification.

---

## 8. Open design questions
- How is `importance` sourced for hand-authored events — manual, or derived (e.g. Wikidata sitelinks)?
- Vertical drill-down: author sub-lanes explicitly, or auto-derive from a span event's child events?
- How many LOD tiers feel right (e.g. 3–4 importance bands), and how do thresholds map to zoom?
- Cross-lane relationship lines (cause/effect connectors) — v1 or later?
- BCE / deep-time and circa rendering: how prominent should uncertainty cues be?

---

## 9. Definition of done (v1)
- Loads on a phone browser, smooth at 60fps while panning/zooming a few hundred events.
- User can add, rename, reorder, and delete lanes with touch.
- Horizontal zoom visibly changes event density via LOD.
- At least one lane can expand into sub-lanes and collapse back.
- Timeline persists locally and can be exported/imported as JSON.
- Ships with a curated demo dataset (the 1848 cross-section).
