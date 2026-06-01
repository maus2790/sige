import { Baby, Cake, CalendarDays, Gift, GraduationCap, Handshake, Heart, Home, PartyPopper, Sparkles, TreePine } from 'lucide-react';

export const GIFT_CARD_MAX_MESSAGE_LENGTH = 60;

export const GIFT_CARD_OCCASIONS = [
  { id: 'cumpleanos', label: 'Cumpleanos', icon: Cake },
  { id: 'boda', label: 'Boda', icon: Heart },
  { id: 'graduacion', label: 'Graduacion', icon: GraduationCap },
  { id: 'aniversario', label: 'Aniversario', icon: CalendarDays },
  { id: 'nacimiento', label: 'Nacimiento', icon: Baby },
  { id: 'agradecimiento', label: 'Gracias', icon: Handshake },
  { id: 'navidad', label: 'Navidad', icon: TreePine },
  { id: 'san-valentin', label: 'San Valentin', icon: Sparkles },
  { id: 'hogar', label: 'Hogar', icon: Home },
  { id: 'otros', label: 'Otros', icon: PartyPopper },
];

export const GIFT_CARD_MESSAGES: Record<string, string[]> = {
  cumpleanos: [
    'Feliz cumpleanos, que disfrutes tu dia.',
    'Un regalo para celebrar lo especial que eres.',
    'Que este detalle te saque una sonrisa.',
  ],
  boda: [
    'Felicidades por esta nueva etapa.',
    'Que su vida juntos este llena de alegria.',
    'Un detalle para celebrar su amor.',
  ],
  graduacion: [
    'Felicidades, tu esfuerzo valio la pena.',
    'Que este logro sea el inicio de muchos mas.',
    'Estoy muy orgulloso de ti.',
  ],
  aniversario: [
    'Feliz aniversario, por muchos momentos mas.',
    'Gracias por compartir tanto conmigo.',
    'Un detalle para un dia especial.',
  ],
  nacimiento: [
    'Bienvenido al mundo, con mucho carino.',
    'Un detalle para esta nueva alegria.',
    'Felicidades por el nuevo integrante.',
  ],
  agradecimiento: [
    'Gracias por todo tu apoyo.',
    'Un pequeno gesto para agradecerte.',
    'Aprecio mucho lo que hiciste por mi.',
  ],
  navidad: [
    'Feliz Navidad, con mucho carino.',
    'Que estas fiestas lleguen llenas de alegria.',
    'Un detalle especial para cerrar el ano.',
  ],
  'san-valentin': [
    'Con carino para alguien especial.',
    'Gracias por hacer mis dias mejores.',
    'Un detalle para celebrar lo que siento.',
  ],
  hogar: [
    'Que tu hogar se llene de buenos momentos.',
    'Un detalle para esta nueva etapa.',
    'Felicidades por tu nuevo espacio.',
  ],
  otros: [
    'Un detalle especial para ti.',
    'Pensando en ti, espero que te guste.',
    'Que disfrutes mucho este regalo.',
  ],
};

export function getGiftCardOccasion(occasion?: string | null) {
  return GIFT_CARD_OCCASIONS.find((item) => item.id === occasion) || GIFT_CARD_OCCASIONS[GIFT_CARD_OCCASIONS.length - 1];
}

export function getGiftCardMessages(occasion?: string | null) {
  return GIFT_CARD_MESSAGES[occasion || 'otros'] || GIFT_CARD_MESSAGES.otros;
}
