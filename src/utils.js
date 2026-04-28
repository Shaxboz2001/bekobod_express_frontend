// ─── Admin panel uchun konstantalar (Кирилл) ─────────────────────────────────
// Admin panel mahalliy admin xodimi tomonidan ishlatiladi.
// User-facing UI (i18n moduli) bilan farq qiladi.

export const DIRECTION = {
  bekobod_to_tashkent: { label: 'Бекобод → Тошкент', emoji: '🚀' },
  tashkent_to_bekobod: { label: 'Тошкент → Бекобод', emoji: '🏠' },
};

export const CATEGORY = {
  passenger:             { label: 'Йўловчи',              emoji: '👤' },
  passenger_small_cargo: { label: 'Йўловчи + кичик юк',   emoji: '🎒' },
  cargo:                 { label: 'Юк ташиш',             emoji: '📦' },
};

export const TRIP_STATUS = {
  active:      { label: 'Фаол',           color: 'warning' },
  accepted:    { label: 'Қабул қилинди',  color: 'info'    },
  in_progress: { label: 'Йўлда',          color: 'primary' },
  completed:   { label: 'Якунланди',      color: 'success' },
  cancelled:   { label: 'Бекор қилинди',  color: 'error'   },
  expired:     { label: 'Муддати ўтди',   color: 'default' },
};

export const USER_ROLE = {
  admin:     { label: 'Админ',     color: 'error'   },
  driver:    { label: 'Ҳайдовчи',  color: 'info'    },
  passenger: { label: 'Йўловчи',   color: 'default' },
};

export const CAR_TYPE = {
  any:       { label: 'Исталган',     emoji: '🚗' },
  sedan:     { label: 'Седан',        emoji: '🚙' },
  minivan:   { label: 'Минивэн',      emoji: '🚐' },
  cargo_van: { label: 'Юк машинаси',  emoji: '🚛' },
};

export const formatPrice = (n) =>
  n != null ? new Intl.NumberFormat('ru-RU').format(n) + ' сўм' : '—';

export const formatDate = (d) =>
  d ? new Date(d).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';
