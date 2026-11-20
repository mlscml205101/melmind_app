// Büyük butonlu, sade ortak bileşenler (60+ kullanıcılar için — Rapor Obj 6)
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, useFont } from '../theme';

export function Screen({ children, scroll = true, refreshing, onRefresh, edges = ['top'] }) {
  if (!scroll) return <SafeAreaView edges={edges} style={s.screen}>{children}</SafeAreaView>;
  return (
    <SafeAreaView edges={edges} style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function T({ size = 17, weight = '400', color = colors.text, style, children, ...p }) {
  const fs = useFont();
  return <Text style={[{ fontSize: fs(size), fontWeight: weight, color, lineHeight: fs(size) * 1.35 }, style]} {...p}>{children}</Text>;
}

export const H1 = (p) => <T size={28} weight="800" style={{ marginBottom: 6 }} {...p} />;
export const H2 = (p) => <T size={20} weight="700" style={{ marginBottom: 8 }} {...p} />;
export const Muted = (p) => <T size={15} color={colors.muted} {...p} />;

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, small }) {
  const fs = useFont();
  const v = {
    primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
    secondary: { bg: colors.card, fg: colors.primaryDark, border: colors.primary },
    water: { bg: colors.water, fg: '#fff', border: colors.water },
    danger: { bg: colors.card, fg: colors.danger, border: colors.danger },
    ghost: { bg: 'transparent', fg: colors.primaryDark, border: 'transparent' },
  }[variant];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [s.btn, small && s.btnSmall, { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <Text style={{ color: v.fg, fontSize: fs(small ? 16 : 19), fontWeight: '700', textAlign: 'center' }}>{icon ? `${icon}  ` : ''}{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style, onPress }) {
  const Comp = onPress ? Pressable : View;
  return <Comp onPress={onPress} style={[s.card, style]}>{children}</Comp>;
}

export function Field({ label, hint, style, ...p }) {
  const fs = useFont();
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label ? <T size={16} weight="600" style={{ marginBottom: 6 }}>{label}</T> : null}
      <TextInput placeholderTextColor="#8A978F" style={[s.input, { fontSize: fs(18) }]} {...p} />
      {hint ? <Muted style={{ marginTop: 4 }}>{hint}</Muted> : null}
    </View>
  );
}

export function Chips({ options, value, onChange, multi }) {
  const selected = multi ? value : [value];
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <Pressable key={o.value} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={{ checked: on }}
            onPress={() => onChange(multi ? (on ? value.filter((x) => x !== o.value) : [...value, o.value]) : o.value)}
            style={[s.chip, on && s.chipOn]}>
            <T size={16} weight={on ? '700' : '500'} color={on ? '#fff' : colors.text}>{on && multi ? '✓ ' : ''}{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Progress({ value, max, color = colors.primary, height = 14 }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={{ height, backgroundColor: colors.border, borderRadius: height, overflow: 'hidden' }}
      accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      <View style={{ width: `${pct * 100}%`, height, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <View style={s.err}><T size={16} color={colors.danger}>⚠️ {children}</T></View>;
}

export function Loading() {
  return <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
}

export const Row = ({ children, style, gap = 10 }) => <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingBottom: 40 },
  btn: { minHeight: 58, borderRadius: 16, borderWidth: 2, justifyContent: 'center', paddingHorizontal: 18, marginVertical: 6 },
  btnSmall: { minHeight: 46, borderRadius: 12 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 54, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 16, minHeight: 46, justifyContent: 'center', borderRadius: 24, borderWidth: 2, borderColor: colors.border, backgroundColor: '#fff' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  err: { backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12, marginVertical: 8 },
});
