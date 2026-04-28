// ─── Konstantalar ────────────────────────────────────────────────────────────
// MUHIM: lavhalar (label) endi i18n modulida! Bu fayl faqat emoji, ranglar va
// til-bog'liq bo'lmagan ma'lumotlarni saqlaydi.

export const DIRECTION = {
  bekobod_to_tashkent: { short: 'Б→Т', emoji: '🚀' },
  tashkent_to_bekobod: { short: 'Т→Б', emoji: '🏠' },
};

export const CATEGORY = {
  passenger:             { emoji: '👤' },
  passenger_small_cargo: { emoji: '🎒' },
  cargo:                 { emoji: '📦' },
};

export const CAR_TYPE = {
  any:       { emoji: '🚗' },
  sedan:     { emoji: '🚙' },
  minivan:   { emoji: '🚐' },
  cargo_van: { emoji: '🚛' },
};

export const TRIP_STATUS = {
  active:      { color: 'warning',  emoji: '⏳' },
  accepted:    { color: 'info',     emoji: '✅' },
  in_progress: { color: 'primary',  emoji: '🚗' },
  completed:   { color: 'success',  emoji: '🏁' },
  cancelled:   { color: 'error',    emoji: '❌' },
  expired:     { color: 'default',  emoji: '⌛' },
};

// ─── Formatters ──────────────────────────────────────────────────────────────
// Joriy `lang`'dan navsotim soat formati o'qish kerak emas — Intl API tilni biladi.

export const formatPrice = (n) => {
  if (!n) return '—';
  // Faqat raqam formati uchun; "сўм"/"so'm"/"сум" tarjimon orqali olinadi (kerak bo'lsa)
  return new Intl.NumberFormat('ru-RU').format(n) + ' сўм';
};

export const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatDateOnly = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
};

export const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

// ─── Geografik nuqtalar ──────────────────────────────────────────────────────
// Autocomplete uchun. Ikki tilda ham (kirill — default, kerak bo'lsa keyinchalik
// til-tanlash bilan kengaytirish mumkin).

export const BEKOBOD_POINTS = [
  'Бекобод бозори',
  'Бекобод марказий кўчаси',
  'Сирдарё кўпригi',
  'Бекобод темир йўл вокзали',
  'Янги маҳалла',
  'Металлург маҳалласи',
  'Эски шаҳар',
];

export const TASHKENT_POINTS = [
  'Тошкент — Юнусобод',
  'Тошкент — Чилонзор',
  'Тошкент — Мирзо Улуғбек',
  'Тошкент — Сергели',
  'Тошкент — Шайхонтоҳур',
  'Тошкент — Яккасарой',
  'Тошкент — Олмазор',
  'Тошкент — Учтепа',
  'Тошкент — Бектемир',
  'Тошкент темир йўл вокзали',
  'Тошкент Жанубий автобус бекати',
];
