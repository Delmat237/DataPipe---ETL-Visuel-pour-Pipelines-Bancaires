/**
 * Thème central de DataPipe — source de vérité unique des couleurs.
 *
 * Deux usages :
 *  1. Les variables CSS (globals.css) pour les classes Tailwind/shadcn
 *     (`bg-background`, `text-foreground`, `border-border`, `bg-primary`…).
 *  2. Cet objet `theme` pour les inline-styles (nœuds, arêtes, landing…)
 *     qui ne passent pas par Tailwind.
 *
 * Direction : thème CLAIR — blanc cassé dominant + bleu comme accent unique.
 */

export const theme = {
  // Fonds
  background:   '#f7f8fa',   // blanc cassé légèrement froid (dominante)
  surface:      '#ffffff',   // cartes / panneaux
  surfaceMuted: '#f1f3f7',   // zones secondaires
  canvas:       '#eef1f6',   // fond de l'éditeur

  // Texte
  foreground:   '#0f172a',   // slate-900
  muted:        '#64748b',   // slate-500
  subtle:       '#94a3b8',   // slate-400
  faint:        '#cbd5e1',   // slate-300

  // Bordures
  border:       '#e3e8ef',
  borderStrong: '#cbd5e1',

  // Accent (bleu — unique)
  primary:        '#2563eb',  // blue-600
  primaryHover:   '#1d4ed8',  // blue-700
  primaryFg:      '#ffffff',
  primarySoft:    '#eff4ff',  // blue-50 (fonds d'état actif)
  primarySoftFg:  '#1d4ed8',

  // États
  success: '#16a34a',
  warning: '#d97706',
  danger:  '#dc2626',
  running: '#2563eb',  // exécution = bleu (cohérent avec l'accent)

  // Statuts d'exécution des nœuds
  status: {
    running: '#2563eb',
    queued:  '#7c3aed',
    success: '#16a34a',
    error:   '#dc2626',
  },
} as const

export type Theme = typeof theme

// Helper rgba à partir d'un hex (#rrggbb) — pratique pour les inline-styles
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
