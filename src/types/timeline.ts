// Core data model for cohistory (DESIGN.md §3).
// Hand-authored first; shaped so an optional Wikidata/CSV adapter can emit it later.

import type { Category } from '../categories'

/** Precision of a historical date — drives uncertainty rendering. */
export type Precision = 'day' | 'month' | 'year' | 'decade' | 'century'

/**
 * A historical date. `year` may be negative for BCE (astronomical numbering:
 * year 0 == 1 BCE). `month`/`day` are optional; absence means year-level precision.
 */
export interface HDate {
  year: number
  month?: number // 1-12
  day?: number // 1-31
  circa?: boolean
  precision?: Precision
}

export type LaneKind = 'region' | 'theme' | 'event'

/** A horizontal track. `parentId` supports vertical drill-down (Phase 4). */
export interface Lane {
  id: string
  kind: LaneKind
  title: string
  order: number
  parentId: string | null
}

interface EventBase {
  id: string
  laneId: string
  title: string
  /** 0-100; drives level-of-detail visibility (Phase 2). */
  importance: number
  /** Optional explicit category; otherwise inferred from the title. */
  category?: Category
}

/** An instantaneous event (a battle, an election). */
export interface PointEvent extends EventBase {
  kind: 'point'
  date: HDate
}

/** A duration (a war, a parliament, a famine). */
export interface SpanEvent extends EventBase {
  kind: 'span'
  start: HDate
  end: HDate
}

export type TimelineEvent = PointEvent | SpanEvent

/** The whole document: lanes + events sharing one time axis. */
export interface Timeline {
  id: string
  title: string
  lanes: Lane[]
  events: TimelineEvent[]
}
