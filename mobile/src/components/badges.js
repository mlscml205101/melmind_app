import { Alert } from 'react-native';

/** Yeni kazanılan rozetleri kutlar */
export function showBadges(list) {
  if (!list || !list.length) return;
  const text = list.map((b) => `${b.icon} ${b.title} — ${b.desc}`).join('\n');
  setTimeout(() => Alert.alert(list.length > 1 ? 'Yeni rozetler kazandınız! 🎉' : 'Yeni rozet kazandınız! 🎉', text), 400);
}
