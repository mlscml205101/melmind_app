// MelMind Plus: önce fiyat ekranı → fiyata basınca (demo, gerçek ödeme yok) Plus açılır → tarif defteri, koç, sınırsız fotoğraf
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Button, Card, ErrorText, H1, H2, Loading, Muted, Row, Screen, T } from '../components/ui';
import { colors } from '../theme';

// Fiyatları buradan değiştirin
const PLANS = [
  { id: 'monthly', title: 'Aylık', price: '₺99,99', per: '/ ay', note: 'İstediğin zaman iptal' },
  { id: 'yearly', title: 'Yıllık', price: '₺799,99', per: '/ yıl', note: 'Aylık ₺66,66 — %33 tasarruf', best: true },
];
const FEATURES = [
  '📸 Sınırsız tabak fotoğrafı analizi',
  '💬 Yapay zekâ beslenme koçu',
  '📖 MelMind tarif defteri',
];

export function PlusScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const setPlus = async (active, plan = '') => {
    setBusy(plan || 'off'); setError('');
    try { setUser(await api('/profile/plus', { method: 'POST', body: { active } })); }
    catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  if (user.is_plus) {
    return (
      <Screen edges={[]}>
        <H1>⭐ MelMind Plus</H1>
        <Muted style={{ marginBottom: 12 }}>Plus üyeliğiniz aktif. Teşekkürler!</Muted>
        <Button title="Tarif defteri" icon="📖" onPress={() => navigation.navigate('PlusRecipes')} />
        <Button variant="secondary" title="Beslenme koçuna sor" icon="💬" onPress={() => navigation.navigate('Coach')} />
        <Muted style={{ marginTop: 10 }}>Tabak fotoğrafı analizi artık sınırsız.</Muted>
        <Button variant="ghost" title="Üyeliği iptal et" onPress={() => Alert.alert('Üyelik iptal edilsin mi?', '', [
          { text: 'Vazgeç', style: 'cancel' }, { text: 'İptal et', style: 'destructive', onPress: () => setPlus(false) },
        ])} loading={busy === 'off'} />
        <ErrorText>{error}</ErrorText>
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <H1>⭐ MelMind Plus</H1>
      <Muted style={{ marginBottom: 12 }}>Planını seç, hemen kullanmaya başla.</Muted>
      <Card>
        {FEATURES.map((f) => <T key={f} size={17} style={{ marginBottom: 8 }}>{f}</T>)}
      </Card>
      {PLANS.map((p) => (
        <Card key={p.id} style={{ borderWidth: 2, borderColor: p.best ? colors.primary : colors.border }}>
          {p.best && <T size={13} weight="800" color={colors.primary} style={{ marginBottom: 4 }}>EN AVANTAJLI</T>}
          <Row style={{ justifyContent: 'space-between' }}>
            <View><T size={19} weight="700">{p.title}</T><Muted>{p.note}</Muted></View>
            <View style={{ alignItems: 'flex-end' }}><T size={24} weight="800">{p.price}</T><Muted>{p.per}</Muted></View>
          </Row>
          <Button title={`${p.price} ${p.per} — Abone ol`} loading={busy === p.id} disabled={!!busy} onPress={() => setPlus(true, p.id)} />
        </Card>
      ))}
      <ErrorText>{error}</ErrorText>
      <Muted style={{ textAlign: 'center' }}>Prototip sürümdür: gerçek ödeme alınmaz.</Muted>
    </Screen>
  );
}

export function PlusRecipesScreen({ navigation }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { api('/plus-recipes').then(setRows).catch((e) => { setError(e.message); setRows([]); }); }, []));
  if (!rows) return <Screen edges={[]}><Loading /></Screen>;
  const cats = [...new Set(rows.map((r) => r.category))];
  return (
    <Screen edges={[]}>
      <H1>📖 Tarif defteri</H1>
      <ErrorText>{error}</ErrorText>
      {!error && rows.length === 0 && <Muted>Henüz tarif eklenmedi.</Muted>}
      {cats.map((c) => (
        <View key={c}>
          <H2>{c}</H2>
          {rows.filter((r) => r.category === c).map((r) => (
            <Card key={r.id} onPress={() => navigation.navigate('PlusRecipe', { id: r.id, title: r.title })}>
              <T size={18} weight="700">{r.title}</T>
              <Muted>{[r.minutes && `${r.minutes} dk`, r.servings && `${r.servings} kişilik`, r.kcal && `${r.kcal} kcal`].filter(Boolean).join(' · ')}</Muted>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}

export function PlusRecipeScreen({ route }) {
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { api(`/plus-recipes/${route.params.id}`).then(setR).catch((e) => setError(e.message)); }, [route.params.id]));
  if (!r) return <Screen edges={[]}>{error ? <ErrorText>{error}</ErrorText> : <Loading />}</Screen>;
  return (
    <Screen edges={[]}>
      <H1>{r.title}</H1>
      <Muted style={{ marginBottom: 12 }}>{[r.minutes && `${r.minutes} dk`, r.servings && `${r.servings} kişilik`, r.kcal && `${r.kcal} kcal`].filter(Boolean).join(' · ')}</Muted>
      <Card><H2>Malzemeler</H2><T size={17}>{r.ingredients}</T></Card>
      <Card><H2>Yapılışı</H2><T size={17}>{r.instructions}</T></Card>
    </Screen>
  );
}
