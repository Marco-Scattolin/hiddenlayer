type ReportSubjectDef = {
  value: string;
  excludes: boolean;
  when: string;
  reviewLabel?: string;
};

export const REPORT_SUBJECTS: readonly ReportSubjectDef[] = [
  {
    value: "Sito rilevato",
    excludes: true,
    when: "Il sito esiste davvero, ma il tool non l'ha trovato o l'ha segnato come assente per errore.",
  },
  {
    value: "Attività non rilevante",
    excludes: true,
    when: "Non è un lead da considerare (es. già seguita da un'altra agenzia).",
  },
  {
    value: "Presenza digitale sottovalutata",
    excludes: false,
    reviewLabel: "Valutare lead",
    when: "L'attività ha già una buona presenza online (es. social forte). Va verificata manualmente per decidere se è comunque un lead valido.",
  },
  {
    value: "Info obsolete",
    excludes: false,
    when: "Indirizzo, telefono o orari sbagliati — l'attività resta potenzialmente valida.",
  },
  {
    value: "Altro",
    excludes: false,
    when: "Qualsiasi altro caso non coperto dalle voci precedenti. Usa le note per spiegare.",
  },
] as const;

export type ReportSubject =
  | "Sito rilevato"
  | "Attività non rilevante"
  | "Presenza digitale sottovalutata"
  | "Info obsolete"
  | "Altro";
