-- MelMind veritabanı şeması (MySQL 8 / MariaDB 10.6+)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  age           TINYINT UNSIGNED NOT NULL,
  gender        ENUM('female','male') NOT NULL,
  height_cm     DECIMAL(5,1) NOT NULL,
  weight_kg     DECIMAL(5,1) NOT NULL,
  goal          ENUM('lose','maintain','gain') NOT NULL DEFAULT 'maintain',
  activity      ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  diet_type     ENUM('none','vegetarian','vegan') NOT NULL DEFAULT 'none',
  is_plus       TINYINT(1) NOT NULL DEFAULT 0,
  large_text    TINYINT(1) NOT NULL DEFAULT 0,
  water_goal_ml INT NOT NULL DEFAULT 2000,
  step_goal     INT NOT NULL DEFAULT 7000,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Kronik hastalıklar: diabetes, hypertension, high_cholesterol, celiac
CREATE TABLE IF NOT EXISTS user_conditions (
  user_id        INT NOT NULL,
  condition_code VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, condition_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alerji / intoleranslar: lactose, milk, gluten, egg, peanut, tree_nuts, soy, fish, shellfish, sesame
CREATE TABLE IF NOT EXISTS user_allergies (
  user_id      INT NOT NULL,
  allergen_code VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, allergen_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS weight_logs (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Kan tahlili (PDF dosyası SAKLANMAZ, yalnızca kullanıcının onayladığı değerler)
CREATE TABLE IF NOT EXISTS blood_tests (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  test_date  DATE NOT NULL,
  source     ENUM('manual','pdf_ai') NOT NULL DEFAULT 'manual',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- marker: glucose, hba1c, total_cholesterol, ldl, hdl, triglycerides
CREATE TABLE IF NOT EXISTS blood_values (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  marker  VARCHAR(40) NOT NULL,
  value   DECIMAL(7,2) NOT NULL,
  FOREIGN KEY (test_id) REFERENCES blood_tests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alerts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(40) NOT NULL,
  marker     VARCHAR(40) NULL,
  message    VARCHAR(500) NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MelMind ekibinin hazırladığı tarifler. JSON alanlar metin olarak saklanır (MySQL/MariaDB uyumu için)
CREATE TABLE IF NOT EXISTS recipes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  meal_type    ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  kcal         INT NOT NULL,
  protein_g    DECIMAL(5,1) NOT NULL,
  carbs_g      DECIMAL(5,1) NOT NULL,
  fat_g        DECIMAL(5,1) NOT NULL,
  sugar_g      DECIMAL(5,1) NOT NULL,
  salt_g       DECIMAL(4,2) NOT NULL,
  sat_fat_g    DECIMAL(5,1) NOT NULL,
  allergens    TEXT NOT NULL,   -- ["gluten","lactose","milk",...]
  tags         TEXT NOT NULL,   -- ["diabetes_friendly","low_salt","low_sat_fat","vegetarian","vegan"]
  ingredients  TEXT NOT NULL,
  instructions TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS diet_plans (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  target_kcal INT NOT NULL,
  reason      VARCHAR(200) NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS plan_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  plan_id    INT NOT NULL,
  day_index  TINYINT NOT NULL,           -- 0 = Pazartesi
  meal_type  ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  recipe_id  INT NOT NULL,
  portion_factor DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  FOREIGN KEY (plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Barkod ürünleri: Open Food Facts önbelleği + yerel/demo + kullanıcı eklemeleri (100 g / 100 ml başına)
CREATE TABLE IF NOT EXISTS products (
  barcode          VARCHAR(32) PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  brand            VARCHAR(120) NULL,
  source           ENUM('off','local','user') NOT NULL DEFAULT 'off',
  is_beverage      TINYINT(1) NOT NULL DEFAULT 0,
  allergens        TEXT NOT NULL,   -- ["en:milk","en:gluten",...]
  traces           TEXT NOT NULL,
  labels           TEXT NOT NULL,   -- ["en:gluten-free","en:vegan",...]
  analysis_tags    TEXT NOT NULL,   -- ["en:non-vegan",...]
  ingredients_text TEXT NULL,
  kcal_100g        DECIMAL(7,2) NULL,
  sugar_100g       DECIMAL(6,2) NULL,
  carbs_100g       DECIMAL(6,2) NULL,
  fat_100g         DECIMAL(6,2) NULL,
  sat_fat_100g     DECIMAL(6,2) NULL,
  trans_fat_100g   DECIMAL(6,2) NULL,
  salt_100g        DECIMAL(6,3) NULL,
  protein_100g     DECIMAL(6,2) NULL,
  fiber_100g       DECIMAL(6,2) NULL,
  serving_g        DECIMAL(7,1) NULL,
  nova_group       TINYINT NULL,
  image_url        VARCHAR(500) NULL,
  fetched_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS barcode_scans (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  barcode    VARCHAR(32) NOT NULL,
  verdict    ENUM('suitable','caution','unsuitable','unknown') NOT NULL,
  reasons    TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meals (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  eaten_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meal_type   ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  name        VARCHAR(200) NOT NULL,
  source      ENUM('manual','photo','barcode','plan') NOT NULL DEFAULT 'manual',
  grams       DECIMAL(7,1) NULL,
  kcal        INT NOT NULL,
  protein_g   DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g     DECIMAL(6,1) NOT NULL DEFAULT 0,
  fat_g       DECIMAL(6,1) NOT NULL DEFAULT 0,
  barcode     VARCHAR(32) NULL,
  is_estimate TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS photo_analyses (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS water_logs (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  amount_ml INT NOT NULL,
  logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS step_logs (
  user_id  INT NOT NULL,
  log_date DATE NOT NULL,
  steps    INT NOT NULL,
  PRIMARY KEY (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    INT NOT NULL,
  badge_code VARCHAR(40) NOT NULL,
  earned_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MelMind Plus tarif defteri: tarifler server/db/plusRecipes.js dosyasından okunur (initDb her açılışta eşitler)
CREATE TABLE IF NOT EXISTS plus_recipes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(150) NOT NULL UNIQUE,
  category     VARCHAR(60) NOT NULL DEFAULT 'Genel',
  minutes      INT NULL,
  servings     INT NULL,
  kcal         INT NULL,
  ingredients  TEXT NOT NULL,
  instructions TEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
