import { useEffect, useState } from "react";

/**
 * Telegram Web App SDK wrapper.
 *
 * Asosiy funksiyalar:
 *  • tgUser           — Telegram'dagi foydalanuvchi (id, first_name, username)
 *  • isInsideTelegram — Telegram WebApp ichida ekanligini bildiradi
 *  • haptic           — tactile feedback
 *  • showMainButton   — Telegram'ning native main button
 */

const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

export function useTelegram() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      setReady(true);
    } else {
      // Browser test
      setReady(true);
    }
  }, []);

  const tgUser = tg?.initDataUnsafe?.user || null;

  return {
    tg,
    ready,
    // Telegram foydalanuvchisi
    tgUser,
    tgUserId: tgUser?.id || null,
    tgFullName: tgUser
      ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ")
      : null,
    tgUsername: tgUser?.username || null,
    isInsideTelegram: !!tg?.initDataUnsafe?.user,
    // Theme
    colorScheme: tg?.colorScheme || "light",
    themeParams: tg?.themeParams || {},
    // Native UI
    showMainButton: (text, onClick) => {
      if (!tg) return;
      tg.MainButton.setText(text);
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
    },
    hideMainButton: () => tg?.MainButton?.hide(),
    showBackButton: (onClick) => {
      if (!tg) return;
      tg.BackButton.onClick(onClick);
      tg.BackButton.show();
    },
    hideBackButton: () => tg?.BackButton?.hide(),
    // Haptic feedback
    haptic: (type = "light") => tg?.HapticFeedback?.impactOccurred(type),
    notificationHaptic: (type = "success") =>
      tg?.HapticFeedback?.notificationOccurred(type),
    close: () => tg?.close(),
  };
}
