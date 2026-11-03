/*
 * Draft generated for review by qualified counsel. Not legal advice.
 *
 * The site owner's details, used by every legal page. Values in square brackets are
 * placeholders that the owner must fill in; never replace them with guesses.
 */
export const OWNER = {
  company: '[COMPANY NAME, e.g. SAS]',
  address: '[ADDRESS]',
  numbers: '[NUMBERS]',
  director: '[NAME]',
  email: '[EMAIL]',
  host: '[HOST DETAILS]',
};

export const UPDATED = { en: '3 November 2026 (draft)', bg: '3 ноември 2026 г. (проект)' };

export type LegalBlock = {
  /** Anchor id, so other pages can link to a section. */
  id?: string;
  h: string;
  p?: string[];
  list?: string[];
  /** First row is the header row. */
  table?: string[][];
};

export type LegalDoc = { title: string; summary: string; blocks: LegalBlock[] };
export type LegalSet = { en: LegalDoc; bg: LegalDoc };
