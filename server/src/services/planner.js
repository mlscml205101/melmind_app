// Kişisel haftalık diyet planı: MelMind ekibinin tariflerinden seçilir.
// Plan oluşturulduktan SONRA yapay zekâdan bağımsız bir alerjen filtresi her öğünü yeniden kontrol eder (Rapor 3.1).
import { query, pool, parseJson } from '../db.js';
import { loadProfile } from './profile.js';
import { bloodStatus } from './compatibility.js';

const SHARES = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 };
const MEAL_TYPES = Object.keys(SHARES);

export function recipeAllowed(recipe, profile) {
  const allergens = parseJson(recipe.allergens);
  const tags = parseJson(recipe.tags);
  const allergies = new Set(profile.allergies);
  if (profile.conditions.includes('celiac')) allergies.add('gluten');
  // Süt ürünü içeren tarifler "milk", laktoz içerenler ayrıca "lactose" ile işaretlidir.
  // Böylece laktoz intoleransında laktozsuz süt ürünleri kalabilir, süt alerjisinde hiçbiri kalmaz.
  if (profile.allergies.includes('milk')) allergies.add('lactose');
  for (const a of allergies) if (allergens.includes(a)) return false;
  if (profile.diet_type === 'vegetarian' && !tags.includes('vegetarian') && !tags.includes('vegan')) return false;
  if (profile.diet_type === 'vegan' && !tags.includes('vegan')) return false;
  return true;
}

function recipeScore(recipe, profile) {
  const tags = parseJson(recipe.tags);
  const bs = bloodStatus(profile.blood, profile.conditions);
  let s = 0;
  const needSugar = profile.conditions.includes('diabetes') || bs.sugarControl === 'poor' || bs.tg === 'poor';
  const needSalt = profile.conditions.includes('hypertension');
  const needFat = profile.conditions.includes('high_cholesterol') || bs.ldl === 'poor';
  if (needSugar) s += tags.includes('diabetes_friendly') ? 3 : -4;
  if (needSalt) s += tags.includes('low_salt') ? 3 : -4;
  if (needFat) s += tags.includes('low_sat_fat') ? 3 : -4;
  return s;
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Saf fonksiyon: profile + tarifler → 7 günlük plan.
 *  shuffle=true ise ("Planı yenile") uygun tarifler arasından her seferinde farklı bir sıra seçilir;
 *  false ise sonuç hep aynıdır (testler ve ilk plan için). */
export function buildPlan(profile, recipes, { shuffle = false } = {}) {
  const target = profile.targetKcal;
  const items = [];
  const byType = {};
  for (const t of MEAL_TYPES) {
    byType[t] = recipes
      .filter((r) => r.meal_type === t && recipeAllowed(r, profile))
      .map((r) => ({ r, score: recipeScore(r, profile) }))
      .sort((a, b) => b.score - a.score);
  }
  for (let day = 0; day < 7; day++) {
    for (const t of MEAL_TYPES) {
      const list = byType[t];
      if (!list.length) continue;
      const best = list[0].score;
      let pool = list.filter((x) => x.score >= best - 2); // en uygun tarifler arasında döndür
      if (shuffle) pool = shuffled(pool);
      const pick = pool[(day + MEAL_TYPES.indexOf(t)) % pool.length].r;
      const portion = Math.min(1.75, Math.max(0.5, Math.round(((target * SHARES[t]) / pick.kcal) * 4) / 4));
      items.push({ day_index: day, meal_type: t, recipe_id: pick.id, portion, recipe: pick });
    }
  }
  // Bağımsız güvenlik kontrolü: alerjen içeren hiçbir öğün plana giremez
  const safe = items.filter((it) => recipeAllowed(it.recipe, profile));
  if (safe.length !== items.length) throw new Error('Alerjen filtresi plan dışı bir öğün yakaladı');
  return { target, items };
}

/** Planı yeniden üretir ve kaydeder (profil, kilo veya kan tahlili değiştiğinde çağrılır) */
export async function regeneratePlan(userId, reason) {
  const profile = await loadProfile(userId);
  const recipes = await query('SELECT * FROM recipes');
  // Önceki planla aynı tarif dizilimi çıkmasın diye birkaç kez dene
  const prev = await query(
    `SELECT pi.day_index, pi.meal_type, pi.recipe_id FROM plan_items pi JOIN diet_plans dp ON dp.id = pi.plan_id
      WHERE dp.user_id = ? AND dp.is_active = 1`, [userId]);
  const sig = (items) => items.map((i) => `${i.day_index}-${i.meal_type}-${i.recipe_id}`).sort().join('|');
  const prevSig = prev.length ? sig(prev) : null;
  const shuffle = reason === 'Kullanıcı isteği' && prev.length > 0;
  let plan = buildPlan(profile, recipes, { shuffle });
  for (let i = 0; shuffle && i < 8 && sig(plan.items) === prevSig; i++) plan = buildPlan(profile, recipes, { shuffle });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE diet_plans SET is_active = 0 WHERE user_id = ?', [userId]);
    const [res] = await conn.query('INSERT INTO diet_plans (user_id, target_kcal, reason) VALUES (?,?,?)', [userId, plan.target, reason]);
    if (plan.items.length) {
      await conn.query('INSERT INTO plan_items (plan_id, day_index, meal_type, recipe_id, portion_factor) VALUES ?',
        [plan.items.map((i) => [res.insertId, i.day_index, i.meal_type, i.recipe_id, i.portion])]);
    }
    await conn.commit();
    return res.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
