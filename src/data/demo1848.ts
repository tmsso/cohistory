import type { Timeline } from '../types/timeline'

// Curated "1848 cross-section": what was happening across several regions around
// the Revolutions of 1848. Importance values are hand-authored (DESIGN.md §8 open
// question — manual for now). Window roughly 1845–1852.

export const demo1848: Timeline = {
  id: 'tl_1848',
  title: '1848 — A World in Revolt',
  lanes: [
    { id: 'lane_france', kind: 'region', title: 'France', order: 0, parentId: null },
    { id: 'lane_german', kind: 'region', title: 'German States', order: 1, parentId: null },
    { id: 'lane_habsburg', kind: 'region', title: 'Habsburg Empire', order: 2, parentId: null },
    { id: 'lane_italy', kind: 'region', title: 'Italian States', order: 3, parentId: null },
    { id: 'lane_britain', kind: 'region', title: 'Britain & Ireland', order: 4, parentId: null },
    { id: 'lane_india', kind: 'region', title: 'India', order: 5, parentId: null },
  ],
  events: [
    // France
    {
      id: 'ev_fr_feb', laneId: 'lane_france', kind: 'point', importance: 95,
      title: 'February Revolution', date: { year: 1848, month: 2, day: 23 },
    },
    {
      id: 'ev_fr_abdic', laneId: 'lane_france', kind: 'point', importance: 78,
      title: 'Louis-Philippe abdicates', date: { year: 1848, month: 2, day: 24 },
    },
    {
      id: 'ev_fr_republic', laneId: 'lane_france', kind: 'span', importance: 70,
      title: 'Second Republic', start: { year: 1848, month: 2 }, end: { year: 1852, month: 12 },
    },
    {
      id: 'ev_fr_june', laneId: 'lane_france', kind: 'span', importance: 74,
      title: 'June Days uprising', start: { year: 1848, month: 6, day: 22 }, end: { year: 1848, month: 6, day: 26 },
    },
    {
      id: 'ev_fr_louisnap', laneId: 'lane_france', kind: 'point', importance: 82,
      title: 'Louis-Napoléon elected President', date: { year: 1848, month: 12, day: 10 },
    },
    {
      id: 'ev_fr_coup', laneId: 'lane_france', kind: 'point', importance: 80,
      title: 'Coup of 2 December', date: { year: 1851, month: 12, day: 2 },
    },

    // German States
    {
      id: 'ev_de_march', laneId: 'lane_german', kind: 'point', importance: 85,
      title: 'March Revolution', date: { year: 1848, month: 3 },
    },
    {
      id: 'ev_de_frankfurt', laneId: 'lane_german', kind: 'span', importance: 80,
      title: 'Frankfurt Parliament', start: { year: 1848, month: 5, day: 18 }, end: { year: 1849, month: 5, day: 31 },
    },
    {
      id: 'ev_de_crown', laneId: 'lane_german', kind: 'point', importance: 62,
      title: 'Friedrich Wilhelm IV refuses the crown', date: { year: 1849, month: 4, day: 3 },
    },

    // Habsburg Empire
    {
      id: 'ev_at_vienna', laneId: 'lane_habsburg', kind: 'point', importance: 80,
      title: 'Vienna Uprising', date: { year: 1848, month: 3, day: 13 },
    },
    {
      id: 'ev_at_metternich', laneId: 'lane_habsburg', kind: 'point', importance: 76,
      title: 'Metternich flees', date: { year: 1848, month: 3, day: 13 },
    },
    {
      id: 'ev_at_hungary', laneId: 'lane_habsburg', kind: 'span', importance: 90,
      title: 'Hungarian Revolution', start: { year: 1848, month: 3, day: 15 }, end: { year: 1849, month: 10, day: 4 },
    },
    {
      id: 'ev_at_fj', laneId: 'lane_habsburg', kind: 'point', importance: 70,
      title: 'Franz Joseph I accedes', date: { year: 1848, month: 12, day: 2 },
    },

    // Italian States
    {
      id: 'ev_it_war', laneId: 'lane_italy', kind: 'span', importance: 80,
      title: 'First War of Independence', start: { year: 1848, month: 3, day: 23 }, end: { year: 1849, month: 3, day: 24 },
    },
    {
      id: 'ev_it_milan', laneId: 'lane_italy', kind: 'span', importance: 68,
      title: 'Five Days of Milan', start: { year: 1848, month: 3, day: 18 }, end: { year: 1848, month: 3, day: 22 },
    },
    {
      id: 'ev_it_roman', laneId: 'lane_italy', kind: 'span', importance: 66,
      title: 'Roman Republic', start: { year: 1849, month: 2, day: 9 }, end: { year: 1849, month: 7, day: 4 },
    },

    // Britain & Ireland
    {
      id: 'ev_gb_famine', laneId: 'lane_britain', kind: 'span', importance: 86,
      title: 'Great Famine', start: { year: 1845 }, end: { year: 1852 }, // span dates approximate
    },
    {
      id: 'ev_gb_chartist', laneId: 'lane_britain', kind: 'point', importance: 70,
      title: 'Chartist meeting, Kennington Common', date: { year: 1848, month: 4, day: 10 },
    },
    {
      id: 'ev_gb_young', laneId: 'lane_britain', kind: 'point', importance: 55,
      title: 'Young Irelander Rebellion', date: { year: 1848, month: 7, day: 29 },
    },

    // India
    {
      id: 'ev_in_dalhousie', laneId: 'lane_india', kind: 'point', importance: 64,
      title: 'Dalhousie, Governor-General', date: { year: 1848, month: 1, day: 12 },
    },
    {
      id: 'ev_in_sikh', laneId: 'lane_india', kind: 'span', importance: 72,
      title: 'Second Anglo-Sikh War', start: { year: 1848, month: 4 }, end: { year: 1849, month: 3 },
    },
    {
      id: 'ev_in_punjab', laneId: 'lane_india', kind: 'point', importance: 75,
      title: 'Annexation of the Punjab', date: { year: 1849, month: 3, day: 29 },
    },
  ],
}
