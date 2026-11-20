// "Her pazartesi değil, bugün başlıyoruz — diyet tarifleri" listesinden alınan tarifler.
// Malzemeler ve süreler kaynaktan; yapılış adımları kısaltılarak yeniden yazıldı. Ayrıntılı anlatım için kaynak linkine bakın.
// Kaynak liste: https://www.nefisyemektarifleri.com/liste/her-pazartesi-degil-bugun-basliyoruz-diyet-tarifleri/
const src = (slug) => `\n\nKaynak: https://www.nefisyemektarifleri.com/${slug}/`;

export const nefisDiyetTarifleri = [
  { title: 'Kabak spagetti', category: 'Ana yemek', minutes: 30, servings: 2,
    ingredients: `4 orta boy kabak
6 yemek kaşığı zeytinyağı (4 kabak, 2 sos için)
1 büyük domates (rendelenmiş)
1 yemek kaşığı domates salçası
3 yemek kaşığı sıcak su
2 diş sarımsak
Tuz, karabiber, pul biber
Rendelenmiş kaşar (isteğe bağlı)`,
    instructions: `1. Kabakları soyup soyacak veya bıçakla uzun, ince şeritler hâlinde kesin.
2. Şeritleri yüksek ateşte zeytinyağıyla, suyu çekilip hafif renk alana kadar çevirin; tuzlayın.
3. Ayrı tencerede doğranmış sarımsağı zeytinyağında kavurun, domates, salça ve baharatları ekleyin. Kaynayınca su ve tuz ekleyip pişirin.
4. Kabakları sosa alıp birkaç dakika daha pişirin; dilerseniz kaşarla servis edin.` + src('kabak-spagetti') },

  { title: 'Domatesli yulaflı poğaça', category: 'Kahvaltılık', minutes: 25, servings: 3,
    ingredients: `2 su bardağı yulaf
1 yumurta
2 dolu yemek kaşığı yoğurt
Yarım paket kabartma tozu
1 domates
150 g beyaz peynir
5-6 dal maydanoz
1 çay kaşığından az pul biber ve karabiber
1 çay kaşığı tuz
Çörek otu`,
    instructions: `1. Domatesi küp doğrayın, peyniri ezin, maydanozu kıyın.
2. Çörek otu hariç tüm malzemeyi bir kapta iyice karıştırın.
3. Hamurdan parçalar alıp yağlı kâğıt serili tepsiye dizin, üzerine çörek otu serpin.
4. Önceden ısıtılmış 180 °C fırında (fansız) üstü kızarana kadar yaklaşık 20 dakika pişirin.` + src('domatesli-yulafli-pogaca') },

  { title: 'Muzlu kakaolu pratik brownie topları', category: 'Tatlı', minutes: 30, servings: 3,
    ingredients: `1 yumurta
1 olgun muz (yarısı keke, yarısı sonra)
1 yemek kaşığı kakao
1 yemek kaşığı pekmez veya bal
1 çay kaşığı karbonat
2 yemek kaşığı tam buğday unu
1 tatlı kaşığı şekersiz fıstık ezmesi veya tahin
6-7 kare bitter çikolata`,
    instructions: `1. Muzun yarısını ezin. Yumurta, karbonat ve pekmezi çırpın, kalan kek malzemelerini ekleyip karıştırın.
2. Karışımı sufle kabına dökün; kabı içine biraz su konmuş derin bir tencereye yerleştirip kapağı kapalı, orta ateşte yaklaşık 15 dakika pişirin.
3. Soğuyan keki ufalayın, kalan muzu ezip ekleyin ve yoğurun; yaklaşık 10 küçük top yapın.
4. Topları benmaride eritilmiş çikolataya batırıp derin dondurucuda 10-15 dakika bekletin.` + src('brownie-instense-tadinda-pratik-cikolata') },

  { title: 'Düşük karbonhidratlı diyet ekmek', category: 'Kahvaltılık', minutes: 70, servings: 3,
    ingredients: `250 g lor veya süzme yoğurt
4 yumurta
50 g fındık
50 g badem
60 g keten tohumu
40 g chia tohumu
Yarım paket kabartma tozu
Tuz
Üzeri için susam ve kabak çekirdeği`,
    instructions: `1. Yoğurt ve yumurtaları karıştırın; toz hâline getirdiğiniz fındık ve bademi ekleyin.
2. Keten tohumu, chia, kabartma tozu ve tuzu ilave edip karıştırın; hamuru 5 dakika dinlendirin.
3. Yağlı kâğıt serili dikdörtgen kalıba dökün, üzerine susam ve çekirdek serpin.
4. 190 °C alt-üst fırında 60-70 dakika pişirin, kalıpta soğumaya bırakın.` + src('diyet-ekmek-low-carb') },

  { title: 'Kabaklı diyet çorba', category: 'Çorba', minutes: 40, servings: 4,
    ingredients: `3 kabak
1 soğan
3 diş sarımsak
5 dal maydanoz
1 domates (veya domates sosu)
2 su bardağı süt
3 su bardağı su
1 çay kaşığı tuz
1 yemek kaşığı zeytinyağı`,
    instructions: `1. Kabak, soğan, sarımsak, maydanoz ve domatesi iri doğrayıp tencereye alın.
2. Süt, su, tuz ve zeytinyağını ekleyip orta ateşte sebzeler yumuşayana kadar pişirin.
3. Blenderdan pürüzsüz olana kadar geçirin; koyu gelirse biraz su ekleyip bir taşım kaynatın.` + src('kabakli-diyet-corba') },

  { title: 'Çilekli yoğurt kasesi', category: 'Kahvaltılık', minutes: 10, servings: 1,
    ingredients: `6 çilek
6-7 yemek kaşığı yağsız yoğurt
1 çay kaşığı bal (isteğe bağlı)
Kahvaltılık buğday gevreği`,
    instructions: `1. Çilek, yoğurt ve balı blenderda karıştırın.
2. Kasenin yarısına kadar gevrek koyun, üzerine çilekli yoğurdu dökün ve dilediğiniz gibi süsleyin.` + src('cilekli-yogurt-tarifi') },

  { title: 'Kâğıtta palamut', category: 'Ana yemek', minutes: 50, servings: 2,
    ingredients: `2 orta boy palamut (fileto)
Kuru soğan
Domates
Maydanoz
Limon
Defne yaprağı
1 diş sarımsak
Zeytinyağı
Tuz`,
    instructions: `1. Balıkları fileto hâline getirip temizleyin (balıkçıya yaptırabilirsiniz).
2. Yağlı kâğıdı az zeytinyağıyla yağlayın, üzerine soğan halkalarını dizin.
3. Balığı soğanların üstüne koyup tuzlayın; maydanoz, domates ve limon dilimleri, defne yaprağı ve ikiye bölünmüş sarımsağı ekleyin.
4. 1 yemek kaşığı zeytinyağı gezdirip kâğıdı suyu kaçmayacak şekilde sıkıca kapatın.
5. 190 °C fırında balığın büyüklüğüne göre yaklaşık 40 dakika pişirin.` + src('kagitta-palamut-kebabi') },

  { title: 'Glutensiz mercimek cips', category: 'Atıştırmalık', minutes: 40, servings: 4,
    ingredients: `1 su bardağı kırmızı mercimek
1 silme çay kaşığı tuz
1 çay kaşığı mavi haşhaş
2 çay kaşığı çörek otu
1 çay kaşığı pul biber
2 çay kaşığı keten tohumu
Yarım çay bardağı zeytinyağı`,
    instructions: `1. Mercimeği yıkayıp bir gece suda bekletin, sabah süzün.
2. Mercimeği tüm baharat, tohum ve zeytinyağıyla birlikte robotta pürüzsüz olana kadar çekin.
3. Yağlı kâğıt serili tepsiye spatulayla çok ince yayın (ne kadar ince, o kadar çıtır).
4. 200 °C fırında kızarana kadar 20-25 dakika pişirin.
Not: Glutensiz tüketecekseniz ürün etiketlerini kontrol edin.` + src('mercimek-cips-glutensiz') },

  { title: 'Şekersiz hurmalı ve kayısılı toplar', category: 'Tatlı', minutes: 35, servings: 12,
    ingredients: `Kayısılı toplar:
6 kuru kayısı
2 yemek kaşığı tahin
3-4 avuç ceviz içi
Kaplama için hindistan cevizi (isteğe bağlı)

Hurmalı toplar:
15 hurma
2 yemek kaşığı tahin
3 yemek kaşığı kakao
4 yemek kaşığı süt
4 dolu kaşık ceviz veya fındık
Kıvam için hindistan cevizi`,
    instructions: `1. Kayısılı toplar: Kayısı, tahin ve cevizi robotta çekin; ceviz büyüklüğünde yuvarlayıp dilerseniz hindistan cevizine bulayın.
2. Hurmalı toplar: Hurmaları yaklaşık 30 dakika sıcak suda bekletin, sonra tahin, kakao, süt ve cevizle robotta çekin.
3. Kıvam için hindistan cevizi ekleyin ve ceviz büyüklüğünde toplar yapın.` + src('sekersiz-hurmali-ve-kayisili-saglikli-toplar') },

  { title: 'Yumurtalı tam buğday ekmeği kahvaltısı', category: 'Kahvaltılık', minutes: 10, servings: 1,
    ingredients: `1 dilim tam buğday ekmeği
2 yumurta
1 yemek kaşığı sıvı yağ
Kıyılmış maydanoz
Kimyon, tuz
Yanına: domates, salatalık, 1 dilim beyaz peynir, 2-3 zeytin`,
    instructions: `1. Ekmeği küp doğrayın; yumurta, tuz ve kimyonla bir kapta karıştırın.
2. Tavada yağı ısıtıp karışımı dökün; pişmeye yakın maydanozu ekleyin.
3. Domates, salatalık, peynir ve zeytinle servis edin.` + src('yumurtali-bugday-ekmegi-diyet-kahvaltisi') },

  { title: 'Fit dondurma (3 çeşit)', category: 'Tatlı', minutes: 15, servings: 2,
    ingredients: `Muzlu kakaolu:
2 muz, 4 yemek kaşığı süt, 2 yemek kaşığı bal, 1,5 yemek kaşığı kakao

Orman meyveli:
1 kase karışık meyve, yarım muz, 4 yemek kaşığı süt, 1 vanilya, 1 yemek kaşığı bal

Mangolu:
1 kase mango, 1,5 yemek kaşığı yoğurt, 2 yemek kaşığı hindistan cevizi, 3 yemek kaşığı limon suyu`,
    instructions: `1. Meyveleri bir gece önceden dilimleyip dondurucu poşetinde dondurun.
2. Kullanmadan önce 10 dakika oda sıcaklığında bekletin.
3. Seçtiğiniz çeşidin malzemelerini robotta kremamsı olana kadar çekin.
4. Saklama kabına alıp birkaç saat dondurun. Süt yerine yoğurt kullanabilirsiniz.` + src('fit-dondurma-7847720') },

  { title: 'Yulaflı diyet kurabiye', category: 'Tatlı', minutes: 35, servings: 6,
    ingredients: `1 su bardağı yulaf ezmesi
1 muz
1 yumurta akı
Yarım çay bardağı ceviz
Yarım çay bardağı kuru üzüm
4 hurma
1 kuru incir
1 çay kaşığı kabartma tozu`,
    instructions: `1. Yumurta akını koyulaşana kadar çırpın, muzu ezerek ekleyin.
2. Yulafı ve doğranmış kuru meyveleri, cevizi ve kabartma tozunu ilave edin; ele yapışırsa biraz daha yulaf ekleyin.
3. Şekil verip yağlı kâğıda dizin, önceden ısıtılmış 180 °C fırında yaklaşık 25 dakika pişirin.` + src('yulafli-diyet-kurabiye') },

  { title: 'Şekersiz pekmezli kurabiye', category: 'Tatlı', minutes: 15, servings: 4,
    ingredients: `1 yumurta
1/4 su bardağı pekmez
1/2 su bardağı tahin
1/2 çay bardağı kakao
1 çay kaşığı kabartma tozu
1 çay kaşığı vanilin`,
    instructions: `1. Yumurta ve pekmezi çırpın, kalan malzemeleri ekleyip hafif akışkan bir hamur elde edin.
2. Kaşıkla aralıklı olarak tepsiye bırakın.
3. 180 °C fırında 10 dakika pişirin.` + src('sekersiz-pekmezli-cookie') },

  { title: 'Diyet omlet', category: 'Kahvaltılık', minutes: 10, servings: 1,
    ingredients: `1 kırmızı biber
1 sivri biber
2 yumurta
Yarım çay bardağı süt
3-4 dal maydanoz
1 çay kaşığı tereyağı
Tuzsuz lor (isteğe bağlı)`,
    instructions: `1. Biberleri ve maydanozu ince doğrayın; yumurta, süt ve loru çırpın.
2. Yapışmaz tavada tereyağını eritip karışımı dökün.
3. Üzerine biber ve maydanozu serpip kısık ateşte pişirin. Salatalık ve domatesle servis edebilirsiniz.` + src('diyet-omlet-3168612') },

  { title: 'Kabak pizza', category: 'Ana yemek', minutes: 45, servings: 4,
    ingredients: `7-8 iri kabak dilimi (1-2 cm)
2 yemek kaşığı zeytinyağı
1 yeşil biber
1 kırmızı biber
Yarım çay bardağı rendelenmiş kaşar
6-7 zeytin
Tuz, kekik, karabiber`,
    instructions: `1. Kabak dilimlerini yağlı kâğıt serili tepsiye dizin, hafifçe zeytinyağı sürün.
2. 190 °C fırında yumuşayana kadar 5-10 dakika pişirin.
3. Baharatlayın, ince doğranmış biber ve zeytini üzerine yayıp fırına geri verin.
4. Pişince kaşarı ekleyin ve eriyene kadar fırında tutun.` + src('diyet-kabak-pizza') },

  { title: 'Diyet makarna salatası', category: 'Salata', minutes: 15, servings: 1,
    ingredients: `1 su bardağı tam buğday veya kepekli makarna
3 yemek kaşığı yoğurt
2 yemek kaşığı mısır
1 kırmızı biber
1 salatalık turşusu
4-5 zeytin
Birer tutam maydanoz ve dereotu
Üzeri için nane, pul biber, kekik`,
    instructions: `1. Makarnayı tuzlu suda yumuşayana kadar haşlayın ve soğutun.
2. Çırpılmış yoğurtla karıştırın.
3. Diğer malzemeleri ince doğrayıp ekleyin, karıştırın; baharatlarla servis edin.` + src('diyet-makarna-salatasi-3087206') },

  { title: 'Tost makinesinde ızgara sebze', category: 'Ara öğün', minutes: 20, servings: 1,
    ingredients: `1 kabak (isteğe bağlı)
Yeşil veya kırmızı biber
Mantar (isteğe bağlı)
Domates
Tuz
Pişirme kâğıdı veya biraz zeytinyağı`,
    instructions: `1. Sebzeleri yıkayın, kabağı ince dilimleyin; biberleri bütün bırakın.
2. Tost makinesinde pişirme kâğıdıyla (ya da sebzelere az zeytinyağı sürerek) pişirin.
3. Pişince az tuz ekleyin; yoğurt veya domates sosuyla servis edin.` + src('tost-makinesinde-izgara-sebze-diyet') },

  { title: 'Fırında kabak mücver', category: 'Ana yemek', minutes: 50, servings: 6,
    ingredients: `4 orta boy kabak
2 yumurta
Yarım demet dereotu
20-25 dal maydanoz
8-10 dal yeşil soğan
200 g beyaz peynir (light olabilir)
1 çay bardağı un (tam buğday olabilir)
1 paket kabartma tozu
Yarım kahve fincanı sıvı yağ
Tuz, karabiber, pul biber
Üzeri için kaşar (isteğe bağlı)`,
    instructions: `1. Kabakları rendeleyip suyunu sıkın; yeşillikleri kıyın, peyniri ezin, yumurtaları köpürene kadar çırpın.
2. Tüm malzemeyi karıştırın; çok sulu olmaması için unu kıvama göre ayarlayın.
3. Yağlanmış ya da kâğıt serili kaba yayın, 200 °C fırında pişirin; ortası pişsin diye sonra ısıyı düşürün.
4. Üstü kızarmaya başlayınca kaşar serpip eriyene kadar pişirin. Sarımsaklı yoğurtla servis edebilirsiniz.` + src('firinda-kabak-mucver-yapimi') },

  { title: 'Ev yapımı granola bar', category: 'Atıştırmalık', minutes: 35, servings: 10,
    ingredients: `2 su bardağı yulaf ezmesi
1/2 su bardağı hindistan cevizi
1 su bardağı badem
1/2 su bardağı kaju
1 su bardağı kuru meyve
1/2 su bardağı kabak çekirdeği içi
1 çay bardağı damla çikolata
1 çay kaşığı tarçın
1 çay kaşığı vanilya
1 çay bardağı fıstık ezmesi
1 çay bardağı bal
1/2 çay bardağı esmer şeker`,
    instructions: `1. Yulaf, hindistan cevizi, badem, kaju ve kabak çekirdeğini tepsiye yayıp 150 °C'de 10 dakika kavurun.
2. Bal, şeker, fıstık ezmesi, tarçın ve vanilyayı kısık ateşte şeker eriyene kadar ısıtın.
3. Kavrulan karışımı bu sosla birleştirin; kuru meyve ve çikolatayı ekleyin.
4. Kâğıt serili 28x24 cm kaba sıkıca bastırın, 150 °C'de 20 dakika pişirin.
5. Soğuyunca keskin bıçakla bar şeklinde kesin. Kuruyemişler tuzsuz olmalı.` + src('granola-bar-yapimi') },

  { title: 'Yağsız ve şekersiz diyet kek', category: 'Tatlı', minutes: 20, servings: 4,
    ingredients: `1 yumurta
1 su bardağı süt
2 yemek kaşığı pekmez
1 çay kaşığı tarçın
1 çay bardağı kuru üzüm
3 kuru kayısı
3-4 Medine hurması
1 paket kabartma tozu
2,5-3 su bardağı un`,
    instructions: `1. Kayısı ve hurmayı ince doğrayın; un hariç tüm malzemeyi karıştırın.
2. Unu en son ekleyip çırpmadan, nazikçe katlayarak karıştırın.
3. Hafif yağlanmış silikon kalıplara paylaştırın, 180 °C'de 10-15 dakika pişirin.` + src('yagsiz-ve-sekersiz-diyet-kek') },

  { title: 'Muzlu çilekli ıspanaklı yeşil smoothie', category: 'İçecek', minutes: 5, servings: 1,
    ingredients: `1 muz
5-8 çilek
1 avuç ıspanak (yaklaşık 150 g)
3 su bardağı su`,
    instructions: `1. Meyveleri doğrayın.
2. Tüm malzemeyi blendera alıp pürüzsüz olana kadar çekin.` + src('yesil-smoothie-muzlu-cilekli-ispanakli-smoothie-diyet') },

  { title: 'Brokoli salatası', category: 'Salata', minutes: 15, servings: 4,
    ingredients: `Brokoli
3-4 salatalık turşusu
Konserve mısır
Közlenmiş kırmızı biber
Yeşil soğan
2-3 diş sarımsak
Zeytinyağı, limon, tuz`,
    instructions: `1. Brokoliyi küçük çiçeklerine ayırıp 4 dakika haşlayın, küçük parçalar hâlinde doğrayın.
2. İnce doğranmış yeşil soğan, közlenmiş biber, turşu ve mısırı ekleyin.
3. Zeytinyağı gezdirin, sarımsağı rendeleyin, limon ve tuz ekleyip karıştırarak servis edin.` + src('tarif-brokoli-salatasi-yapilisi') },

  { title: 'Kuru meyveli mozaik pasta (pişmeyen)', category: 'Tatlı', minutes: 130, servings: 10,
    ingredients: `1 su bardağı çiğ fındık
1 su bardağı çiğ badem
1 su bardağı kaju
4 muz (3'ü ezilmiş, 1'i doğranmış)
1 su bardağı kuru üzüm
1 su bardağı gün kurusu
5 küçük kuru kayısı
1 küçük bardak kuru elma
1 küçük bardak turna yemişi
3 yemek kaşığı kakao
Üzeri için eritilmiş çikolata (isteğe bağlı)`,
    instructions: `1. Fındık, badem ve kajuyu robotta iri çekip derin bir kaba alın.
2. 3 muzu püre yapıp ekleyin; kayısı, gün kurusu, kuru elma ve 1 muzu doğrayıp ilave edin.
3. Üzüm, turna yemişi ve kakaoyu ekleyip iyice karıştırın.
4. Streç film serili küçük kalıba sıkıca bastırın, üzerini kapatıp 2 saat dondurucuda bekletin.
5. Kalıptan çıkarıp kare dilimler hâlinde kesin; dilerseniz çikolatayla süsleyin.` + src('diyet-mozaik-pasta-90-60-90-pastasi') },

  { title: 'Diyet poğaça', category: 'Kahvaltılık', minutes: 35, servings: 4,
    ingredients: `2 yumurta
3 yemek kaşığı yoğurt
7-8 yemek kaşığı tam buğday unu
2 yemek kaşığı su
1 çay kaşığı sıvı yağ
1 paket kabartma tozu
2 yemek kaşığı lor peyniri
5-6 dal maydanoz
Çörek otu`,
    instructions: `1. İki yumurta akı ve bir sarıyı çırpın (diğer sarıyı ayırın); yoğurt, su, yağ, un ve kabartma tozuyla kekten koyu bir hamur yapın.
2. Lor ve kıyılmış maydanozu ekleyin.
3. Islak kaşıkla en az 15 parça alıp yağlı kâğıt serili tepsiye dizin.
4. Üzerine ayrılan sarıyı sürüp çörek otu serpin; 180 °C'de üstü kızarana kadar pişirin.` + src('diyet-pogaca-tarifi') },

  { title: 'Diyet elmalı kek', category: 'Tatlı', minutes: 45, servings: 4,
    ingredients: `2 yumurta
1 çay bardağı üzüm pekmezi
Yarım su bardağı süt
Yarım su bardağından az zeytinyağı (isteğe bağlı)
1 paket kabartma tozu
1 paket vanilya
1,5 su bardağı kepekli un
1 rendelenmiş elma
Yarım su bardağı ceviz
Yarım su bardağı kuru üzüm
Yarım çay kaşığı tarçın`,
    instructions: `1. Yumurta ve pekmezi çırpın, yağ ve sütü ekleyin.
2. Tarçın, kabartma tozu ve vanilyayı katın; unu azar azar ekleyin (hamur katılaşırsa daha az kullanın).
3. Elma, ceviz ve üzümü ekleyip yağlanmış kalıba dökün.
4. 160 °C'de pişirin; 30. dakikada kürdanla kontrol edin.` + src('diyet-elmali-kek') },

  { title: 'Fit mısır unlu pankek', category: 'Kahvaltılık', minutes: 25, servings: 2,
    ingredients: `1 orta boy yumurta
Yarım su bardağı süt
Yaklaşık 1 su bardağı mısır unu (iki parmak eksik)
1 çay kaşığı zeytinyağı
1 çay kaşığı kabartma tozu
Maydanoz, tuz
Peynir (isteğe bağlı)`,
    instructions: `1. Yumurtayı çırpın, süt ve zeytinyağını ekleyip karıştırın.
2. Mısır unu, kabartma tozu, maydanoz, peynir ve tuzu ilave edin.
3. Az yağlanmış tavada orta ateşte kaşık kaşık dökerek iki yüzü kızarana kadar pişirin.` + src('fit-pankek-7747242') },

  { title: 'Patatesli tavuk baget', category: 'Ana yemek', minutes: 40, servings: 4,
    ingredients: `8-10 tavuk baget
8-10 orta boy patates
1 çay kaşığı domates salçası
Yarım su bardağı su
Yenibahar, kimyon, kekik, karabiber, toz ve pul biber`,
    instructions: `1. Patatesleri soyup ikiye bölün.
2. Bagetleri tencereye dizip baharatlarla iyice harmanlayın, patatesleri üzerlerine yerleştirin.
3. Salçayı suda eritip üzerine gezdirin.
4. Kapağı kapalı, kısık ateşte yaklaşık 35 dakika pişirin.` + src('patatesli-tavuk-baget-tarifi') },
];
