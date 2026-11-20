import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { api, API_URL } from '../api';
import { Button, Card, Chips, ErrorText, Field, H1, H2, Muted, Screen, T } from '../components/ui';
import { colors } from '../theme';

export function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try { await login(email, password); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ alignItems: 'center', marginVertical: 28 }}>
          <T size={56}>🥗</T>
          <T size={34} weight="800" color={colors.primaryDark}>MelMind</T>
          <Muted style={{ textAlign: 'center' }}>Sağlığınıza göre diyet, barkod kontrolü ve su takibi — ücretsiz.</Muted>
        </View>
        <Card>
          <Field label="E-posta" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
          <Field label="Şifre" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
          <ErrorText>{error}</ErrorText>
          <Button title="Giriş yap" onPress={submit} loading={busy} />
          <Button variant="secondary" title="Yeni hesap oluştur" onPress={() => navigation.navigate('Register')} />
        </Card>
        <Muted style={{ textAlign: 'center' }}>Deneme hesapları: diyabet@melmind.test, laktoz@melmind.test, colyak@melmind.test, kolesterol@melmind.test — şifre: demo1234</Muted>
        <Muted style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>Sunucu: {API_URL}</Muted>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const GOALS = [{ value: 'lose', label: 'Kilo vermek' }, { value: 'maintain', label: 'Kilomu korumak' }, { value: 'gain', label: 'Kilo almak' }];
const ACTIVITY = [{ value: 'low', label: 'Az hareketli' }, { value: 'medium', label: 'Orta' }, { value: 'high', label: 'Çok hareketli' }];
const DIET = [{ value: 'none', label: 'Her şeyi yerim' }, { value: 'vegetarian', label: 'Vejetaryen' }, { value: 'vegan', label: 'Vegan' }];
export const ALLERGY_OPTIONS = [
  { value: 'lactose', label: 'Laktoz intoleransı' }, { value: 'milk', label: 'Süt alerjisi' }, { value: 'gluten', label: 'Gluten' },
  { value: 'egg', label: 'Yumurta' }, { value: 'peanut', label: 'Yer fıstığı' }, { value: 'tree_nuts', label: 'Fındık/badem/ceviz' },
  { value: 'soy', label: 'Soya' }, { value: 'fish', label: 'Balık' }, { value: 'shellfish', label: 'Kabuklu deniz ürünü' }, { value: 'sesame', label: 'Susam' },
];
export const CONDITION_OPTIONS = [
  { value: 'diabetes', label: 'Tip 2 diyabet' }, { value: 'hypertension', label: 'Yüksek tansiyon' },
  { value: 'high_cholesterol', label: 'Yüksek kolesterol' }, { value: 'celiac', label: 'Çölyak' },
];

/** 3 adımlı, sade kayıt akışı */
export function RegisterScreen() {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: '', email: '', password: '', age: '', gender: 'female', height_cm: '', weight_kg: '', goal: 'maintain', activity: 'low', diet_type: 'none', conditions: [], allergies: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => setError(''), [step]);

  const step0ok = f.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(f.email) && f.password.length >= 6;
  const step1ok = Number(f.age) > 0 && Number(f.height_cm) > 0 && Number(f.weight_kg) > 0;

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const conditions = f.conditions;
      const allergies = conditions.includes('celiac') && !f.allergies.includes('gluten') ? [...f.allergies, 'gluten'] : f.allergies;
      await register({ ...f, conditions, allergies, age: Number(f.age), height_cm: Number(f.height_cm.replace(',', '.')), weight_kg: Number(f.weight_kg.replace(',', '.')) });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={[]}>
        <Muted>Adım {step + 1} / 3</Muted>
        {step === 0 && (
          <Card>
            <H2>Hesabınız</H2>
            <Field label="Adınız" value={f.name} onChangeText={set('name')} />
            <Field label="E-posta" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={set('email')} />
            <Field label="Şifre (en az 6 karakter)" secureTextEntry value={f.password} onChangeText={set('password')} />
            <Button title="Devam" onPress={() => setStep(1)} disabled={!step0ok} />
          </Card>
        )}
        {step === 1 && (
          <Card>
            <H2>Vücut bilgileriniz</H2>
            <Chips options={[{ value: 'female', label: 'Kadın' }, { value: 'male', label: 'Erkek' }]} value={f.gender} onChange={set('gender')} />
            <Field label="Yaş" keyboardType="number-pad" value={f.age} onChangeText={set('age')} />
            <Field label="Boy (cm)" keyboardType="decimal-pad" value={f.height_cm} onChangeText={set('height_cm')} />
            <Field label="Kilo (kg)" keyboardType="decimal-pad" value={f.weight_kg} onChangeText={set('weight_kg')} />
            <T size={16} weight="600" style={{ marginBottom: 6 }}>Hedefiniz</T>
            <Chips options={GOALS} value={f.goal} onChange={set('goal')} />
            <T size={16} weight="600" style={{ marginBottom: 6 }}>Günlük hareket</T>
            <Chips options={ACTIVITY} value={f.activity} onChange={set('activity')} />
            <Button title="Devam" onPress={() => setStep(2)} disabled={!step1ok} />
            <Button variant="ghost" title="Geri" onPress={() => setStep(0)} />
          </Card>
        )}
        {step === 2 && (
          <Card>
            <H2>Sağlık bilgileriniz</H2>
            <Muted style={{ marginBottom: 10 }}>Planınız ve barkod kontrolleriniz bu bilgilere göre yapılır. İstediğiniz zaman değiştirebilirsiniz.</Muted>
            <T size={16} weight="600" style={{ marginBottom: 6 }}>Doktor tanısı olan hastalıklar</T>
            <Chips multi options={CONDITION_OPTIONS} value={f.conditions} onChange={set('conditions')} />
            <T size={16} weight="600" style={{ marginBottom: 6 }}>Alerji / intolerans</T>
            <Chips multi options={ALLERGY_OPTIONS} value={f.allergies} onChange={set('allergies')} />
            <T size={16} weight="600" style={{ marginBottom: 6 }}>Beslenme tercihi</T>
            <Chips options={DIET} value={f.diet_type} onChange={set('diet_type')} />
            <Muted style={{ marginBottom: 8 }}>Kan tahlilinizi kayıttan sonra "Sağlık" sekmesinden ekleyebilirsiniz.</Muted>
            <ErrorText>{error}</ErrorText>
            <Button title="Hesabı oluştur" icon="✅" onPress={submit} loading={busy} />
            <Button variant="ghost" title="Geri" onPress={() => setStep(1)} />
          </Card>
        )}
        <Muted style={{ textAlign: 'center' }}>MelMind bir beslenme takip uygulamasıdır, tıbbi tavsiye vermez.</Muted>
      </Screen>
    </KeyboardAvoidingView>
  );
}

