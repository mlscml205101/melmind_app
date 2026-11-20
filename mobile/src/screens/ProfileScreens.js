import { useCallback, useEffect, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Button, Card, Chips, ErrorText, Field, H1, H2, Loading, Muted, Row, Screen, T } from '../components/ui';
import { colors, VERDICT } from '../theme';
import { ALLERGY_OPTIONS, CONDITION_OPTIONS } from './AuthScreens';
import { remindersEnabled, setupReminders } from '../reminders';

export function ProfileScreen({ navigation }) {
  const { user, setUser, logout } = useAuth();
  const [f, setF] = useState(() => ({ conditions: user.conditions, allergies: user.allergies, goal: user.goal, diet_type: user.diet_type, step_goal: String(user.step_goal) }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rem, setRem] = useState(true);
  useEffect(() => { remindersEnabled().then(setRem); }, []);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const update = async (body) => {
    setBusy(true); setError('');
    try { setUser(await api('/profile/me', { method: 'PUT', body })); return true; } catch (e) { setError(e.message); return false; } finally { setBusy(false); }
  };

  return (
    <Screen edges={[]}>
      <H1>{user.name}</H1>
      <Muted>{user.email} · {user.age} yaş · {user.height_cm} cm · {user.weight_kg} kg</Muted>
      <Muted style={{ marginBottom: 12 }}>Günlük hedef: {user.targetKcal} kcal · Su: {(user.water_goal_ml / 1000).toFixed(1)} L</Muted>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}><T size={18} weight="700">🔠 Büyük yazı</T><Muted>Yazıları büyütür, okumayı kolaylaştırır</Muted></View>
          <Switch value={user.large_text} onValueChange={(v) => update({ large_text: v })} trackColor={{ true: colors.primary }} />
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 14 }}>
          <View style={{ flex: 1 }}><T size={18} weight="700">🔔 Hatırlatmalar</T><Muted>Öğün saatleri ve su</Muted></View>
          <Switch value={rem} onValueChange={async (v) => { setRem(v); const ok = await setupReminders(v); if (v && !ok) { setRem(false); Alert.alert('Bildirim izni verilmedi'); } }} trackColor={{ true: colors.primary }} />
        </Row>
      </Card>

      <Card>
        <H2>Sağlık profilim</H2>
        <T size={16} weight="600" style={{ marginBottom: 6 }}>Hastalıklar</T>
        <Chips multi options={CONDITION_OPTIONS} value={f.conditions} onChange={set('conditions')} />
        <T size={16} weight="600" style={{ marginBottom: 6 }}>Alerji / intolerans</T>
        <Chips multi options={ALLERGY_OPTIONS} value={f.allergies} onChange={set('allergies')} />
        <T size={16} weight="600" style={{ marginBottom: 6 }}>Hedef</T>
        <Chips options={[{ value: 'lose', label: 'Kilo vermek' }, { value: 'maintain', label: 'Korumak' }, { value: 'gain', label: 'Kilo almak' }]} value={f.goal} onChange={set('goal')} />
        <T size={16} weight="600" style={{ marginBottom: 6 }}>Beslenme</T>
        <Chips options={[{ value: 'none', label: 'Her şey' }, { value: 'vegetarian', label: 'Vejetaryen' }, { value: 'vegan', label: 'Vegan' }]} value={f.diet_type} onChange={set('diet_type')} />
        <Field label="Günlük adım hedefi" keyboardType="number-pad" value={f.step_goal} onChangeText={set('step_goal')} />
        <ErrorText>{error}</ErrorText>
        <Button title="Kaydet" loading={busy} onPress={async () => {
          const allergies = f.conditions.includes('celiac') && !f.allergies.includes('gluten') ? [...f.allergies, 'gluten'] : f.allergies;
          if (await update({ ...f, allergies, step_goal: Number(f.step_goal) || 7000 })) Alert.alert('Kaydedildi', 'Profiliniz ve diyet planınız güncellendi.');
        }} />
      </Card>

      <Card style={{ borderColor: '#E0C36A', backgroundColor: '#FFF9E6' }}>
        <H2>⭐ MelMind Plus</H2>
        <Muted style={{ marginBottom: 8 }}>Sınırsız tabak fotoğrafı analizi, yapay zekâ beslenme koçu ve tarif defteri.</Muted>
        <Button title={user.is_plus ? 'Plus ekranını aç' : 'MelMind Plus\'ı gör'} onPress={() => navigation.navigate('Plus')} />
      </Card>

      <Button variant="secondary" title="Rozetlerim" icon="🏅" onPress={() => navigation.navigate('Badges')} />
      <Button variant="secondary" title="Barkod geçmişim" icon="🕘" onPress={() => navigation.navigate('ScanHistory')} />
      <Button variant="danger" title="Çıkış yap" onPress={logout} />
    </Screen>
  );
}

export function BadgesScreen() {
  const [d, setD] = useState(null);
  useFocusEffect(useCallback(() => { api('/badges').then(setD).catch(() => {}); }, []));
  if (!d) return <Screen edges={[]}><Loading /></Screen>;
  return (
    <Screen edges={[]}>
      <H1>🔥 {d.streak} günlük seri</H1>
      <Row style={{ flexWrap: 'wrap' }} gap={12}>
        {d.badges.map((b) => (
          <View key={b.code} style={{ width: '47%', backgroundColor: b.earned_at ? colors.primarySoft : '#EEF0EE', borderRadius: 18, padding: 14, alignItems: 'center', opacity: b.earned_at ? 1 : 0.55 }}>
            <T size={40}>{b.earned_at ? b.icon : '🔒'}</T>
            <T size={16} weight="700" style={{ textAlign: 'center' }}>{b.title}</T>
            <Muted style={{ textAlign: 'center' }}>{b.desc}</Muted>
          </View>
        ))}
      </Row>
    </Screen>
  );
}

export function ScanHistoryScreen({ navigation }) {
  const [rows, setRows] = useState(null);
  useFocusEffect(useCallback(() => { api('/barcode').then(setRows).catch(() => setRows([])); }, []));
  if (!rows) return <Screen edges={[]}><Loading /></Screen>;
  return (
    <Screen edges={[]}>
      {rows.length === 0 && <Muted>Henüz barkod okutmadınız.</Muted>}
      {rows.map((r) => {
        const v = VERDICT[r.verdict];
        return (
          <Card key={r.id} onPress={() => navigation.navigate('ScanResult', { barcode: r.barcode })} style={{ borderLeftWidth: 6, borderLeftColor: v.color }}>
            <T size={17} weight="700">{v.icon} {r.name || r.barcode}</T>
            <Muted>{v.title} · {r.created_at.slice(0, 16)}</Muted>
          </Card>
        );
      })}
    </Screen>
  );
}

export function CoachScreen() {
  const [q, setQ] = useState('');
  const [chat, setChat] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ask = async () => {
    const question = q.trim();
    if (!question) return;
    setBusy(true); setError(''); setQ('');
    setChat((c) => [...c, { me: true, text: question }]);
    try {
      const r = await api('/coach', { method: 'POST', body: { question } });
      setChat((c) => [...c, { me: false, text: r.answer, blocked: r.blocked }]);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Screen edges={[]}>
      <Muted style={{ marginBottom: 10 }}>Beslenme sorularınızı Türkiye Beslenme Rehberi'ne dayanarak yanıtlar. Teşhis koymaz, ilaç önermez.</Muted>
      {chat.map((m, i) => (
        <View key={i} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: '88%', backgroundColor: m.me ? colors.primary : m.blocked ? colors.warnSoft : '#fff', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: m.me ? 0 : 1, borderColor: colors.border }}>
          <T size={16} color={m.me ? '#fff' : colors.text}>{m.text}</T>
        </View>
      ))}
      <ErrorText>{error}</ErrorText>
      <Field placeholder="Örn: Akşam atıştırmalığı olarak ne yiyebilirim?" value={q} onChangeText={setQ} multiline />
      <Button title="Sor" icon="💬" onPress={ask} loading={busy} disabled={!q.trim()} />
    </Screen>
  );
}
