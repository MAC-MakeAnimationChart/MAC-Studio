// Fonts a user can pick for the text inside a chart (title, axes, legend, source line).
//
// This list is separate from the site's own font (S-Core Dream, loaded in app/layout.tsx):
// the chart is an SVG that is exported as an image, and the browser can only draw a font into
// that image if it is installed on the user's computer. So these are system font stacks, and
// what you see in the editor is what the exported file contains.
//
// PLACEHOLDER LIST. The final ~10 fonts are still to be decided: edit this array (id, label,
// stack) and nothing else needs to change. Keep `id`s stable once charts have been saved with
// them; an unknown id falls back to the first entry.
export type ChartFont = { id: string; label: string; stack: string }

export const CHART_FONTS: ChartFont[] = [
  {
    id: 'system',
    label: '기본 (시스템)',
    stack: "system-ui, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  {
    id: 'malgun',
    label: '맑은 고딕',
    stack: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  {
    id: 'gulim',
    label: '굴림',
    stack: "Gulim, 'Apple SD Gothic Neo', sans-serif",
  },
  {
    id: 'dotum',
    label: '돋움',
    stack: "Dotum, 'Apple SD Gothic Neo', sans-serif",
  },
  { id: 'batang', label: '바탕', stack: 'Batang, AppleMyungjo, serif' },
  { id: 'gungsuh', label: '궁서', stack: 'Gungsuh, AppleMyungjo, serif' },
  {
    id: 'arial',
    label: 'Arial',
    stack: "Arial, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  {
    id: 'times',
    label: 'Times New Roman',
    stack: "'Times New Roman', Batang, AppleMyungjo, serif",
  },
  {
    id: 'georgia',
    label: 'Georgia',
    stack: 'Georgia, Batang, AppleMyungjo, serif',
  },
  { id: 'courier', label: 'Courier New', stack: "'Courier New', monospace" },
]

export const DEFAULT_FONT = CHART_FONTS[0].id

export const fontStack = (id: string) => (CHART_FONTS.find((f) => f.id === id) ?? CHART_FONTS[0]).stack
