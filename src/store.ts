import { create } from 'zustand';
import type { CoverData, CoverSettings } from './types';
import { DEFAULT_DATA, DEFAULT_SETTINGS } from './constants';

export interface CoverState extends CoverData, CoverSettings {
  set: (patch: Partial<CoverData & CoverSettings>) => void;
  reset: () => void;
}

export const useCover = create<CoverState>((set) => ({
  ...DEFAULT_DATA,
  ...DEFAULT_SETTINGS,
  set: (patch) => set(patch),
  reset: () => set({ ...DEFAULT_DATA, ...DEFAULT_SETTINGS }),
}));

const DATA_KEYS: (keyof CoverData)[] = [
  'universityName',
  'department',
  'courseTitle',
  'courseCode',
  'assignmentTitle',
  'studentName',
  'studentId',
  'session',
  'year',
  'semester',
  'instructorName',
  'instructorDesignation',
  'submissionDate',
];

const SETTING_KEYS: (keyof CoverSettings)[] = [
  'accentColor',
  'borderStyle',
  'logoDataUrl',
  'logoShape',
  'logoSize',
  'fontKey',
  'backgroundKey',
  'contentScale',
];

/** Pick only persistable data/settings (drops actions and unknown fields). */
export function pickPersistable(s: CoverState): { data: CoverData; settings: CoverSettings } {
  const data: Record<string, unknown> = {};
  for (const k of DATA_KEYS) data[k] = s[k];
  const settings: Record<string, unknown> = {};
  for (const k of SETTING_KEYS) settings[k] = s[k];
  return { data: data as unknown as CoverData, settings: settings as unknown as CoverSettings };
}
