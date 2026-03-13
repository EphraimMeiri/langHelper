export type SegmentType = 'root' | 'prefix' | 'suffix' | 'infix' | 'vowel';

export interface Segment {
  text: string;
  type: SegmentType;
}

export interface VerbForm {
  form: string;
  segments: Segment[];
  notes?: string;
}

export interface TenseConjugation {
  [personNumberGender: string]: VerbForm;
}

export interface StemConjugation {
  [tense: string]: TenseConjugation;
}

export interface VerbTable {
  id: string;
  languageId: string;
  class: string;
  classDisplayName: string;
  paradigmRoot: string;
  rootMeaning?: string;
  stems: {
    [stem: string]: StemConjugation;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerbTableSummary {
  id: string;
  class: string;
  classDisplayName: string;
  paradigmRoot: string;
  stemCount: number;
}

export function createEmptyVerbForm(): VerbForm {
  return {
    form: '',
    segments: [],
  };
}

export function createSegment(text: string, type: SegmentType): Segment {
  return { text, type };
}

export function formToString(form: VerbForm): string {
  return form.form;
}

export function segmentsToString(segments: Segment[]): string {
  return segments.map(s => s.text).join('');
}

export function getAllFormsFromTable(table: VerbTable): VerbForm[] {
  const forms: VerbForm[] = [];
  for (const stem of Object.values(table.stems)) {
    for (const tense of Object.values(stem)) {
      for (const form of Object.values(tense)) {
        if (form.form) {
          forms.push(form);
        }
      }
    }
  }
  return forms;
}
