// Kan tahlili: PDF'ten yapay zekâ ile okuma (kullanıcı onaylar) veya elle giriş; kilo takibi
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import { api, fileForm } from '../api';
import { useAuth } from '../AuthContext';
import { Button, Card, ErrorText, Field, H1, H2, Muted, Row, Screen, T } from '../components/ui';
import { showBadges } from '../components/badges';
import { colors } from '../theme';

const MARKERS = [
  ['glucose', 'Açlık kan şekeri', 'mg/dL'], ['hba1c', 'HbA1c', '%'], ['total_cholesterol', 'Total kolesterol', 'mg/dL'],
  ['ldl', 'LDL', 'mg/dL'], ['hdl', 'HDL', 'mg/dL'], ['triglycerides', 'Trigliserit', 'mg/dL'],
];
const emptyForm = () => ({ test_date: new Date().toISOString().slice(0, 10), values: {}, source: 'manual' });

export default function HealthScreen() {
  const { user, refreshUser } = useAuth();
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(null);
  const [issues, setIssues] = useState([]);
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setTests(await api('/blood')); } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickPdf = async () => {
    setError('');
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (r.canceled) return;
    setBusy(true);
    try {
      const res = await api('/blood/parse-pdf', { method: 'POST', form: fileForm('file', r.assets[0], 'application/pdf') });
      setForm({ test_date: res.test_date || emptyForm().test_date, source: 'pdf_ai', values: Object.fromEntries(Object.entries(res.values).map(([k, v]) => [k, String(v)])) });
      setIssues(res.issues || []);
    } catch (e) {
      setError(e.status === 501 ? 'PDF okuma şu an kapalı. Değerleri aşağıdan elle girebilirsiniz.' : e.message);
      if (e.status === 501) setForm(emptyForm());
    } finally { setBusy(false); }
  };

  const save = async (confirmed = false) => {
    setBusy(true); setError('');
    try {
      const r = await api('/blood', { method: 'POST', body: { ...form, confirmed } });
      setForm(null); setIssues([]); load();
      if (r.alerts.length) Alert.alert('🩺 Doktorunuza danışın', r.alerts.map((a) => a.message).join('\n\n'));
      else Alert.alert('Kaydedildi', 'Değerleriniz kaydedildi ve diyet planınız güncellendi.');
      showBadges(r.newBadges);
    } catch (e) {
      if (e.body?.needsConfirmation) {
        Alert.alert('Değerleri kontrol edin', e.body.issues.map((i) => i.message).join('\n'), [
          { text: 'Düzelt', style: 'cancel' }, { text: 'Doğru, kaydet', onPress: () => save(true) },
        ]);
      } else setError(e.message);
    } finally { setBusy(false); }
  };

  const saveWeight = async () => {
    try {
      await api('/profile/weight', { method: 'POST', body: { weight_kg: Number(weight.replace(',', '.')) } });
      setWeight(''); await refreshUser();
      Alert.alert('Kaydedildi', 'Kilonuz güncellendi, planınız yeniden düzenlendi.');
    } catch (e) { Alert.alert('Hata', e.message); }
  };

  const setVal = (k) => (v) => setForm((f) => ({ ...f, values: { ...f.values, [k]: v } }));

  return (
    <Screen>
      <H1>Sağlık</H1>
      <ErrorText>{error}</ErrorText>

      <Card>
        <H2>⚖️ Kilo</H2>
        <Muted>Şu anki kilonuz: {user?.weight_kg} kg</Muted>
        <Row>
          <Field style={{ flex: 1, marginBottom: 0 }} placeholder="Yeni kilo (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
          <Button small title="Kaydet" onPress={saveWeight} disabled={!weight} />
        </Row>
      </Card>

      {!form ? (
        <Card>
          <H2>🩸 Kan tahlili ekle</H2>
          <Button title="PDF raporu yükle" icon="📄" onPress={pickPdf} loading={busy} />
          <Button variant="secondary" title="Değerleri elle gir" icon="✍️" onPress={() => setForm(emptyForm())} />
          <Muted>PDF dosyanız okunduktan sonra saklanmaz. Okunan her değeri siz onaylarsınız.</Muted>
        </Card>
      ) : (
        <Card>
          <H2>{form.source === 'pdf_ai' ? 'Okunan değerleri kontrol edin' : 'Değerleri girin'}</H2>
          {form.source === 'pdf_ai' && <View style={{ backgroundColor: colors.warnSoft, padding: 10, borderRadius: 10, marginBottom: 10 }}><T size={15}>Lütfen her değeri raporunuzla karşılaştırın, yanlışsa düzeltin.</T></View>}
          {issues.map((i) => <ErrorText key={i.marker}>{i.message}</ErrorText>)}
          <Field label="Tahlil tarihi (YYYY-AA-GG)" value={form.test_date} onChangeText={(v) => setForm((f) => ({ ...f, test_date: v }))} />
          {MARKERS.map(([k, label, unit]) => (
            <Field key={k} label={`${label} (${unit})`} keyboardType="decimal-pad" value={form.values[k] || ''} onChangeText={setVal(k)} placeholder="Boş bırakabilirsiniz" />
          ))}
          <Button title="Onayla ve kaydet" icon="✅" onPress={() => save(false)} loading={busy} />
          <Button variant="ghost" title="Vazgeç" onPress={() => { setForm(null); setIssues([]); }} />
        </Card>
      )}

      <H2>Geçmiş tahliller</H2>
      {tests.length === 0 && <Muted>Henüz tahlil eklemediniz.</Muted>}
      {tests.map((t) => (
        <Card key={t.id}>
          <T size={17} weight="700">{t.test_date} {t.source === 'pdf_ai' ? '· PDF' : ''}</T>
          {MARKERS.filter(([k]) => t.values[k] != null).map(([k, label, unit]) => (
            <Row key={k} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
              <T size={16}>{label}</T><T size={16} weight="700">{t.values[k]} {unit}</T>
            </Row>
          ))}
        </Card>
      ))}
      <Muted>MelMind teşhis koymaz ve ilaç önermez. Değerleriniz kötüleştiğinde sizi doktorunuza yönlendirir.</Muted>
    </Screen>
  );
}
