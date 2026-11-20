import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { api, fileForm } from '../api';
import { Button, Card, Chips, ErrorText, Field, H1, H2, Muted, Row, Screen, T } from '../components/ui';
import { showBadges } from '../components/badges';
import { colors, MEAL_LABEL } from '../theme';
import { guessMeal } from './ScanResultScreen';

const SOURCE_ICON = { manual: '✍️', photo: '📸', barcode: '🔎', plan: '📋' };

export default function MealsScreen({ navigation }) {
  const [meals, setMeals] = useState([]);
  const [quota, setQuota] = useState(null);
  const [form, setForm] = useState(null); // düzenlenecek / eklenecek öğün
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, q] = await Promise.all([api('/meals'), api('/meals/photo/quota')]);
      setMeals(m); setQuota(q);
    } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const takePhoto = async (fromCamera) => {
    setError('');
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : { granted: true };
    if (!perm.granted) return setError('Kamera izni gerekli.');
    const opts = { mediaTypes: ['images'], quality: 0.6 };
    const r = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled) return;
    setBusy(true);
    try {
      const res = await api('/meals/photo', { method: 'POST', form: fileForm('photo', r.assets[0], 'image/jpeg') });
      setQuota(res.quota);
      setForm({ name: res.name || 'Öğün', kcal: String(res.kcal ?? ''), protein_g: String(res.protein_g ?? ''), carbs_g: String(res.carbs_g ?? ''), fat_g: String(res.fat_g ?? ''),
        meal_type: guessMeal(), source: 'photo', items: res.items || [] });
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true); setError('');
    try {
      const num = (v) => Number(String(v).replace(',', '.')) || 0;
      const r = await api('/meals', { method: 'POST', body: { ...form, kcal: num(form.kcal), protein_g: num(form.protein_g), carbs_g: num(form.carbs_g), fat_g: num(form.fat_g) } });
      showBadges(r.newBadges);
      setForm(null); load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const remove = (m) => Alert.alert('Silinsin mi?', m.name, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: async () => { await api(`/meals/${m.id}`, { method: 'DELETE' }); load(); } },
  ]);

  const total = meals.reduce((s, m) => s + m.kcal, 0);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Screen>
      <H1>Öğünlerim</H1>
      <Muted style={{ marginBottom: 12 }}>Bugün toplam {total} kcal</Muted>
      <ErrorText>{error}</ErrorText>

      {!form && (
        <Card>
          <H2>Öğün ekle</H2>
          <Button title="Tabağın fotoğrafını çek" icon="📸" onPress={() => takePhoto(true)} loading={busy} />
          <Button variant="secondary" title="Galeriden fotoğraf seç" icon="🖼️" onPress={() => takePhoto(false)} disabled={busy} />
          {quota && quota.limit !== null && <Muted style={{ textAlign: 'center' }}>Bugün {quota.remaining}/{quota.limit} ücretsiz fotoğraf analiziniz kaldı</Muted>}
          <Row style={{ marginTop: 6 }}>
            <Button style={{ flex: 1 }} variant="secondary" title="Barkod" icon="🔎" onPress={() => navigation.navigate('Scan')} />
            <Button style={{ flex: 1 }} variant="secondary" title="Elle yaz" icon="✍️" onPress={() => setForm({ name: '', kcal: '', protein_g: '', carbs_g: '', fat_g: '', meal_type: guessMeal(), source: 'manual' })} />
          </Row>
        </Card>
      )}

      {form && (
        <Card>
          <H2>{form.source === 'photo' ? '📸 Fotoğraf sonucu (tahmini)' : '✍️ Öğün bilgisi'}</H2>
          {form.source === 'photo' && (
            <View style={{ backgroundColor: colors.warnSoft, padding: 10, borderRadius: 10, marginBottom: 10 }}>
              <T size={15}>Bu değerler yapay zekâ tahminidir. Kaydetmeden önce düzeltebilirsiniz.</T>
              {form.items.map((it, i) => <Muted key={i}>• {it.name} ~{it.grams} g, {it.kcal} kcal</Muted>)}
            </View>
          )}
          <Field label="Ne yediniz?" value={form.name} onChangeText={set('name')} />
          <Field label="Kalori (kcal)" keyboardType="number-pad" value={form.kcal} onChangeText={set('kcal')} />
          <Row>
            <Field style={{ flex: 1 }} label="Protein" keyboardType="decimal-pad" value={form.protein_g} onChangeText={set('protein_g')} />
            <Field style={{ flex: 1 }} label="Karb." keyboardType="decimal-pad" value={form.carbs_g} onChangeText={set('carbs_g')} />
            <Field style={{ flex: 1 }} label="Yağ" keyboardType="decimal-pad" value={form.fat_g} onChangeText={set('fat_g')} />
          </Row>
          <Chips options={Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))} value={form.meal_type} onChange={set('meal_type')} />
          <Button title="Kaydet" icon="✅" onPress={save} loading={busy} disabled={!form.name || form.kcal === ''} />
          <Button variant="ghost" title="Vazgeç" onPress={() => setForm(null)} />
        </Card>
      )}

      {Object.entries(MEAL_LABEL).map(([type, label]) => {
        const list = meals.filter((m) => m.meal_type === type);
        if (!list.length) return null;
        return (
          <View key={type}>
            <H2>{label}</H2>
            {list.map((m) => (
              <Pressable key={m.id} onLongPress={() => remove(m)} accessibilityHint="Silmek için basılı tutun">
                <Card style={{ paddingVertical: 14 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T size={17} weight="600" style={{ flex: 1 }}>{SOURCE_ICON[m.source]} {m.name}</T>
                    <T size={17} weight="800">{m.kcal} kcal{m.is_estimate ? '*' : ''}</T>
                  </Row>
                  <Muted>{m.grams ? `${m.grams} g · ` : ''}P {m.protein_g} · K {m.carbs_g} · Y {m.fat_g}</Muted>
                </Card>
              </Pressable>
            ))}
          </View>
        );
      })}
      {meals.length > 0 && <Muted>* tahmini değer · Silmek için öğüne basılı tutun</Muted>}
      {meals.length === 0 && !form && <Muted style={{ textAlign: 'center' }}>Bugün henüz öğün eklemediniz.</Muted>}
    </Screen>
  );
}
