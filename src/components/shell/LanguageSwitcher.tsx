"use client";

import { setLocaleAction } from "@/core/i18n/locale.action";

export function LanguageSwitcher() {
  return (
    <div className="flex gap-2 text-sm">
      <button type="button" onClick={() => setLocaleAction("en")}>EN</button>
      <button type="button" onClick={() => setLocaleAction("ar")}>AR</button>
    </div>
  );
}
