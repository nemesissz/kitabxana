// flag: ISO 3166-1 alpha-2 country code (flag-icons library üçün)
// emoji: suggestion dropdown-da göstərmək üçün (DB-ə saxlanmır)
// aliases: istifadəçinin yaza biləcəyi hər hansı variant (kiçik hərf)
export const KNOWN_LANGUAGES = [
  { code: "az", name: "Azərbaycan dili", flag: "az", emoji: "🇦🇿", aliases: ["az", "azer", "azerbaycan", "azeri", "azerbaijani"] },
  { code: "ru", name: "Rus dili",        flag: "ru", emoji: "🇷🇺", aliases: ["ru", "rus", "russian", "rusca"] },
  { code: "en", name: "İngilis dili",    flag: "gb", emoji: "🇬🇧", aliases: ["en", "ing", "ingilis", "english", "ingilizce"] },
  { code: "tr", name: "Türk dili",       flag: "tr", emoji: "🇹🇷", aliases: ["tr", "turk", "turkish", "türk", "turkce"] },
  { code: "de", name: "Alman dili",      flag: "de", emoji: "🇩🇪", aliases: ["de", "alman", "german", "deutsch", "almanca"] },
  { code: "fr", name: "Fransız dili",    flag: "fr", emoji: "🇫🇷", aliases: ["fr", "fransiz", "french", "fransizca"] },
  { code: "ar", name: "Ərəb dili",       flag: "sa", emoji: "🇸🇦", aliases: ["ar", "ereb", "arab", "arabic", "erebce"] },
  { code: "fa", name: "Fars dili",       flag: "ir", emoji: "🇮🇷", aliases: ["fa", "fars", "persian", "farsi", "iran"] },
  { code: "zh", name: "Çin dili",        flag: "cn", emoji: "🇨🇳", aliases: ["zh", "cin", "chinese", "mandarin"] },
  { code: "es", name: "İspan dili",      flag: "es", emoji: "🇪🇸", aliases: ["es", "ispan", "spanish", "espanol"] },
  { code: "kk", name: "Qazax dili",      flag: "kz", emoji: "🇰🇿", aliases: ["kk", "qazax", "kazakh", "kazak"] },
  { code: "uz", name: "Özbək dili",      flag: "uz", emoji: "🇺🇿", aliases: ["uz", "ozbek", "uzbek"] },
  { code: "uk", name: "Ukrayna dili",    flag: "ua", emoji: "🇺🇦", aliases: ["uk", "ukrayna", "ukrainian"] },
  { code: "ja", name: "Yapon dili",      flag: "jp", emoji: "🇯🇵", aliases: ["ja", "yapon", "japanese"] },
  { code: "ko", name: "Koreya dili",     flag: "kr", emoji: "🇰🇷", aliases: ["ko", "koreya", "korean"] },
];

// İstifadəçinin yazdığı mətnə görə uyğun dilləri qaytarır
export function matchLanguages(input) {
  if (!input || input.trim().length < 2) return [];
  const q = input.trim().toLowerCase();
  return KNOWN_LANGUAGES.filter(lang =>
    lang.aliases.some(a => a.startsWith(q)) ||
    lang.name.toLowerCase().includes(q) ||
    lang.code === q
  ).slice(0, 6);
}
