import { query, one } from '../db.js';

export const MARKERS = ['glucose', 'hba1c', 'total_cholesterol', 'ldl', 'hdl', 'triglycerides'];

/** Kullanıcının tam sağlık profilini (alerji, hastalık, son kan değerleri) getirir. */
export async function loadProfile(userId) {
  const user = await one(
    `SELECT id, email, name, age, gender, height_cm, weight_kg, goal, activity, diet_type, is_plus, large_text,
            water_goal_ml, step_goal, created_at FROM users WHERE id = ?`, [userId]);
  if (!user) return null;
  const conditions = (await query('SELECT condition_code FROM user_conditions WHERE user_id = ?', [userId])).map((r) => r.condition_code);
  const allergies = (await query('SELECT allergen_code FROM user_allergies WHERE user_id = ?', [userId])).map((r) => r.allergen_code);
  const blood = await latestBlood(userId);
  return { ...user, is_plus: !!user.is_plus, large_text: !!user.large_text, conditions, allergies, blood, targetKcal: targetCalories(user) };
}

/** Her belirteç için en güncel değer */
export async function latestBlood(userId) {
  const rows = await query(
    `SELECT bv.marker, bv.value, bt.test_date FROM blood_values bv
       JOIN blood_tests bt ON bt.id = bv.test_id
      WHERE bt.user_id = ? ORDER BY bt.test_date DESC, bt.id DESC`, [userId]);
  const out = {};
  for (const r of rows) if (out[r.marker] === undefined) out[r.marker] = Number(r.value);
  return out;
}

/** Mifflin-St Jeor ile günlük enerji hedefi */
export function targetCalories(u) {
  const w = Number(u.weight_kg), h = Number(u.height_cm), a = Number(u.age);
  const bmr = 10 * w + 6.25 * h - 5 * a + (u.gender === 'male' ? 5 : -161);
  const factor = { low: 1.2, medium: 1.45, high: 1.7 }[u.activity] || 1.2;
  let kcal = bmr * factor;
  if (u.goal === 'lose') kcal -= 500;
  if (u.goal === 'gain') kcal += 300;
  const min = u.gender === 'male' ? 1500 : 1200;
  return Math.round(Math.max(min, kcal) / 10) * 10;
}

export const waterGoal = (weightKg) => Math.round((Number(weightKg) * 33) / 100) * 100;

export const toEvalProfile = (p) => ({
  allergies: p.allergies, conditions: p.conditions, dietType: p.diet_type, goal: p.goal, blood: p.blood,
});
