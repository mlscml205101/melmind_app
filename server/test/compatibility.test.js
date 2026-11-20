// Rapordaki test kullanıcıları ile barkod uyumluluk kontrolü (Obj 2). Çalıştır: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProduct, findKeyword, ALLERGENS } from '../src/services/compatibility.js';
import { buildPlan, recipeAllowed } from '../src/services/planner.js';
import { compareBlood } from '../src/services/blood.js';
import { demoProducts, recipes } from '../db/seedData.js';

const prod = (name) => {
  const p = demoProducts.find((x) => x.name === name);
  if (!p) throw new Error(`demo ürün yok: ${name}`);
  return p;
};
const base = { allergies: [], conditions: [], dietType: 'none', goal: 'maintain', blood: {} };
const lactose = { ...base, allergies: ['lactose'] };
const celiac = { ...base, conditions: ['celiac'], allergies: ['gluten'] };
const diabetic = { ...base, conditions: ['diabetes', 'hypertension'], goal: 'lose', blood: { hba1c: 7.4, glucose: 142 } };
const cholesterol = { ...base, conditions: ['high_cholesterol'], allergies: ['tree_nuts'], blood: { ldl: 168 } };
const vegan = { ...base, dietType: 'vegan' };

const codes = (r) => r.reasons.map((x) => x.code);

test('laktoz intoleransı: sütlü çikolata uygun değil, laktozsuz süt uygun', () => {
  assert.equal(evaluateProduct(prod('Sütlü Fındıklı Çikolata'), lactose).verdict, 'unsuitable');
  assert.equal(evaluateProduct(prod('Meyveli Yoğurt (Çilekli)'), lactose).verdict, 'unsuitable');
  const milk = evaluateProduct(prod('Laktozsuz Yarım Yağlı Süt'), lactose);
  assert.equal(milk.verdict, 'suitable');
  assert.ok(codes(milk).includes('allergen_lactose_free'));
  // süt proteini alerjisinde laktozsuz süt de uygun değil
  assert.equal(evaluateProduct(prod('Laktozsuz Yarım Yağlı Süt'), { ...base, allergies: ['milk'] }).verdict, 'unsuitable');
});

test('çölyak: ekmek uygun değil, glutensiz kraker uygun, "gluten izi" tehlikeli', () => {
  assert.equal(evaluateProduct(prod('Tam Buğday Ekmeği'), celiac).verdict, 'unsuitable');
  assert.equal(evaluateProduct(prod('Glutensiz Karabuğday Krakeri'), celiac).verdict, 'suitable');
  const chips = evaluateProduct(prod('Klasik Patates Cipsi'), celiac);
  assert.equal(chips.verdict, 'unsuitable');
  assert.ok(codes(chips).includes('trace_gluten'));
  // çölyak olmayan gluten hassasiyetinde iz uyarısı sadece "dikkat"
  assert.equal(evaluateProduct(prod('Klasik Patates Cipsi'), { ...base, allergies: ['gluten'] }).verdict, 'caution');
});

test('diyabet + tansiyon: şekerli kola ve sucuk uygun değil, şekersiz kola ve nohut uygun', () => {
  const cola = evaluateProduct(prod('Kola (Şekerli)'), { ...diabetic, blood: {} }); // kan değeri iyi olsa bile
  assert.equal(cola.verdict, 'unsuitable');
  assert.ok(codes(cola).includes('diabetes_sugar'));
  assert.equal(evaluateProduct(prod('Kola Şekersiz'), diabetic).verdict, 'suitable');
  const sucuk = evaluateProduct(prod('Kangal Sucuk'), diabetic);
  assert.equal(sucuk.verdict, 'unsuitable');
  assert.ok(codes(sucuk).includes('hypertension_salt'));
  assert.equal(evaluateProduct(prod('Haşlanmış Nohut Konservesi'), diabetic).verdict, 'suitable');
});

test('kan değeri kötüyse orta şekerli ürün "dikkat"ten "uygun değil"e yükselir', () => {
  const yogurt = prod('Meyveli Yoğurt (Çilekli)'); // 13 g şeker = orta
  const controlled = { ...diabetic, blood: { hba1c: 6.4 } };
  assert.equal(evaluateProduct(yogurt, controlled).verdict, 'caution');
  assert.equal(evaluateProduct(yogurt, diabetic).verdict, 'unsuitable');
});

test('yüksek kolesterol + kuruyemiş alerjisi', () => {
  assert.equal(evaluateProduct(prod('Tam Yağlı Beyaz Peynir'), cholesterol).verdict, 'unsuitable');
  assert.equal(evaluateProduct(prod('Çiğ Badem'), cholesterol).verdict, 'unsuitable'); // alerji
  assert.equal(evaluateProduct(prod('Haşlanmış Nohut Konservesi'), cholesterol).verdict, 'suitable');
});

test('vegan: sucuk ve peynir uygun değil, nohut uygun', () => {
  assert.equal(evaluateProduct(prod('Kangal Sucuk'), vegan).verdict, 'unsuitable');
  assert.equal(evaluateProduct(prod('Tam Yağlı Beyaz Peynir'), vegan).verdict, 'unsuitable');
  assert.equal(evaluateProduct(prod('Haşlanmış Nohut Konservesi'), vegan).verdict, 'suitable');
});

test('içerik bilgisi olmayan ürün "değerlendirilemedi"', () => {
  const r = evaluateProduct({ barcode: '1', name: 'Bilinmeyen', allergens: [], traces: [], labels: [] }, base);
  assert.equal(r.verdict, 'unknown');
});

test('Türkçe anahtar kelime eşleşmesi yanlış pozitif vermez', () => {
  const g = ALLERGENS.gluten;
  assert.equal(findKeyword('karabuğday unu, tuz', g.keywords, g.exceptions), null);
  assert.equal(findKeyword('maltodekstrin, şeker', g.keywords, g.exceptions), null);
  assert.equal(findKeyword('buğday unu, tuz', g.keywords, g.exceptions), 'buğday');
  const s = ALLERGENS.soy;
  assert.equal(findKeyword('soyulmuş domates', s.keywords), null);
  assert.equal(findKeyword('emülgatör (soya lesitini)', s.keywords), 'soya');
  const l = ALLERGENS.lactose;
  assert.equal(findKeyword('hindistan cevizi sütü, şeker', l.keywords, l.exceptions), null);
  assert.equal(findKeyword('kalori, klorofil', l.keywords, l.exceptions), null);
  assert.equal(findKeyword('Süt tozu', l.keywords, l.exceptions), 'süt');
});

test('diyet planı kullanıcının alerjenlerini asla içermez', () => {
  const profiles = [
    { allergies: ['lactose'], conditions: [], diet_type: 'none', blood: {}, targetKcal: 1800 },
    { allergies: ['gluten'], conditions: ['celiac'], diet_type: 'none', blood: {}, targetKcal: 2200 },
    { allergies: ['milk', 'egg', 'tree_nuts'], conditions: ['diabetes'], diet_type: 'none', blood: { hba1c: 7.5 }, targetKcal: 1600 },
    { allergies: ['gluten', 'soy'], conditions: [], diet_type: 'vegan', blood: {}, targetKcal: 2000 },
  ];
  const rs = recipes.map((r, i) => ({ ...r, id: i + 1, allergens: JSON.stringify(r.allergens), tags: JSON.stringify(r.tags) }));
  for (const p of profiles) {
    const plan = buildPlan(p, rs);
    assert.equal(plan.items.length, 28, `7 gün × 4 öğün olmalı (${p.allergies})`);
    for (const it of plan.items) {
      const al = JSON.parse(it.recipe.allergens);
      for (const a of p.allergies) assert.ok(!al.includes(a), `${it.recipe.name} içinde ${a} var`);
      assert.ok(recipeAllowed(it.recipe, p));
    }
  }
});

test('kan değeri kötüleşince doktor uyarısı', () => {
  const a = compareBlood({ hba1c: 7.4, ldl: 90 }, { hba1c: 6.9, ldl: 95 }, ['diabetes']);
  assert.equal(a.length, 1);
  assert.equal(a[0].marker, 'hba1c');
  assert.match(a[0].message, /doktorunuza başvurun/);
  // HDL düşerse kötüleşmedir
  assert.equal(compareBlood({ hdl: 45 }, { hdl: 55 }, [], 'male').length, 1);
});
