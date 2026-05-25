export const GIFT_CARD_TEMPLATES = [
  { id: 1, name: 'BLUE CARD', className: 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900' },
  { id: 2, name: 'NEON CARD', className: 'bg-zinc-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' },
  { id: 3, name: 'GOLD CARD', className: 'bg-linear-to-br from-yellow-400 via-amber-500 to-orange-600' },
  { id: 4, name: 'ROSE CARD', className: 'bg-linear-to-br from-rose-500 via-pink-600 to-fuchsia-700' },
  { id: 5, name: 'EMERALD CARD', className: 'bg-linear-to-br from-emerald-500 via-green-600 to-teal-800' },
  { id: 6, name: 'PURPLE CARD', className: 'bg-linear-to-br from-purple-600 via-violet-700 to-indigo-950' },
  { id: 7, name: 'ORANGE CARD', className: 'bg-linear-to-br from-orange-400 via-red-500 to-rose-600' },
  { id: 9, name: 'OCEAN CARD', className: 'bg-linear-to-br from-blue-500 via-cyan-500 to-indigo-900' },
  { id: 10, name: 'CYAN CARD', className: 'bg-linear-to-br from-cyan-300 via-cyan-500 to-teal-700' },
  { id: 11, name: 'RUBY CARD', className: 'bg-linear-to-br from-red-500 via-rose-700 to-zinc-950' },
];

export type GiftCardTemplate = (typeof GIFT_CARD_TEMPLATES)[number];

export function getGiftCardTemplate(templateId?: number | null) {
  if (templateId === 8) {
    return GIFT_CARD_TEMPLATES[1];
  }

  return GIFT_CARD_TEMPLATES.find((template) => template.id === templateId) || GIFT_CARD_TEMPLATES[0];
}
