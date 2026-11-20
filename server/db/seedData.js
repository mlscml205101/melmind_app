// Örnek veriler. Tarif besin değerleri TÜRKOMP'a yakın YAKLAŞIK değerlerdir ve diyetisyen onayı beklemektedir.
// Alerjen kodları: milk (süt ürünü), lactose (laktoz içerir), gluten, egg, peanut, tree_nuts, soy, fish, shellfish, sesame
// Etiketler: diabetes_friendly, low_salt, low_sat_fat, vegetarian, vegan

const R = (name, meal_type, kcal, protein, carbs, fat, sugar, salt, sat, allergens, tags, ingredients, instructions) =>
  ({ name, meal_type, kcal, protein_g: protein, carbs_g: carbs, fat_g: fat, sugar_g: sugar, salt_g: salt, sat_fat_g: sat, allergens, tags, ingredients, instructions });

const DF = 'diabetes_friendly', LS = 'low_salt', LF = 'low_sat_fat', VG = 'vegetarian', VN = 'vegan';

export const recipes = [
  // --- Kahvaltı ---
  R('Sebzeli omlet + tam buğday ekmeği', 'breakfast', 380, 22, 28, 19, 4, 1.0, 5, ['egg', 'gluten'], [DF, VG], '2 yumurta, biber, domates, ıspanak, 1 dilim tam buğday ekmeği, 1 tatlı kaşığı zeytinyağı', 'Sebzeleri zeytinyağında soteleyin, yumurtayı ekleyip pişirin. Ekmekle servis edin.'),
  R('Yulaf lapası (süt + muz + ceviz)', 'breakfast', 360, 13, 50, 12, 16, 0.2, 3, ['gluten', 'milk', 'lactose', 'tree_nuts'], [LS, VG], '40 g yulaf, 200 ml süt, ½ muz, 3 ceviz içi, tarçın', 'Yulafı sütle 5 dk pişirin, muz, ceviz ve tarçın ekleyin.'),
  R('Glutensiz yulaf + badem sütü + çilek', 'breakfast', 320, 9, 48, 10, 10, 0.2, 1, ['tree_nuts'], [DF, LS, LF, VG, VN], '40 g glutensiz sertifikalı yulaf, 200 ml badem sütü, 6 çilek, 1 tatlı kaşığı chia', 'Yulafı badem sütüyle pişirin, üzerine çilek ve chia ekleyin.'),
  R('Beyaz peynir, zeytin, domates-salatalık, tam buğday ekmeği', 'breakfast', 390, 18, 34, 20, 5, 2.4, 8, ['milk', 'lactose', 'gluten'], [VG], '40 g beyaz peynir, 5 zeytin, domates, salatalık, 2 dilim tam buğday ekmeği', 'Tabağa dizip servis edin.'),
  R('Laktozsuz lor peyniri + karabuğday ekmeği + yeşillik', 'breakfast', 340, 20, 36, 12, 4, 0.9, 4, ['milk'], [DF, LS, VG], '80 g laktozsuz lor, 2 dilim karabuğday ekmeği, roka, maydanoz, domates', 'Lorun üzerine yeşillik ve zeytinyağı ekleyin; ekmekle servis edin.'),
  R('Menemen (az yağlı) + glutensiz ekmek', 'breakfast', 330, 15, 30, 16, 7, 0.8, 4, ['egg'], [DF, LS, VG], '2 yumurta, 2 domates, 1 biber, 1 tatlı kaşığı zeytinyağı, 1 dilim glutensiz ekmek', 'Biber ve domatesi pişirin, yumurtayı ekleyip karıştırın.'),
  R('Avokadolu nohut ezmesi + karabuğday krep', 'breakfast', 350, 12, 40, 16, 3, 0.6, 2, [], [DF, LS, LF, VG, VN], '½ avokado, 60 g haşlanmış nohut, limon, 1 karabuğday krep, domates', 'Avokado ve nohudu ezin, krepe sürüp domatesle servis edin.'),
  R('Yoğurtlu meyve kasesi (yoğurt + elma + keten tohumu)', 'breakfast', 300, 14, 38, 9, 24, 0.2, 4, ['milk', 'lactose'], [LS, VG], '200 g yoğurt, 1 elma, 1 yemek kaşığı keten tohumu, tarçın', 'Elmayı doğrayıp yoğurda ekleyin, keten ve tarçın serpin.'),
  R('Tofu menemen + sebze', 'breakfast', 310, 20, 16, 18, 6, 0.7, 3, ['soy'], [DF, LS, LF, VG, VN], '150 g tofu, domates, biber, soğan, zerdeçal, zeytinyağı', 'Tofuyu ufalayıp sebzelerle soteleyin.'),

  // --- Öğle ---
  R('Mercimek çorbası + tam buğday ekmeği', 'lunch', 420, 20, 62, 10, 5, 1.2, 2, ['gluten'], [DF, LF, VG, VN], '1 kase kırmızı mercimek çorbası, 1 dilim tam buğday ekmeği, limon', 'Mercimek, soğan ve havucu haşlayıp blenderdan geçirin.'),
  R('Izgara tavuk salatası', 'lunch', 450, 40, 18, 22, 6, 1.0, 4, [], [DF, LS, LF], '150 g tavuk göğsü, marul, roka, domates, salatalık, zeytinyağı, limon', 'Tavuğu ızgara yapın, salataya ekleyin.'),
  R('Zeytinyağlı taze fasulye + bulgur pilavı', 'lunch', 480, 13, 72, 15, 9, 1.1, 2, ['gluten'], [LF, VG, VN], '250 g taze fasulye, domates, soğan, zeytinyağı, 80 g bulgur pilavı', 'Fasulyeyi domates ve soğanla kısık ateşte pişirin.'),
  R('Nohutlu kinoa salatası', 'lunch', 460, 17, 60, 16, 6, 0.6, 2, [], [DF, LS, LF, VG, VN], '60 g kinoa, 80 g nohut, maydanoz, domates, nar ekşisi, zeytinyağı', 'Kinoayı haşlayın, tüm malzemelerle karıştırın.'),
  R('Ton balıklı salata + glutensiz kraker', 'lunch', 430, 32, 30, 20, 5, 1.3, 3, ['fish'], [DF, LF], '1 kutu süzülmüş ton balığı, mısır, marul, roka, limon, 4 glutensiz kraker', 'Malzemeleri karıştırıp limonla servis edin.'),
  R('Yoğurtlu semizotu + ızgara köfte', 'lunch', 520, 35, 14, 35, 6, 1.6, 13, ['milk', 'lactose'], [DF], '150 g yağsız dana kıyma köfte, semizotu, 100 g yoğurt, sarımsak', 'Köfteleri ızgarada pişirin, semizotunu yoğurtla karıştırın.'),
  R('Fırın sebzeli bulgur pilavı + cacık', 'lunch', 470, 15, 75, 12, 10, 1.0, 3, ['gluten', 'milk', 'lactose'], [LF, VG], '80 g bulgur, kabak, patlıcan, biber, 150 g cacık', 'Sebzeleri fırınlayın, bulgur pilavıyla karıştırın.'),
  R('Kuru fasulye (az yağlı) + esmer pirinç', 'lunch', 500, 22, 80, 9, 6, 1.0, 1, [], [DF, LF, VG, VN], '200 g kuru fasulye yemeği, 70 g esmer pirinç pilavı', 'Fasulyeyi domates ve soğanla pişirin, pilavla servis edin.'),
  R('Tavuklu sebze sote + karabuğday', 'lunch', 480, 36, 46, 14, 7, 0.9, 3, [], [DF, LS, LF], '130 g tavuk, brokoli, havuç, mantar, 60 g karabuğday', 'Tavuk ve sebzeleri soteleyin, haşlanmış karabuğdayla servis edin.'),

  // --- Akşam ---
  R('Fırında somon + buharda sebze', 'dinner', 480, 34, 20, 28, 6, 0.7, 5, ['fish'], [DF, LS], '150 g somon, brokoli, kabak, havuç, limon, zeytinyağı', 'Somonu 200°C fırında 15 dk pişirin, sebzeleri buharda haşlayın.'),
  R('Etli kabak dolması + yoğurt', 'dinner', 460, 24, 38, 22, 9, 1.5, 9, ['milk', 'lactose'], [DF], '3 kabak dolması (yağsız kıyma, pirinç), 100 g yoğurt', 'Kabakları oyup içini doldurun, kısık ateşte pişirin.'),
  R('Mercimek köftesi + bol yeşillik', 'dinner', 430, 16, 70, 10, 5, 1.1, 1, ['gluten'], [LF, VG, VN], 'Kırmızı mercimek, ince bulgur, soğan, maydanoz, marul', 'Mercimeği haşlayıp bulgurla yoğurun, şekil verin.'),
  R('Izgara hindi + kinoa + salata', 'dinner', 470, 40, 40, 14, 5, 0.8, 3, [], [DF, LS, LF], '150 g hindi göğsü, 50 g kinoa, mevsim salata', 'Hindiyi ızgara yapın, kinoa ve salatayla servis edin.'),
  R('Zeytinyağlı enginar + karabuğday salatası', 'dinner', 400, 12, 54, 16, 6, 0.8, 2, [], [DF, LS, LF, VG, VN], '2 enginar, bezelye, havuç, dereotu, 50 g karabuğday', 'Enginarları sebzelerle zeytinyağında pişirin.'),
  R('Sebzeli makarna (tam buğday) + parmesan', 'dinner', 520, 20, 78, 14, 8, 1.2, 5, ['gluten', 'milk'], [VG], '80 g tam buğday makarna, mantar, kabak, domates sos, 10 g parmesan', 'Makarnayı haşlayıp sebzeli sosla karıştırın.'),
  R('Fırın tavuk but + fırın sebze', 'dinner', 510, 38, 26, 27, 8, 1.0, 7, [], [DF, LS], '1 tavuk but (derisiz), patates, havuç, soğan, biberiye', 'Tavuk ve sebzeleri 200°C fırında 40 dk pişirin.'),
  R('Tofu sebze wok + esmer pirinç', 'dinner', 460, 22, 58, 15, 7, 1.0, 2, ['soy'], [DF, LF, VG, VN], '150 g tofu, brokoli, biber, havuç, 60 g esmer pirinç, az soya sosu', 'Tofu ve sebzeleri wokta yüksek ateşte soteleyin.'),
  R('Nohutlu ıspanak yemeği + yoğurt', 'dinner', 420, 20, 46, 16, 8, 0.9, 5, ['milk', 'lactose'], [DF, LS, VG], 'Ispanak, 80 g nohut, soğan, zeytinyağı, 100 g yoğurt', 'Ispanak ve nohudu soğanla pişirin, yoğurtla servis edin.'),

  // --- Ara öğün ---
  R('1 elma + 10 çiğ badem', 'snack', 170, 4, 22, 8, 16, 0, 0.6, ['tree_nuts'], [DF, LS, LF, VG, VN], '1 orta elma, 10 badem', 'Hazır.'),
  R('Yoğurt + tarçın', 'snack', 140, 9, 10, 7, 9, 0.2, 4, ['milk', 'lactose'], [DF, LS, VG], '150 g yoğurt, tarçın', 'Hazır.'),
  R('Havuç-salatalık + humus', 'snack', 160, 6, 18, 7, 6, 0.5, 1, ['sesame'], [DF, LS, LF, VG, VN], 'Havuç ve salatalık çubukları, 3 yemek kaşığı humus', 'Hazır.'),
  R('Ayran + 2 tam buğday galeta', 'snack', 150, 7, 20, 4, 6, 0.9, 2, ['milk', 'lactose', 'gluten'], [VG], '200 ml ayran, 2 galeta', 'Hazır.'),
  R('1 armut + 1 dilim laktozsuz peynir', 'snack', 180, 7, 26, 6, 17, 0.5, 4, ['milk'], [LS, VG], '1 armut, 30 g laktozsuz peynir', 'Hazır.'),
  R('Haşlanmış yumurta + domates', 'snack', 110, 7, 4, 7, 3, 0.3, 2, ['egg'], [DF, LS, VG], '1 yumurta, 1 domates', 'Hazır.'),
  R('Kavrulmuş leblebi + mandalina', 'snack', 160, 7, 26, 3, 9, 0.1, 0.4, [], [DF, LS, LF, VG, VN], '25 g sade leblebi, 1 mandalina', 'Hazır.'),
];

// --- Demo ürünler (marka "MelMind Demo" — gerçek ürün değildir; barkod okuyucuyu test etmek için) ---
export function ean13(base12) {
  const d = base12.split('').map(Number);
  const sum = d.reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0);
  return base12 + ((10 - (sum % 10)) % 10);
}
const P = (base, name, o) => ({
  barcode: ean13(base), name, brand: 'MelMind Demo', source: 'local', is_beverage: 0, allergens: [], traces: [], labels: [], analysis_tags: [],
  ingredients_text: null, kcal_100g: null, sugar_100g: null, carbs_100g: null, fat_100g: null, sat_fat_100g: null, trans_fat_100g: null,
  salt_100g: null, protein_100g: null, fiber_100g: null, serving_g: null, nova_group: null, image_url: null, ...o,
});

export const demoProducts = [
  P('869000000101', 'Sütlü Fındıklı Çikolata', { allergens: ['en:milk', 'en:nuts', 'en:soybeans'], traces: ['en:gluten', 'en:peanuts'], analysis_tags: ['en:non-vegan', 'en:vegetarian'],
    ingredients_text: 'Şeker, kakao yağı, süt tozu, fındık (%13), kakao kitlesi, peyniraltı suyu tozu, emülgatör (soya lesitini), aroma verici',
    kcal_100g: 545, sugar_100g: 52, carbs_100g: 56, fat_100g: 32, sat_fat_100g: 18, salt_100g: 0.2, protein_100g: 7.5, serving_g: 25, nova_group: 4 }),
  P('869000000102', 'Tam Buğday Ekmeği', { allergens: ['en:gluten'], traces: ['en:sesame-seeds'], analysis_tags: ['en:vegan'],
    ingredients_text: 'Tam buğday unu, su, maya, tuz, buğday glüteni', kcal_100g: 240, sugar_100g: 3, carbs_100g: 42, fat_100g: 2.5, sat_fat_100g: 0.4, salt_100g: 1.1, protein_100g: 10, fiber_100g: 7, nova_group: 3 }),
  P('869000000103', 'Glutensiz Karabuğday Krakeri', { labels: ['en:gluten-free', 'en:vegan'], analysis_tags: ['en:vegan'],
    ingredients_text: 'Karabuğday unu, pirinç unu, ayçiçek yağı, deniz tuzu', kcal_100g: 410, sugar_100g: 1.5, carbs_100g: 72, fat_100g: 10, sat_fat_100g: 1.1, salt_100g: 0.9, protein_100g: 9, fiber_100g: 5, nova_group: 3 }),
  P('869000000104', 'Laktozsuz Yarım Yağlı Süt', { allergens: ['en:milk'], labels: ['en:lactose-free'], analysis_tags: ['en:non-vegan'], is_beverage: 1,
    ingredients_text: 'Yarım yağlı inek sütü, laktaz enzimi', kcal_100g: 46, sugar_100g: 4.7, carbs_100g: 4.7, fat_100g: 1.5, sat_fat_100g: 1.0, salt_100g: 0.1, protein_100g: 3.2, nova_group: 1 }),
  P('869000000105', 'Kola (Şekerli)', { is_beverage: 1, analysis_tags: ['en:vegan'], ingredients_text: 'Karbonatlı su, şeker, renklendirici (amonyak kostik karamel), asitlik düzenleyici (fosforik asit), aroma verici, kafein',
    kcal_100g: 42, sugar_100g: 10.6, carbs_100g: 10.6, fat_100g: 0, sat_fat_100g: 0, salt_100g: 0, protein_100g: 0, nova_group: 4 }),
  P('869000000106', 'Kola Şekersiz', { is_beverage: 1, analysis_tags: ['en:vegan'], ingredients_text: 'Karbonatlı su, renklendirici, asitlik düzenleyici, tatlandırıcılar (aspartam, asesülfam K), aroma verici, kafein',
    kcal_100g: 0.4, sugar_100g: 0, carbs_100g: 0, fat_100g: 0, sat_fat_100g: 0, salt_100g: 0.02, protein_100g: 0, nova_group: 4 }),
  P('869000000107', 'Kangal Sucuk', { analysis_tags: ['en:non-vegetarian'], ingredients_text: 'Dana eti, dana yağı, tuz, sarımsak, kırmızı biber, karabiber, kimyon, koruyucu (sodyum nitrit)',
    kcal_100g: 410, sugar_100g: 0.5, carbs_100g: 1, fat_100g: 36, sat_fat_100g: 15, salt_100g: 3.8, protein_100g: 20, nova_group: 4 }),
  P('869000000108', 'Çiğ Badem', { allergens: ['en:nuts'], labels: ['en:vegan'], analysis_tags: ['en:vegan'], ingredients_text: 'Badem',
    kcal_100g: 579, sugar_100g: 4.4, carbs_100g: 9, fat_100g: 50, sat_fat_100g: 3.8, salt_100g: 0, protein_100g: 21, fiber_100g: 12, serving_g: 30, nova_group: 1 }),
  P('869000000109', 'Tam Yağlı Beyaz Peynir', { allergens: ['en:milk'], analysis_tags: ['en:vegetarian', 'en:non-vegan'], ingredients_text: 'Pastörize inek sütü, tuz, peynir mayası, kalsiyum klorür',
    kcal_100g: 290, sugar_100g: 1, carbs_100g: 1.5, fat_100g: 24, sat_fat_100g: 16, salt_100g: 2.8, protein_100g: 17, nova_group: 3 }),
  P('869000000110', 'Haşlanmış Nohut Konservesi', { analysis_tags: ['en:vegan'], ingredients_text: 'Nohut, su, tuz',
    kcal_100g: 120, sugar_100g: 0.8, carbs_100g: 16, fat_100g: 2.4, sat_fat_100g: 0.3, salt_100g: 0.25, protein_100g: 7, fiber_100g: 6, nova_group: 3 }),
  P('869000000111', 'Klasik Patates Cipsi', { traces: ['en:milk', 'en:gluten'], analysis_tags: ['en:vegan'], ingredients_text: 'Patates, bitkisel yağ (ayçiçek), tuz',
    kcal_100g: 536, sugar_100g: 0.6, carbs_100g: 53, fat_100g: 34, sat_fat_100g: 3.2, salt_100g: 1.4, protein_100g: 6.5, nova_group: 4 }),
  P('869000000112', 'Meyveli Yoğurt (Çilekli)', { allergens: ['en:milk'], analysis_tags: ['en:vegetarian', 'en:non-vegan'],
    ingredients_text: 'Yoğurt (pastörize süt, yoğurt kültürü), şeker, çilek (%8), modifiye nişasta, aroma verici',
    kcal_100g: 98, sugar_100g: 13, carbs_100g: 15, fat_100g: 2.6, sat_fat_100g: 1.7, salt_100g: 0.12, protein_100g: 3.4, nova_group: 4 }),
];

// --- Rapordaki test kullanıcıları (Obj 2): şifre hepsi için "demo1234" ---
export const demoUsers = [
  { email: 'admin', password: 'admin123', name: 'Admin', age: 30, gender: 'male', height_cm: 175, weight_kg: 75, goal: 'maintain', activity: 'medium', diet_type: 'none', conditions: [], allergies: [] },
  { email: 'laktoz@melmind.test', name: 'Ayşe (Laktoz intoleransı)', age: 27, gender: 'female', height_cm: 165, weight_kg: 62, goal: 'maintain', activity: 'medium', diet_type: 'none', conditions: [], allergies: ['lactose'] },
  { email: 'colyak@melmind.test', name: 'Can (Çölyak)', age: 31, gender: 'male', height_cm: 178, weight_kg: 74, goal: 'maintain', activity: 'medium', diet_type: 'none', conditions: ['celiac'], allergies: ['gluten'] },
  { email: 'diyabet@melmind.test', name: 'Hatice (Tip 2 diyabet)', age: 64, gender: 'female', height_cm: 158, weight_kg: 78, goal: 'lose', activity: 'low', diet_type: 'none', conditions: ['diabetes', 'hypertension'], allergies: [],
    blood: [{ date: '2026-06-10', values: { glucose: 128, hba1c: 6.9, ldl: 118, triglycerides: 160 } }, { date: '2026-09-25', values: { glucose: 142, hba1c: 7.4, ldl: 121, triglycerides: 175 } }] },
  { email: 'kolesterol@melmind.test', name: 'Mehmet (Yüksek kolesterol)', age: 52, gender: 'male', height_cm: 175, weight_kg: 88, goal: 'lose', activity: 'low', diet_type: 'none', conditions: ['high_cholesterol'], allergies: ['tree_nuts'],
    blood: [{ date: '2026-09-01', values: { total_cholesterol: 252, ldl: 168, hdl: 38, triglycerides: 190 } }] },
];
