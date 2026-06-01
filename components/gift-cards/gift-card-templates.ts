export const GIFT_CARD_TEMPLATES = [
  { id: 1, name: 'BLUE CARD', className: 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900' },
  { id: 2, name: 'GOLD CARD', className: 'bg-linear-to-br from-yellow-300 via-amber-500 to-orange-700' },
  { id: 3, name: 'BLACK CARD', className: 'bg-linear-to-br from-zinc-950 via-cyan-950 to-cyan-600 border border-cyan-300/40 shadow-[0_0_24px_rgba(34,211,238,0.28)]' },
  { id: 4, name: 'ROSE CARD', className: 'bg-linear-to-br from-rose-400 via-pink-600 to-fuchsia-900' },
  { id: 5, name: 'EMERALD CARD', className: 'bg-linear-to-br from-emerald-300 via-emerald-600 to-green-950' },
  { id: 6, name: 'PURPLE CARD', className: 'bg-linear-to-br from-violet-300 via-purple-700 to-indigo-950' },
  { id: 7, name: 'OCEAN CARD', className: 'bg-linear-to-br from-sky-300 via-blue-600 to-blue-950' },
  { id: 8, name: 'SUNSET CARD', className: 'bg-linear-to-br from-orange-300 via-red-500 to-rose-800' },
  { id: 9, name: 'CYAN CARD', className: 'bg-linear-to-br from-cyan-200 via-cyan-500 to-teal-800' },
  { id: 10, name: 'RUBY CARD', className: 'bg-linear-to-br from-red-400 via-rose-700 to-stone-950' },
];

export type GiftCardTemplate = (typeof GIFT_CARD_TEMPLATES)[number];

export function getGiftCardTemplate(templateId?: number | null) {
  return GIFT_CARD_TEMPLATES.find((template) => template.id === templateId) || GIFT_CARD_TEMPLATES[0];
}
