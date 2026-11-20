// MelMind Plus tarif defteri — TARİFLERİNİ BURAYA YAZ.
// Her tarif { } bloğudur. Ekle / sil / değiştir, sonra sunucuyu yeniden başlat (baslat.command'ı tekrar çalıştır).
// Alanlar: title (başlık), category (kategori), minutes (süre, dk), servings (kaç kişilik), kcal (porsiyon kalorisi, boş bırakılabilir),
//          ingredients (malzemeler, her satır bir malzeme), instructions (yapılışı)

import { nefisDiyetTarifleri } from './nefisDiyetTarifleri.js';

export const plusRecipes = [
  {
    title: 'Fırında tavuk ve sebze',
    category: 'Ana yemek',
    minutes: 40,
    servings: 2,
    kcal: 420,
    ingredients: `300 g tavuk göğsü
1 kabak
1 havuç
1 yemek kaşığı zeytinyağı
Tuz, karabiber, kekik`,
    instructions: `1. Tavuğu ve sebzeleri küp doğrayın.
2. Zeytinyağı ve baharatla karıştırın.
3. 200 derece fırında 30-35 dakika pişirin.`,
  },
  {
    title: 'Yoğurtlu hindi füme salata',
    category: 'Salata',
    minutes: 10,
    servings: 1,
    kcal: 250,
    ingredients: `4 dilim hindi füme
1 kase yoğurt
1 salatalık
Yeşil salata, limon`,
    instructions: `1. Salatalık ve yeşilliği doğrayın.
2. Hindi fümeyi ekleyin.
3. Yoğurt ve limonla servis edin.`,
  },
  // Nefis Yemek Tarifleri diyet listesi (ayrı dosyada)
  ...nefisDiyetTarifleri,
];
