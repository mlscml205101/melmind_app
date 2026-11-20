// Veritabanını oluşturur, tabloları kurar ve örnek verileri yükler.
// Kullanım: npm run db:init        (mevcut veriyi korur)
//           npm run db:init -- --reset   (veritabanını silip baştan kurar)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { dbConfig } from '../db.js';
import { recipes, demoProducts, demoUsers } from '../../db/seedData.js';
import { plusRecipes } from '../../db/plusRecipes.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const reset = process.argv.includes('--reset');

const { database, ...serverCfg } = dbConfig;
const root = await mysql.createConnection({ ...serverCfg, multipleStatements: true });
if (reset) await root.query(`DROP DATABASE IF EXISTS \`${database}\``);
await root.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await root.end();

const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
await conn.query(await fs.readFile(path.join(here, '../../db/schema.sql'), 'utf8'));
console.log('✓ Tablolar hazır');

const [[{ c: recipeCount }]] = await conn.query('SELECT COUNT(*) c FROM recipes');
if (recipeCount === 0) {
  await conn.query(
    `INSERT INTO recipes (name, meal_type, kcal, protein_g, carbs_g, fat_g, sugar_g, salt_g, sat_fat_g, allergens, tags, ingredients, instructions) VALUES ?`,
    [recipes.map((r) => [r.name, r.meal_type, r.kcal, r.protein_g, r.carbs_g, r.fat_g, r.sugar_g, r.salt_g, r.sat_fat_g,
      JSON.stringify(r.allergens), JSON.stringify(r.tags), r.ingredients, r.instructions])]);
  console.log(`✓ ${recipes.length} tarif eklendi`);
}

// Plus tarif defteri: plusRecipes.js neyse veritabanı da o olur (eklenen/silinen/değişen tarifler eşitlenir)
for (const [i, r] of plusRecipes.entries()) {
  await conn.query(
    `INSERT INTO plus_recipes (title, category, minutes, servings, kcal, ingredients, instructions, sort_order) VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE category=VALUES(category), minutes=VALUES(minutes), servings=VALUES(servings), kcal=VALUES(kcal),
       ingredients=VALUES(ingredients), instructions=VALUES(instructions), sort_order=VALUES(sort_order)`,
    [r.title, r.category || 'Genel', r.minutes ?? null, r.servings ?? null, r.kcal ?? null, r.ingredients || '', r.instructions || '', i]);
}
if (plusRecipes.length) await conn.query('DELETE FROM plus_recipes WHERE title NOT IN (?)', [plusRecipes.map((r) => r.title)]);
else await conn.query('DELETE FROM plus_recipes');
console.log(`✓ ${plusRecipes.length} Plus tarifi eşitlendi`);

for (const p of demoProducts) {
  await conn.query(
    `REPLACE INTO products (barcode, name, brand, source, is_beverage, allergens, traces, labels, analysis_tags, ingredients_text,
      kcal_100g, sugar_100g, carbs_100g, fat_100g, sat_fat_100g, trans_fat_100g, salt_100g, protein_100g, fiber_100g, serving_g, nova_group, image_url)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [p.barcode, p.name, p.brand, p.source, p.is_beverage, JSON.stringify(p.allergens), JSON.stringify(p.traces), JSON.stringify(p.labels),
      JSON.stringify(p.analysis_tags), p.ingredients_text, p.kcal_100g, p.sugar_100g, p.carbs_100g, p.fat_100g, p.sat_fat_100g,
      p.trans_fat_100g, p.salt_100g, p.protein_100g, p.fiber_100g, p.serving_g, p.nova_group, p.image_url]);
}
console.log(`✓ ${demoProducts.length} demo ürün yüklendi`);
await conn.end();

// Test kullanıcıları — planları ve kan tahlilleri uygulamanın kendi servisleriyle oluşturulur
const { pool, query, one } = await import('../db.js');
const { regeneratePlan } = await import('../services/planner.js');
const { waterGoal } = await import('../services/profile.js');
const { compareBlood } = await import('../services/blood.js');
const hash = await bcrypt.hash('demo1234', 10);
for (const u of demoUsers) {
  if (await one('SELECT id FROM users WHERE email = ?', [u.email])) continue;
  const res = await query(
    `INSERT INTO users (email, password_hash, name, age, gender, height_cm, weight_kg, goal, activity, diet_type, water_goal_ml)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [u.email, u.password ? await bcrypt.hash(u.password, 10) : hash, u.name, u.age, u.gender, u.height_cm, u.weight_kg, u.goal, u.activity, u.diet_type, waterGoal(u.weight_kg)]);
  const id = res.insertId;
  for (const c of u.conditions) await query('INSERT INTO user_conditions VALUES (?,?)', [id, c]);
  for (const a of u.allergies) await query('INSERT INTO user_allergies VALUES (?,?)', [id, a]);
  await query('INSERT INTO weight_logs (user_id, weight_kg) VALUES (?,?)', [id, u.weight_kg]);
  let prev = {};
  for (const t of u.blood || []) {
    const r2 = await query("INSERT INTO blood_tests (user_id, test_date, source) VALUES (?,?,'manual')", [id, t.date]);
    for (const [m, v] of Object.entries(t.values)) await query('INSERT INTO blood_values (test_id, marker, value) VALUES (?,?,?)', [r2.insertId, m, v]);
    for (const a of compareBlood(t.values, prev, u.conditions, u.gender)) {
      await query("INSERT INTO alerts (user_id, type, marker, message) VALUES (?,'doctor',?,?)", [id, a.marker, a.message]);
    }
    prev = { ...prev, ...t.values };
  }
  await regeneratePlan(id, 'İlk kayıt');
  console.log(`✓ Test kullanıcısı: ${u.email} / ${u.password || 'demo1234'}`);
}
await pool.end();
console.log('Veritabanı hazır.');
