// Telefonun adımsayarı (expo-sensors Pedometer) → sunucuya günlük toplam.
// iOS: bugünün toplamı doğrudan okunur. Android: uygulama açıkken sayılan adımlar günlük olarak biriktirilir.
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const today = () => new Date().toISOString().slice(0, 10);
let sub = null;

export async function startStepWatcher() {
  try {
    if (!(await Pedometer.isAvailableAsync())) return false;
    const perm = await Pedometer.requestPermissionsAsync();
    if (!perm.granted) return false;
    if (Platform.OS === 'android' && !sub) {
      let last = 0;
      sub = Pedometer.watchStepCount(async ({ steps }) => {
        const delta = steps - last;
        last = steps;
        if (delta <= 0) return;
        const key = `steps:${today()}`;
        const cur = Number(await AsyncStorage.getItem(key)) || 0;
        await AsyncStorage.setItem(key, String(cur + delta));
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function syncSteps() {
  let steps = null;
  if (Platform.OS === 'ios') {
    if (!(await Pedometer.isAvailableAsync())) return null;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    steps = (await Pedometer.getStepCountAsync(start, new Date())).steps;
  } else {
    const v = await AsyncStorage.getItem(`steps:${today()}`);
    steps = v == null ? null : Number(v);
  }
  if (steps == null) return null;
  await api('/steps', { method: 'POST', body: { steps } });
  return steps;
}
