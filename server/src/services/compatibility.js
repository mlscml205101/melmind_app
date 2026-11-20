// MelMind — Barkodlu ürün / diyet uyumluluk motoru
// Yapay zekâdan BAĞIMSIZ, kural tabanlı bir filtredir (Rapor R-03, Bölüm 3.1).
// Girdi: ürün (100 g / 100 ml başına besin değerleri, alerjen etiketleri, içindekiler)
//        + kullanıcı profili (alerjiler, kronik hastalıklar, diyet tipi, hedef, son kan değerleri)
// Çıktı: verdict = suitable | caution | unsuitable | unknown  ve gerekçe listesi.

// ---------------------------------------------------------------------------
// 1) Alerjen tanımları
// ---------------------------------------------------------------------------
export const ALLERGENS = {
  lactose: {
    label: 'Laktoz',
    offTags: ['en:milk'],
    keywords: ['süt', 'laktoz', 'peynir', 'yoğurt', 'yogurt', 'tereyağ', 'krema', 'kaymak', 'peyniraltı', 'peynir altı',
      'milk', 'lactose', 'whey', 'butter', 'cream', 'cheese', 'kefir', 'lor '],
    freeLabels: ['en:lactose-free', 'en:no-lactose', 'fr:sans-lactose'],
    freeWords: ['laktozsuz', 'lactose free', 'lactose-free'],
  },
  milk: {
    label: 'Süt proteini',
    offTags: ['en:milk'],
    keywords: ['süt', 'laktoz', 'peynir', 'yoğurt', 'yogurt', 'tereyağ', 'krema', 'kaymak', 'peyniraltı', 'peynir altı',
      'kazein', 'milk', 'lactose', 'whey', 'butter', 'cream', 'cheese', 'casein', 'kefir', 'lor '],
    freeLabels: [],
    freeWords: [],
  },
  gluten: {
    label: 'Gluten',
    offTags: ['en:gluten'],
    keywords: ['gluten', 'buğday', 'bugday', 'arpa', 'çavdar', 'cavdar', 'irmik', 'bulgur', 'malt', 'kuskus', 'yulaf',
      'wheat', 'barley', 'rye', 'spelt', 'semolina', 'oat'],
    freeLabels: ['en:gluten-free', 'en:no-gluten'],
    freeWords: ['glutensiz', 'gluten free', 'gluten-free'],
  },
  egg: { label: 'Yumurta', offTags: ['en:eggs'], keywords: ['yumurta', 'egg', 'albumin'], freeLabels: [], freeWords: [] },
  peanut: { label: 'Yer fıstığı', offTags: ['en:peanuts'], keywords: ['yer fıstığı', 'yerfıstığı', 'fıstık ezmesi', 'peanut'], freeLabels: [], freeWords: [] },
  tree_nuts: {
    label: 'Kabuklu yemiş',
    offTags: ['en:nuts'],
    keywords: ['fındık', 'badem', 'ceviz', 'antep fıstığı', 'kaju', 'pekan', 'hazelnut', 'almond', 'walnut', 'pistachio', 'cashew', 'pecan'],
    freeLabels: [], freeWords: [],
  },
  soy: { label: 'Soya', offTags: ['en:soybeans'], keywords: ['soya', 'soy ', 'soybean', 'soy lecithin'], freeLabels: [], freeWords: [] },
  fish: { label: 'Balık', offTags: ['en:fish'], keywords: ['balık', 'ton balığı', 'somon', 'hamsi', 'fish', 'tuna', 'salmon', 'anchovy'], freeLabels: [], freeWords: [] },
  shellfish: { label: 'Kabuklu deniz ürünü', offTags: ['en:crustaceans', 'en:molluscs'], keywords: ['karides', 'midye', 'kalamar', 'yengeç', 'shrimp', 'prawn', 'mussel', 'crab', 'squid'], freeLabels: [], freeWords: [] },
  sesame: { label: 'Susam', offTags: ['en:sesame-seeds'], keywords: ['susam', 'tahin', 'sesame', 'tahini'], freeLabels: [], freeWords: [] },
};

// Anahtar kelimeler KELİME BAŞINDAN eşleşir (Türkçe ekler için: "süt" → "sütlü", "sütü").
// Böylece "karabuğday" ≠ buğday, "soyulmuş" ≠ soya, "kuzukulağı" ≠ kuzu, "salamura" ≠ salam olur.
// Kalan yanlış eşleşmeler için alerjene özel istisna ifadeleri:
const EXCEPTIONS = {
  lactose: { 'süt': ['hindistan cevizi sütü', 'hindistan cevizi süt', 'badem sütü', 'yulaf sütü', 'soya sütü', 'pirinç sütü', 'sütsüz'],
             'milk': ['coconut milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk'], 'laktoz': ['laktozsuz'],
             'butter': ['peanut butter', 'cocoa butter', 'shea butter'] },
  milk: { 'süt': ['hindistan cevizi sütü', 'hindistan cevizi süt', 'badem sütü', 'yulaf sütü', 'soya sütü', 'pirinç sütü', 'sütsüz'],
          'milk': ['coconut milk', 'almond milk', 'oat milk', 'soy milk', 'rice milk'],
          'butter': ['peanut butter', 'cocoa butter', 'shea butter'] },
  gluten: { 'gluten': ['glutensiz', 'gluten free'], 'yulaf': ['glutensiz yulaf'], 'oat': ['gluten free oat'],
            'malt': ['maltodekstrin', 'maltodextrin', 'maltitol', 'maltoz'] },
};
ALLERGENS.lactose.exceptions = EXCEPTIONS.lactose;
ALLERGENS.milk.exceptions = EXCEPTIONS.milk;
ALLERGENS.gluten.exceptions = EXCEPTIONS.gluten;

export const CONDITIONS = {
  diabetes: 'Tip 2 diyabet',
  hypertension: 'Yüksek tansiyon',
  high_cholesterol: 'Yüksek kolesterol',
  celiac: 'Çölyak',
};

// ---------------------------------------------------------------------------
// 2) Besin eşikleri — İngiltere FSA "trafik ışığı" eşikleri (100 g / 100 ml başına)
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  food:     { sugar: [5, 22.5],   fat: [3, 17.5],   sat_fat: [1.5, 5],   salt: [0.3, 1.5] },
  beverage: { sugar: [2.5, 11.25], fat: [1.5, 8.75], sat_fat: [0.75, 2.5], salt: [0.3, 0.75] },
};

export function level(value, [low, high]) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value > high) return 'high';
  if (value > low) return 'medium';
  return 'low';
}

// Kan değeri kontrol durumu (diyetisyen onayıyla güncellenecek varsayılan eşikler)
export function bloodStatus(blood = {}, conditions = []) {
  const s = {};
  const diab = conditions.includes('diabetes');
  if (blood.hba1c != null) s.sugarControl = blood.hba1c >= (diab ? 7 : 6.5) ? 'poor' : blood.hba1c >= 5.7 ? 'borderline' : 'good';
  if (blood.glucose != null) {
    const g = blood.glucose >= (diab ? 130 : 126) ? 'poor' : blood.glucose >= 100 ? 'borderline' : 'good';
    s.sugarControl = worst(s.sugarControl, g);
  }
  if (blood.ldl != null) s.ldl = blood.ldl >= 160 ? 'poor' : blood.ldl >= 130 ? 'borderline' : 'good';
  if (blood.total_cholesterol != null) s.ldl = worst(s.ldl, blood.total_cholesterol >= 240 ? 'poor' : blood.total_cholesterol >= 200 ? 'borderline' : 'good');
  if (blood.triglycerides != null) s.tg = blood.triglycerides >= 200 ? 'poor' : blood.triglycerides >= 150 ? 'borderline' : 'good';
  return s;
}
function worst(a, b) {
  const rank = { good: 0, borderline: 1, poor: 2 };
  if (!a) return b; if (!b) return a;
  return rank[a] >= rank[b] ? a : b;
}

// ---------------------------------------------------------------------------
// 3) Yardımcılar
// ---------------------------------------------------------------------------
const lower = (t) => (t || '').toLocaleLowerCase('tr-TR');

export function normalizeText(text) {
  return ' ' + lower(text).replace(/[,.;:()\[\]{}%*\/\\_\-+"'!?]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
}

/** Metinde, kelime başından eşleşen ilk anahtar kelimeyi döndürür (istisnalar hariç). */
export function findKeyword(text, keywords, exceptions = {}) {
  const t = normalizeText(text);
  if (t.trim() === '') return null;
  for (const kw of keywords) {
    const needle = ' ' + kw;
    let idx = t.indexOf(needle);
    while (idx !== -1) {
      const covered = (exceptions[kw] || []).some((ex) => {
        const exNeedle = ' ' + ex;
        let p = t.indexOf(exNeedle);
        while (p !== -1) {
          if (p <= idx && idx < p + exNeedle.length) return true;
          p = t.indexOf(exNeedle, p + 1);
        }
        return false;
      });
      if (!covered) return kw;
      idx = t.indexOf(needle, idx + 1);
    }
  }
  return null;
}

// ' et ' / ' eti ' sonundaki boşluk tam kelime demektir (ör. "net", "etiket" eşleşmez)
const MEAT_WORDS = ['et ', 'eti ', 'etli', 'kıyma', 'tavuk', 'hindi ', 'hindi eti', 'dana', 'sığır', 'kuzu ', 'kuzu eti', 'domuz', 'jelatin',
  'sucuk', 'salam ', 'sosis', 'pastırma', 'kavurma', 'balık', 'hamsi', 'karides', 'chicken', 'beef', 'pork', 'gelatin', 'meat', 'fish', 'anchovy'];
const ANIMAL_WORDS = ['süt', 'peynir', 'yoğurt', 'tereyağ', 'krema', 'kaymak', 'yumurta', 'bal ', 'peyniraltı', 'whey', 'milk', 'egg', 'honey', 'butter', 'cheese'];
const ANIMAL_EXCEPTIONS = { 'süt': ['hindistan cevizi sütü', 'badem sütü', 'yulaf sütü', 'soya sütü', 'pirinç sütü', 'sütsüz'],
  'milk': ['coconut milk', 'almond milk', 'oat milk', 'soy milk'], 'butter': ['peanut butter', 'cocoa butter'] };

function round(n, d = 1) { return n == null ? null : Math.round(n * 10 ** d) / 10 ** d; }

// ---------------------------------------------------------------------------
// 4) Ana fonksiyon
// ---------------------------------------------------------------------------
/**
 * @param {object} product  normalize edilmiş ürün (bkz. products tablosu)
 * @param {object} profile  { allergies:[], conditions:[], dietType, goal, blood:{marker:value} }
 */
export function evaluateProduct(product, profile) {
  const reasons = [];
  const add = (severity, code, title, detail) => reasons.push({ severity, code, title, detail });

  const allergies = new Set(profile.allergies || []);
  const conditions = profile.conditions || [];
  if (conditions.includes('celiac')) allergies.add('gluten');

  const text = `${product.name || ''} ${product.ingredients_text || ''}`;
  const tagsA = (product.allergens || []).map(lower);
  const tagsT = (product.traces || []).map(lower);
  const labels = (product.labels || []).map(lower);
  const nameLow = lower(product.name);

  // --- 4.1 Alerjen kontrolü --------------------------------------------------
  for (const code of allergies) {
    const def = ALLERGENS[code];
    if (!def) continue;
    const freeByLabel = def.freeLabels.some((l) => labels.includes(l)) || def.freeWords.some((w) => nameLow.includes(w));
    const tagHit = def.offTags.some((t) => tagsA.includes(t));
    const traceHit = def.offTags.some((t) => tagsT.includes(t));
    const kwHit = findKeyword(text, def.keywords, def.exceptions);

    if (freeByLabel) {
      if (code === 'gluten' && tagHit) {
        add('danger', `allergen_${code}`, `${def.label} çelişkisi`, 'Ürün "glutensiz" etiketli ama alerjen listesinde gluten var. Güvenli tarafta kalın, tüketmeyin.');
      } else {
        add('ok', `allergen_${code}_free`, `${def.label} içermez`, `Ürün "${code === 'gluten' ? 'glutensiz' : 'laktozsuz'}" olarak etiketlenmiş.`);
      }
      continue;
    }
    if (tagHit || kwHit) {
      const why = tagHit ? 'alerjen listesinde yer alıyor' : `içindekilerde "${kwHit}" geçiyor`;
      add('danger', `allergen_${code}`, `${def.label} içeriyor`, `Alerjiniz/intoleransınız var: ${def.label} ${why}.`);
    } else if (traceHit) {
      const strict = code === 'gluten' && conditions.includes('celiac');
      add(strict ? 'danger' : 'warning', `trace_${code}`, `${def.label} izi olabilir`,
        strict ? 'Çölyak hastalığında "eser miktarda gluten içerebilir" uyarısı da risklidir.' : 'Ürün eser miktarda içerebilir uyarısı taşıyor.');
    }
  }

  // --- 4.2 Diyet tipi (vejetaryen / vegan) ---------------------------------
  const analysis = (product.analysis_tags || []).map(lower);
  if (profile.dietType === 'vegetarian' || profile.dietType === 'vegan') {
    const meat = analysis.includes('en:non-vegetarian') || findKeyword(text, MEAT_WORDS);
    if (meat) add('danger', 'diet_meat', 'Vejetaryen değil', 'Ürün et/balık veya hayvansal jelatin içeriyor.');
    if (profile.dietType === 'vegan' && !meat) {
      const animal = analysis.includes('en:non-vegan') || findKeyword(text, ANIMAL_WORDS, ANIMAL_EXCEPTIONS);
      if (animal) add('danger', 'diet_animal', 'Vegan değil', 'Ürün süt, yumurta veya bal gibi hayvansal içerik barındırıyor.');
    }
  }

  // --- 4.3 Besin değerleri ve kronik hastalıklar ---------------------------
  const th = product.is_beverage ? THRESHOLDS.beverage : THRESHOLDS.food;
  const unit = product.is_beverage ? '100 ml' : '100 g';
  const n = {
    sugar: num(product.sugar_100g), fat: num(product.fat_100g), sat_fat: num(product.sat_fat_100g),
    salt: num(product.salt_100g), kcal: num(product.kcal_100g), carbs: num(product.carbs_100g),
    trans: num(product.trans_fat_100g), fiber: num(product.fiber_100g),
  };
  const lv = { sugar: level(n.sugar, th.sugar), fat: level(n.fat, th.fat), sat_fat: level(n.sat_fat, th.sat_fat), salt: level(n.salt, th.salt) };
  const bs = bloodStatus(profile.blood, conditions);

  // Diyabet / kan şekeri
  if (conditions.includes('diabetes')) {
    const poor = bs.sugarControl === 'poor';
    if (product.is_beverage && n.sugar != null && n.sugar > 5) add('danger', 'diabetes_sugar', 'Şekerli içecek',
      `${unit}'da ${n.sugar} g şeker var. Şekerli içecekler kan şekerini hızla yükseltir; diyabette önerilmez.`);
    else if (lv.sugar === 'high') add('danger', 'diabetes_sugar', 'Şekeri yüksek', `${unit}'da ${n.sugar} g şeker var (yüksek eşik: ${th.sugar[1]} g). Diyabet için uygun değil.`);
    else if (lv.sugar === 'medium') add(poor ? 'danger' : 'warning', 'diabetes_sugar', 'Orta düzeyde şeker',
      `${unit}'da ${n.sugar} g şeker var.` + (poor ? ' Son tahlilinizde kan şekeri/HbA1c hedefin üzerinde olduğu için bu ürünü önermiyoruz.' : ' Küçük porsiyon tercih edin.'));
    else if (lv.sugar === null) {
      if (n.carbs != null && n.carbs > 60) add('warning', 'diabetes_carbs', 'Karbonhidratı yüksek', `${unit}'da ${n.carbs} g karbonhidrat var; şeker bilgisi yok.`);
      else add('warning', 'diabetes_nodata', 'Şeker bilgisi yok', 'Ürünün şeker değeri bulunamadı; diyabet uyumu kesin değerlendirilemedi.');
    } else add('ok', 'diabetes_sugar_ok', 'Şekeri düşük', `${unit}'da ${n.sugar} g şeker.`);
  } else if ((bs.sugarControl === 'poor' || bs.sugarControl === 'borderline') && lv.sugar === 'high') {
    add('warning', 'blood_sugar', 'Kan şekeriniz için dikkat', `Son tahlilinizde kan şekeri sınırda/yüksek; bu ürün ${unit}'da ${n.sugar} g şeker içeriyor.`);
  }

  // Tansiyon / tuz
  if (conditions.includes('hypertension')) {
    if (lv.salt === 'high') add('danger', 'hypertension_salt', 'Tuzu yüksek', `${unit}'da ${n.salt} g tuz var (yüksek eşik: ${th.salt[1]} g). Yüksek tansiyon için uygun değil.`);
    else if (lv.salt === 'medium') add('warning', 'hypertension_salt', 'Orta düzeyde tuz', `${unit}'da ${n.salt} g tuz var; günlük tuzu 5 g'ın altında tutun.`);
    else if (lv.salt === null) add('warning', 'hypertension_nodata', 'Tuz bilgisi yok', 'Ürünün tuz değeri bulunamadı.');
    else add('ok', 'hypertension_salt_ok', 'Tuzu düşük', `${unit}'da ${n.salt} g tuz.`);
  }

  // Kolesterol / doymuş yağ
  if (conditions.includes('high_cholesterol')) {
    const poor = bs.ldl === 'poor';
    if (n.trans != null && n.trans > 0.2) add('danger', 'chol_trans', 'Trans yağ içeriyor', `${unit}'da ${n.trans} g trans yağ var.`);
    if (lv.sat_fat === 'high') add('danger', 'chol_satfat', 'Doymuş yağı yüksek', `${unit}'da ${n.sat_fat} g doymuş yağ var (yüksek eşik: ${th.sat_fat[1]} g). Yüksek kolesterol için uygun değil.`);
    else if (lv.sat_fat === 'medium') add(poor ? 'danger' : 'warning', 'chol_satfat', 'Orta düzeyde doymuş yağ',
      `${unit}'da ${n.sat_fat} g doymuş yağ var.` + (poor ? ' Son tahlilinizde LDL/kolesterol yüksek olduğu için önermiyoruz.' : ''));
    else if (lv.sat_fat === null) add('warning', 'chol_nodata', 'Doymuş yağ bilgisi yok', 'Ürünün doymuş yağ değeri bulunamadı.');
    else add('ok', 'chol_satfat_ok', 'Doymuş yağı düşük', `${unit}'da ${n.sat_fat} g doymuş yağ.`);
  } else if (bs.ldl === 'poor' && lv.sat_fat === 'high') {
    add('warning', 'blood_ldl', 'Kolesterolünüz için dikkat', `Son tahlilinizde LDL/kolesterol yüksek; bu ürün ${unit}'da ${n.sat_fat} g doymuş yağ içeriyor.`);
  }

  if (bs.tg && bs.tg !== 'good' && lv.sugar === 'high' && !conditions.includes('diabetes')) {
    add('warning', 'blood_tg', 'Trigliseridiniz için dikkat', 'Trigliserit değeriniz yüksek; şekerli ürünleri sınırlayın.');
  }

  // Kilo hedefi
  if (profile.goal === 'lose' && n.kcal != null) {
    if (n.kcal >= 400) add('warning', 'goal_kcal', 'Enerjisi yüksek', `${unit}'da ${Math.round(n.kcal)} kcal var; kilo verme hedefiniz için porsiyonu küçük tutun.`);
    if (lv.sugar === 'high' && !conditions.includes('diabetes')) add('warning', 'goal_sugar', 'Şekeri yüksek', `${unit}'da ${n.sugar} g şeker var.`);
  }
  if (product.nova_group === 4) add('info', 'nova4', 'Ultra işlenmiş ürün', 'NOVA 4 grubunda; mümkünse daha az işlenmiş alternatifleri tercih edin.');

  // --- 4.4 Karar ------------------------------------------------------------
  const hasNutrition = ['sugar', 'salt', 'sat_fat', 'kcal'].some((k) => n[k] != null);
  const hasIngredients = !!(product.ingredients_text && product.ingredients_text.trim()) || tagsA.length > 0;
  let verdict;
  if (reasons.some((r) => r.severity === 'danger')) verdict = 'unsuitable';
  else if (!hasNutrition && !hasIngredients) verdict = 'unknown';
  else if (reasons.some((r) => r.severity === 'warning')) verdict = 'caution';
  else verdict = 'suitable';

  if (verdict === 'unknown') add('warning', 'no_data', 'Yetersiz ürün bilgisi', 'Ürünün içindekiler ve besin değerleri bulunamadı. Etiketi kontrol edin veya bilgileri elle ekleyin.');
  if (allergies.size > 0 && !hasIngredients && verdict !== 'unsuitable') {
    add('warning', 'allergen_nodata', 'Alerjen bilgisi eksik', 'İçindekiler listesi yok; alerjen kontrolü için ambalajı mutlaka okuyun.');
    if (verdict === 'suitable') verdict = 'caution';
  }

  const order = { danger: 0, warning: 1, info: 2, ok: 3 };
  reasons.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    verdict,
    title: { suitable: 'Diyetinize uygun', caution: 'Dikkatli tüketin', unsuitable: 'Diyetinize uygun değil', unknown: 'Değerlendirilemedi' }[verdict],
    reasons,
    nutrition: {
      per: unit,
      kcal: round(n.kcal, 0), sugar: n.sugar, fat: n.fat, sat_fat: n.sat_fat, salt: n.salt, carbs: n.carbs,
      protein: num(product.protein_100g), fiber: n.fiber, levels: lv,
    },
    disclaimer: 'Bu değerlendirme bilgilendirme amaçlıdır, tıbbi tavsiye değildir. Ambalaj etiketini her zaman kontrol edin.',
  };
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
