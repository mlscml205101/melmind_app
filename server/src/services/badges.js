import { query, one } from '../db.js';

export const BADGES = {
  first_meal:   { title: 'İlk Öğün', desc: 'İlk öğününü kaydettin', icon: '🍽️' },
  first_scan:   { title: 'Barkod Avcısı', desc: 'İlk barkodunu okuttun', icon: '🔎' },
  streak_3:     { title: '3 Gün Seri', desc: '3 gün üst üste öğün kaydettin', icon: '🔥' },
  streak_7:     { title: '7 Gün Seri', desc: '7 gün üst üste öğün kaydettin', icon: '🏆' },
  water_goal:   { title: 'Su Ustası', desc: 'Günlük su hedefine ulaştın', icon: '💧' },
  steps_goal:   { title: 'Adım Adım', desc: 'Günlük adım hedefine ulaştın', icon: '👟' },
  blood_test:   { title: 'Sağlık Takibi', desc: 'İlk kan tahlilini ekledin', icon: '🩸' },
};

/** Bugünden geriye kesintisiz öğün kaydı yapılan gün sayısı */
export async function mealStreak(userId) {
  const rows = await query(
    `SELECT DISTINCT DATE(eaten_at) d FROM meals WHERE user_id = ? AND eaten_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) ORDER BY d DESC`, [userId]);
  const days = new Set(rows.map((r) => String(r.d).slice(0, 10)));
  let streak = 0;
  const d = new Date();
  // bugün henüz kayıt yoksa seri dünden itibaren sayılır
  if (!days.has(fmt(d))) d.setDate(d.getDate() - 1);
  while (days.has(fmt(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Koşulları kontrol eder, yeni kazanılan rozetleri döndürür */
export async function checkBadges(userId) {
  const have = new Set((await query('SELECT badge_code FROM user_badges WHERE user_id = ?', [userId])).map((r) => r.badge_code));
  const u = await one('SELECT water_goal_ml, step_goal FROM users WHERE id = ?', [userId]);
  const earned = [];
  const give = async (code, cond) => {
    if (have.has(code) || !cond) return;
    await query('INSERT IGNORE INTO user_badges (user_id, badge_code) VALUES (?,?)', [userId, code]);
    earned.push({ code, ...BADGES[code] });
  };
  const meals = await one('SELECT COUNT(*) c FROM meals WHERE user_id = ?', [userId]);
  await give('first_meal', meals.c > 0);
  const scans = await one('SELECT COUNT(*) c FROM barcode_scans WHERE user_id = ?', [userId]);
  await give('first_scan', scans.c > 0);
  const streak = await mealStreak(userId);
  await give('streak_3', streak >= 3);
  await give('streak_7', streak >= 7);
  const water = await one('SELECT COALESCE(SUM(amount_ml),0) s FROM water_logs WHERE user_id = ? AND DATE(logged_at) = CURDATE()', [userId]);
  await give('water_goal', Number(water.s) >= u.water_goal_ml);
  const steps = await one('SELECT steps FROM step_logs WHERE user_id = ? AND log_date = CURDATE()', [userId]);
  await give('steps_goal', steps && steps.steps >= u.step_goal);
  const bt = await one('SELECT COUNT(*) c FROM blood_tests WHERE user_id = ?', [userId]);
  await give('blood_test', bt.c > 0);
  return earned;
}
