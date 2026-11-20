// Yerel bildirimler: öğün saatlerinde fotoğraf hatırlatması ve gün içinde su hatırlatması
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const MEALS = [[8, 30, 'Kahvaltı'], [13, 0, 'Öğle yemeği'], [19, 30, 'Akşam yemeği']];
const WATER_HOURS = [10, 12, 15, 17, 20];

export async function setupReminders(enabled = true) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('reminders', enabled ? '1' : '0');
    if (!enabled) return true;
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return false;
    for (const [hour, minute, label] of MEALS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: `${label} zamanı 🍽️`, body: 'Tabağınızın fotoğrafını çekin veya barkodunu okutun, MelMind kaydetsin.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }
    for (const hour of WATER_HOURS) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Bir bardak su zamanı 💧', body: 'Bugünkü su hedefinize ne kadar kaldığını görmek için dokunun.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function remindersEnabled() {
  return (await AsyncStorage.getItem('reminders')) !== '0';
}
