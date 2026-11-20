import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Button, Card, ErrorText, H1, H2, Loading, Muted, Row, Screen, T } from '../components/ui';
import { showBadges } from '../components/badges';
import { colors, DAY_LABEL, MEAL_LABEL } from '../theme';

const TAG_LABEL = { diabetes_friendly: 'Diyabete uygun', low_salt: 'Az tuzlu', low_sat_fat: 'Az doymuş yağ', vegetarian: 'Vejetaryen', vegan: 'Vegan' };

export default function PlanScreen() {
  const [plan, setPlan] = useState(null);
  const [day, setDay] = useState((new Date().getDay() + 6) % 7); // Pazartesi = 0
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setPlan(await api('/plan/current')); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const logMeal = async (m) => {
    try {
      const r = await api('/meals', { method: 'POST', body: { name: m.name, kcal: m.kcal_portion, protein_g: m.protein_portion, carbs_g: m.carbs_portion, fat_g: m.fat_portion, meal_type: m.meal_type, source: 'plan' } });
      showBadges(r.newBadges);
      Alert.alert('Kaydedildi', `${m.name} günlüğünüze eklendi.`);
    } catch (e) { Alert.alert('Hata', e.message); }
  };

  if (!plan) return <Screen>{error ? <ErrorText>{error}</ErrorText> : <Loading />}</Screen>;
  const d = plan.days[day];

  return (
    <Screen>
      <H1>Diyet Planım</H1>
      <Muted>Günlük hedef {plan.target_kcal} kcal · Son güncelleme: {plan.reason} ({plan.created_at.slice(0, 10)})</Muted>
      <Muted style={{ marginBottom: 10 }}>Plan kilonuz, profiliniz veya kan tahliliniz değiştiğinde kendiliğinden yenilenir. Alerjenleriniz plana asla girmez.</Muted>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentOffset={{ x: Math.max(0, day - 1) * 120, y: 0 }}>
        {DAY_LABEL.map((l, i) => (
          <Pressable key={l} onPress={() => setDay(i)} accessibilityRole="tab" accessibilityState={{ selected: i === day }}
            style={{ paddingHorizontal: 16, minHeight: 46, justifyContent: 'center', borderRadius: 24, marginRight: 8, backgroundColor: i === day ? colors.primary : '#fff', borderWidth: 2, borderColor: i === day ? colors.primary : colors.border }}>
            <T size={16} weight="700" color={i === day ? '#fff' : colors.text}>{l}</T>
          </Pressable>
        ))}
      </ScrollView>

      <Muted style={{ marginBottom: 8 }}>{DAY_LABEL[day]} toplam: {d.total_kcal} kcal</Muted>
      {d.meals.map((m) => {
        const key = `${day}-${m.meal_type}`;
        const expanded = open === key;
        return (
          <Card key={key} onPress={() => setOpen(expanded ? null : key)}>
            <Muted>{MEAL_LABEL[m.meal_type]}{m.portion !== 1 ? ` · ${m.portion} porsiyon` : ''}</Muted>
            <Row style={{ justifyContent: 'space-between' }}>
              <T size={18} weight="700" style={{ flex: 1 }}>{m.name}</T>
              <T size={17} weight="800" color={colors.primaryDark}>{m.kcal_portion} kcal</T>
            </Row>
            <Row style={{ flexWrap: 'wrap', marginTop: 6 }} gap={6}>
              {m.tags.map((t) => <View key={t} style={{ backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}><T size={13} color={colors.primaryDark}>{TAG_LABEL[t]}</T></View>)}
            </Row>
            {expanded && (
              <View style={{ marginTop: 10 }}>
                <H2>Malzemeler</H2><T size={16}>{m.ingredients}</T>
                <H2 style={{ marginTop: 10 }}>Hazırlanışı</H2><T size={16}>{m.instructions}</T>
                <Muted style={{ marginTop: 6 }}>Protein {m.protein_portion} g · Karbonhidrat {m.carbs_portion} g · Yağ {m.fat_portion} g</Muted>
                <Button small title="Bunu yedim" icon="✅" onPress={() => logMeal(m)} />
              </View>
            )}
          </Card>
        );
      })}
      <Button variant="secondary" title="Planı yenile" icon="🔄" onPress={async () => {
        try { await api('/plan/regenerate', { method: 'POST' }); await load(); Alert.alert('Plan yenilendi'); }
        catch (e) { Alert.alert('Plan yenilenemedi', e.message); }
      }} />
      <Muted>Tarifler MelMind ekibi tarafından hazırlanmıştır; değerler yaklaşıktır.</Muted>
    </Screen>
  );
}
