import { useAuth } from './AuthContext';

export const colors = {
  bg: '#F6F8F5',
  card: '#FFFFFF',
  text: '#16211B',
  muted: '#5B6B62',
  border: '#DCE4DE',
  primary: '#1F7A4D',
  primaryDark: '#155C39',
  primarySoft: '#E3F2E9',
  water: '#1E6FB8',
  waterSoft: '#E2EEF9',
  // karar renkleri — renk tek başına anlam taşımaz, her zaman simge + metin ile birlikte
  ok: '#1F7A4D', okSoft: '#E3F2E9',
  warn: '#A15C00', warnSoft: '#FFF2DC',
  danger: '#B42318', dangerSoft: '#FDE8E6',
  info: '#3D5A80', infoSoft: '#E7EEF7',
};

export const VERDICT = {
  suitable:   { color: colors.ok, bg: colors.okSoft, icon: '✅', title: 'Diyetinize uygun' },
  caution:    { color: colors.warn, bg: colors.warnSoft, icon: '⚠️', title: 'Dikkatli tüketin' },
  unsuitable: { color: colors.danger, bg: colors.dangerSoft, icon: '⛔', title: 'Diyetinize uygun değil' },
  unknown:    { color: colors.info, bg: colors.infoSoft, icon: '❔', title: 'Değerlendirilemedi' },
};

export const SEVERITY = {
  danger:  { color: colors.danger, bg: colors.dangerSoft, icon: '⛔' },
  warning: { color: colors.warn, bg: colors.warnSoft, icon: '⚠️' },
  info:    { color: colors.info, bg: colors.infoSoft, icon: 'ℹ️' },
  ok:      { color: colors.ok, bg: colors.okSoft, icon: '✓' },
};

export const MEAL_LABEL = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Ara öğün' };
export const DAY_LABEL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

/** Yaşlı kullanıcılar için "büyük yazı" ayarına göre yazı boyutu */
export function useFont() {
  const { user } = useAuth() || {};
  const k = user?.large_text ? 1.25 : 1;
  return (size) => Math.round(size * k);
}
