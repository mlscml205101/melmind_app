// Okutulan ürünün kullanıcının diyetine uygunluk sonucu + günlüğe ekleme + bulunamayan ürünü elle ekleme
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Switch, View } from 'react-native';
import { api } from '../api';
import { Button, Card, Chips, ErrorText, Field, H1, H2, Loading, Muted, Row, Screen, T } from '../components/ui';
import { colors, MEAL_LABEL, SEVERITY, VERDICT } from '../theme';
import { showBadges } from '../components/badges';

export default function ScanResultScreen({ route, navigation }) {
  const { barcode } = route.params;
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError(''); setNotFound(null);
    try {
      const r = await api(`/barcode/${barcode}`);
      setData(r);
      showBadges(r.newBadges);
    } catch (e) {
      if (e.status === 404 && e.body?.notFound) setNotFound(e.body);
      else setError(e.message);
    }
  }, [barcode]);

  useEffect(() => { load(); }, [load]);

  if (error) return <Screen edges={[]}><ErrorText>{error}</ErrorText><Button title="Tekrar dene" onPress={load} /></Screen>;
  if (notFound) return <AddProduct barcode={barcode} info={notFound} onDone={(r) => { setNotFound(null); setData(r); showBadges(r.newBadges); }} />;
  if (!data) return <Screen edges={[]}><Loading /><Muted style={{ textAlign: 'center' }}>Ürün ve diyet uyumu kontrol ediliyor…</Muted></Screen>;

  const { product, evaluation: ev } = data;
  const v = VERDICT[ev.verdict];
  return (
    <Screen edges={[]}>
      <View accessible accessibilityLabel={`${product.name}: ${ev.title}`} style={{ backgroundColor: v.bg, borderColor: v.color, borderWidth: 3, borderRadius: 22, padding: 20, marginBottom: 16 }}>
        <T size={44} style={{ textAlign: 'center' }}>{v.icon}</T>
        <T size={26} weight="800" color={v.color} style={{ textAlign: 'center' }}>{ev.title}</T>
        <T size={18} weight="600" style={{ textAlign: 'center', marginTop: 8 }}>{product.name}</T>
        {product.brand ? <Muted style={{ textAlign: 'center' }}>{product.brand} · {product.barcode}</Muted> : <Muted style={{ textAlign: 'center' }}>{product.barcode}</Muted>}
        {product.image_url ? <Image source={{ uri: product.image_url }} style={{ width: 110, height: 110, alignSelf: 'center', marginTop: 10, borderRadius: 12 }} resizeMode="contain" /> : null}
      </View>

      <H2>Neden?</H2>
      {ev.reasons.map((r, i) => {
        const sv = SEVERITY[r.severity];
        return (
          <View key={i} style={{ backgroundColor: sv.bg, borderLeftWidth: 6, borderLeftColor: sv.color, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <T size={17} weight="700" color={sv.color}>{sv.icon} {r.title}</T>
            <T size={16} style={{ marginTop: 4 }}>{r.detail}</T>
          </View>
        );
      })}

      <NutritionTable n={ev.nutrition} />
      <AddToLog product={product} verdict={ev.verdict} navigation={navigation} />

      <Muted style={{ marginTop: 10 }}>{ev.disclaimer}</Muted>
      <Muted>Kaynak: {product.source === 'off' ? 'Open Food Facts' : product.source === 'user' ? 'Sizin eklediğiniz bilgiler' : 'MelMind demo ürünü'}</Muted>
      <Button variant="secondary" title="Başka ürün okut" icon="🔎" onPress={() => navigation.goBack()} style={{ marginTop: 14 }} />
    </Screen>
  );
}

const LEVEL = { high: ['Yüksek', colors.danger], medium: ['Orta', colors.warn], low: ['Düşük', colors.ok] };

function NutritionTable({ n }) {
  const rows = [
    ['Enerji', n.kcal, 'kcal'], ['Şeker', n.sugar, 'g', n.levels.sugar], ['Yağ', n.fat, 'g', n.levels.fat],
    ['Doymuş yağ', n.sat_fat, 'g', n.levels.sat_fat], ['Tuz', n.salt, 'g', n.levels.salt], ['Karbonhidrat', n.carbs, 'g'], ['Protein', n.protein, 'g'],
  ];
  return (
    <Card>
      <H2>Besin değerleri ({n.per})</H2>
      {rows.map(([label, val, unit, lv]) => (
        <Row key={label} style={{ justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <T size={17}>{label}</T>
          <Row gap={8}>
            <T size={17} weight="700">{val == null ? '—' : `${val} ${unit}`}</T>
            {lv ? <T size={14} weight="700" color={LEVEL[lv][1]} style={{ minWidth: 48, textAlign: 'right' }}>{LEVEL[lv][0]}</T> : <View style={{ minWidth: 48 }} />}
          </Row>
        </Row>
      ))}
    </Card>
  );
}

function AddToLog({ product, verdict, navigation }) {
  const [grams, setGrams] = useState(String(product.serving_g || (product.is_beverage ? 200 : 100)));
  const [mealType, setMealType] = useState(guessMeal());
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const doSave = async () => {
      setBusy(true);
      try {
        const r = await api('/meals', { method: 'POST', body: { barcode: product.barcode, grams: Number(grams.replace(',', '.')), meal_type: mealType } });
        showBadges(r.newBadges);
        Alert.alert('Kaydedildi', `${r.meal.name} (${r.meal.kcal} kcal) günlüğünüze eklendi.`);
        navigation.navigate('Tabs', { screen: 'Meals' });
      } catch (e) { Alert.alert('Hata', e.message); } finally { setBusy(false); }
    };
    if (verdict === 'unsuitable') {
      Alert.alert('Emin misiniz?', 'Bu ürün diyetinize uygun görünmüyor. Yine de günlüğe eklensin mi?', [
        { text: 'Vazgeç', style: 'cancel' }, { text: 'Yine de ekle', style: 'destructive', onPress: doSave },
      ]);
    } else doSave();
  };

  return (
    <Card>
      <H2>Yediniz mi? Günlüğe ekleyin</H2>
      <Field label={product.is_beverage ? 'Miktar (ml)' : 'Miktar (gram)'} keyboardType="decimal-pad" value={grams} onChangeText={setGrams} />
      <Chips options={Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))} value={mealType} onChange={setMealType} />
      {product.kcal_100g != null && <Muted>≈ {Math.round((product.kcal_100g * Number(grams.replace(',', '.') || 0)) / 100)} kcal</Muted>}
      <Button title="Günlüğe ekle" icon="➕" onPress={save} loading={busy} />
    </Card>
  );
}

export function guessMeal() {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
}

function AddProduct({ barcode, info, onDone }) {
  const [opts, setOpts] = useState([]);
  const [f, setF] = useState({ name: '', brand: '', ingredients_text: '', allergens: [], kcal_100g: '', sugar_100g: '', carbs_100g: '', fat_100g: '', sat_fat_100g: '', salt_100g: '', protein_100g: '', is_beverage: false, gluten_free: false, lactose_free: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api('/profile/options').then((o) => setOpts(o.allergens.filter((a) => a.code !== 'lactose'))).catch(() => {}); }, []);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const body = { ...f, barcode };
      for (const k of ['kcal_100g', 'sugar_100g', 'carbs_100g', 'fat_100g', 'sat_fat_100g', 'salt_100g', 'protein_100g']) body[k] = f[k] === '' ? null : Number(f[k].replace(',', '.'));
      // süt içeren ürün laktoz intoleransını da etkiler
      onDone(await api('/barcode/products', { method: 'POST', body }));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Screen edges={[]}>
      <H1>Ürün bulunamadı</H1>
      <Muted style={{ marginBottom: 12 }}>{info.error} Barkod: {barcode}</Muted>
      <Card>
        <T size={16} style={{ marginBottom: 12 }}>Ambalajdaki bilgileri girin; ürünü diyetinize göre hemen kontrol edelim.</T>
        <Field label="Ürün adı *" value={f.name} onChangeText={set('name')} />
        <Field label="Marka" value={f.brand} onChangeText={set('brand')} />
        <Field label="İçindekiler" value={f.ingredients_text} onChangeText={set('ingredients_text')} multiline style={{ marginBottom: 14 }} />
        <T size={16} weight="600" style={{ marginBottom: 6 }}>Alerjenler (ambalajda kalın yazılanlar)</T>
        <Chips multi options={opts.map((a) => ({ value: a.code, label: a.code === 'milk' ? 'Süt / laktoz' : a.label }))} value={f.allergens} onChange={set('allergens')} />
        <Toggle label="İçecek mi?" value={f.is_beverage} onChange={set('is_beverage')} />
        <Toggle label='"Glutensiz" etiketi var' value={f.gluten_free} onChange={set('gluten_free')} />
        <Toggle label='"Laktozsuz" etiketi var' value={f.lactose_free} onChange={set('lactose_free')} />
        <H2>{f.is_beverage ? '100 ml' : '100 g'} başına</H2>
        {[['kcal_100g', 'Enerji (kcal)'], ['sugar_100g', 'Şeker (g)'], ['carbs_100g', 'Karbonhidrat (g)'], ['fat_100g', 'Yağ (g)'], ['sat_fat_100g', 'Doymuş yağ (g)'], ['salt_100g', 'Tuz (g)'], ['protein_100g', 'Protein (g)']].map(([k, l]) => (
          <Field key={k} label={l} keyboardType="decimal-pad" value={f[k]} onChangeText={set(k)} />
        ))}
        <ErrorText>{error}</ErrorText>
        <Button title="Kaydet ve kontrol et" icon="✅" onPress={submit} loading={busy} disabled={f.name.trim().length < 2} />
      </Card>
    </Screen>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
      <T size={17}>{label}</T>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </Row>
  );
}
