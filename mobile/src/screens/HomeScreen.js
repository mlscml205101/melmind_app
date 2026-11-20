import { useCallback, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Button, Card, ErrorText, H1, H2, Loading, Muted, Progress, Row, Screen, T } from '../components/ui';
import { showBadges } from '../components/badges';
import { colors } from '../theme';
import { syncSteps } from '../steps';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await syncSteps().catch(() => {});
      setD(await api('/today')); setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const drink = async (ml) => {
    try {
      const r = await api('/water', { method: 'POST', body: { amount_ml: ml } });
      setD((x) => ({ ...x, water: { ...x.water, drank: r.drank, message: r.message } }));
      showBadges(r.newBadges);
    } catch (e) { Alert.alert('Hata', e.message); }
  };

  const markRead = async (id) => {
    await api(`/blood/alerts/${id}/read`, { method: 'POST' }).catch(() => {});
    setD((x) => ({ ...x, alerts: x.alerts.filter((a) => a.id !== id) }));
  };

  if (!d) return <Screen>{error ? <><ErrorText>{error}</ErrorText><Button title="Tekrar dene" onPress={load} /></> : <Loading />}</Screen>;
  const left = d.calories.target - d.calories.eaten;

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Muted>Merhaba,</Muted>
          <H1>{user?.name?.split(' ')[0]} 👋</H1>
        </View>
        <Pressable accessibilityLabel="Profil" onPress={() => navigation.navigate('Profile')} style={{ padding: 10 }}>
          <T size={30}>👤</T>
        </Pressable>
      </Row>

      {d.alerts.length > 0 && (
        <View style={{ backgroundColor: colors.dangerSoft, borderLeftWidth: 6, borderLeftColor: colors.danger, borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <T size={17} weight="700" color={colors.danger}>🩺 Doktorunuza danışın</T>
          <T size={16} style={{ marginVertical: 4 }}>{d.alerts[0].message}</T>
          {d.alerts.length > 1 && <Muted>+{d.alerts.length - 1} uyarı daha</Muted>}
          <Button small variant="danger" title="Okudum" onPress={() => markRead(d.alerts[0].id)} />
        </View>
      )}

      <Button title="Barkod okut" icon="📷" onPress={() => navigation.navigate('Scan')} style={{ minHeight: 70 }} />
      <Muted style={{ textAlign: 'center', marginBottom: 12 }}>Market ürününün diyetinize uygun olup olmadığını öğrenin</Muted>

      <Card>
        <H2>🍽️ Bugünkü kaloriler</H2>
        <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <T size={30} weight="800">{d.calories.eaten}<T size={17} color={colors.muted}> / {d.calories.target} kcal</T></T>
        </Row>
        <Progress value={d.calories.eaten} max={d.calories.target} color={left < 0 ? colors.warn : colors.primary} />
        <Muted style={{ marginTop: 8 }}>{left >= 0 ? `${left} kcal hakkınız kaldı` : `Hedefi ${-left} kcal aştınız`} · Protein {d.calories.protein} g · Karb. {d.calories.carbs} g · Yağ {d.calories.fat} g</Muted>
        <Button small variant="secondary" title="Öğün ekle" icon="➕" onPress={() => navigation.navigate('Meals')} />
      </Card>

      <Card style={{ backgroundColor: colors.waterSoft, borderColor: '#C5DCF2' }}>
        <H2>💧 Su</H2>
        <T size={17} style={{ marginBottom: 10 }}>{d.water.message}</T>
        <Progress value={d.water.drank} max={d.water.goal} color={colors.water} />
        <Row style={{ marginTop: 10 }}>
          <Button variant="water" title="+1 bardak" onPress={() => drink(200)} style={{ flex: 1 }} />
          <Button variant="water" title="+½ litre" onPress={() => drink(500)} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card>
        <H2>👟 Adımlar</H2>
        <T size={26} weight="800">{d.steps.count.toLocaleString('tr-TR')}<T size={16} color={colors.muted}> / {d.steps.goal.toLocaleString('tr-TR')}</T></T>
        <Progress value={d.steps.count} max={d.steps.goal} color={colors.primaryDark} />
      </Card>

      <Card onPress={() => navigation.navigate('Badges')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View><H2>🔥 {d.streak} günlük seri</H2><Muted>Her gün öğün kaydederek serinizi sürdürün</Muted></View>
          <T size={28}>›</T>
        </Row>
      </Card>

      {d.is_plus && <Button variant="secondary" title="Beslenme koçuna sor" icon="💬" onPress={() => navigation.navigate('Coach')} />}
    </Screen>
  );
}
