# MelMind — Yapay Zekâ Destekli Diyet Karar Destek Mobil Uygulaması

Rapordaki (MEL-DSS, v0.1) prototipin çalışan sürümü.

| Katman | Teknoloji |
|---|---|
| Mobil uygulama | React Native + **Expo SDK 58** (`mobile/`) |
| Sunucu (API) | Node.js + Express (`server/`) |
| Veritabanı | **MySQL** 8 (MariaDB 10.6+ ile de çalışır) |
| Barkod verisi | Open Food Facts (ücretsiz, açık veri) + yerel MySQL önbelleği |
| Yapay zekâ (isteğe bağlı) | Anthropic Claude API — kan tahlili PDF okuma, tabak fotoğrafı, beslenme koçu |

---

## 1. Kurulum (macOS)

### 1.1 Gerekenler
```bash
brew install node mysql
brew services start mysql
```
Telefonunuza **Expo Go** uygulamasını yükleyin (App Store / Google Play).

### 1.2 Veritabanı ve sunucu
```bash
cd server
cp .env.example .env          # DB_USER / DB_PASSWORD'u kendi MySQL bilgilerinizle düzenleyin
npm install
npm run db:init               # veritabanını, tabloları, tarifleri, demo ürünleri ve test kullanıcılarını oluşturur
npm test                      # barkod uyumluluk motoru testleri (10 test)
npm run dev                   # API: http://localhost:4000
```
Sunucu açılınca konsolda **"Telefondan erişim: http://192.168.x.x:4000"** satırını görürsünüz.

> Veritabanını sıfırlamak için: `npm run db:init -- --reset`

### 1.3 Mobil uygulama
```bash
cd mobile
cp .env.example .env          # EXPO_PUBLIC_API_URL'ye sunucunun yazdığı IP adresini girin
npm install
npx expo start
```
Terminalde çıkan **QR kodu** iPhone'da Kamera, Android'de Expo Go ile okutun. Telefon ve bilgisayar **aynı Wi-Fi** ağında olmalı.

---

## 2. Barkod okuma ve diyet uyumluluk kontrolü

Akış: **Kamera → barkod (EAN-13/EAN-8/UPC) → ürün bilgisi → kullanıcının profiline göre karar**

1. `mobile/src/screens/ScanScreen.js` — `expo-camera` ile canlı okuma, el feneri, galeriden barkod fotoğrafı, elle barkod girişi.
2. `server/src/services/products.js` — önce MySQL'deki ürüne bakar (30 gün önbellek), yoksa Open Food Facts'ten çeker ve kaydeder.
3. `server/src/services/compatibility.js` — **yapay zekâdan bağımsız kural motoru** (Rapor R-03). Kontrol ettikleri:

| Kontrol | Kural |
|---|---|
| Alerjen / intolerans | Ürünün alerjen etiketleri + içindekiler metninde Türkçe/İngilizce anahtar kelime (kelime başı eşleşme; "karabuğday", "soyulmuş", "hindistan cevizi sütü" gibi yanlış pozitifler engellenir). "Glutensiz"/"laktozsuz" etiketleri tanınır. "Eser miktarda içerebilir" uyarısı → dikkat (çölyakta → uygun değil). |
| Diyabet | Şeker (FSA eşikleri: >22,5 g/100 g yüksek); şekerli içecek (>5 g/100 ml) her zaman uygun değil; **son HbA1c ≥ 7 veya açlık şekeri ≥ 130 ise orta şekerli ürün de uygun değil**. |
| Yüksek tansiyon | Tuz (>1,5 g/100 g yüksek, 0,3–1,5 orta). |
| Yüksek kolesterol | Doymuş yağ (>5 g/100 g yüksek), trans yağ; **LDL ≥ 160 ise orta doymuş yağ da uygun değil**. |
| Kan değerleri (tanı yoksa) | Sınırda kan şekeri / yüksek LDL / trigliserit için ek uyarılar. |
| Vejetaryen / vegan | Open Food Facts analiz etiketleri + et/jelatin/süt/yumurta/bal kelimeleri. |
| Kilo verme hedefi | ≥400 kcal/100 g ürünlerde porsiyon uyarısı. |

Sonuç: **✅ Diyetinize uygun · ⚠️ Dikkatli tüketin · ⛔ Diyetinize uygun değil · ❔ Değerlendirilemedi** + her kararın gerekçesi + besin tablosu (Düşük/Orta/Yüksek). Kullanıcı ürünü gram girerek günlüğüne ekleyebilir; uygun olmayan ürün eklenirken onay istenir. Ürün bulunamazsa kullanıcı etiketten bilgileri girer ve aynı kontrol yapılır.

### Demo barkodlarla deneme
Sunucu açıkken bilgisayarda **http://localhost:4000/demo-barkodlar** sayfasını açın ve telefonla okutun. Gerçek market ürünleri de (Open Food Facts'te kayıtlıysa) çalışır.

Test kullanıcıları (şifre: `demo1234`) — rapordaki Obj 2 test senaryoları:

| E-posta | Profil | Örnek beklenen sonuç |
|---|---|---|
| `diyabet@melmind.test` | Tip 2 diyabet + tansiyon, HbA1c 7,4 | Şekerli kola ⛔, şekersiz kola ✅, sucuk ⛔ (tuz) |
| `laktoz@melmind.test` | Laktoz intoleransı | Sütlü çikolata ⛔, laktozsuz süt ✅ |
| `colyak@melmind.test` | Çölyak | Tam buğday ekmeği ⛔, glutensiz kraker ✅, cips ⛔ (gluten izi) |
| `kolesterol@melmind.test` | Yüksek kolesterol, LDL 168, kuruyemiş alerjisi | Beyaz peynir ⛔, badem ⛔ (alerji), nohut ✅ |

---

## 3. Rapordaki işlevler ve karşılıkları

| İşlev | Nerede |
|---|---|
| Kayıt: kilo, boy, yaş, cinsiyet, hastalıklar, alerjiler | `AuthScreens.js` → `POST /api/auth/register` |
| Kan tahlili PDF → AI okur → kullanıcı onaylar (PDF saklanmaz) | `HealthScreen.js` → `POST /api/blood/parse-pdf`, `POST /api/blood` |
| Değer kötüleşince / hedef dışındaysa "doktorunuza başvurun" | `server/src/services/blood.js` |
| Tariflerden kişisel plan + bağımsız alerjen filtresi | `server/src/services/planner.js` |
| Plan kendini günceller (kilo, profil, kan tahlili değişince hemen) | `regeneratePlan()` çağrıları |
| Tabak fotoğrafı → kalori (günde 3 ücretsiz, Plus sınırsız) | `MealsScreen.js` → `POST /api/meals/photo` |
| Barkod ile ürün kontrolü | Bölüm 2 |
| Adım sayar | `mobile/src/steps.js` (telefon sensörü) |
| Su takibi + "Bugün 1,2 L içtiniz, hedefiniz 2,5 L…" mesajı | `HomeScreen.js`, `/api/water` |
| Öğün ve su hatırlatma bildirimleri | `mobile/src/reminders.js` |
| Rozetler ve günlük seri | `server/src/services/badges.js` |
| Yaşlılar için büyük butonlar ve "Büyük yazı" ayarı | `components/ui.js`, Profil ekranı |
| MelMind Plus — AI beslenme koçu (teşhis/ilaç sorularını reddeder) | `ProfileScreens.js` → `POST /api/coach` |

## 4. Yapay zekâ özellikleri (isteğe bağlı)
`server/.env` içine `ANTHROPIC_API_KEY=...` ekleyin. Anahtar yoksa uygulama tamamen çalışır; yalnızca PDF okuma, fotoğraf analizi ve koç kapalıdır (kan değerleri ve öğünler elle girilir). Barkod kontrolü yapay zekâ kullanmaz.

## 5. Notlar ve sınırlar
- Tarif besin değerleri ve kan değeri eşikleri **yaklaşık/varsayılandır**; diyetisyen görüşmesi (D1–D5) sonrası güncellenmelidir (`db/seedData.js`, `services/blood.js`, `services/compatibility.js`).
- Android'de adım sayımı uygulama açıkken yapılır; iOS günün toplamını doğrudan okur.
- Expo Go'da bildirimler ve kamera çalışır; mağazaya yüklemek için `eas build` gerekir.
- MelMind tıbbi tavsiye vermez; tüm sonuçlar bilgilendirme amaçlıdır.
