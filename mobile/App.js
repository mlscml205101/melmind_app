import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/AuthContext';
import { colors } from './src/theme';
import { Loading } from './src/components/ui';
import { LoginScreen, RegisterScreen } from './src/screens/AuthScreens';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ScanResultScreen from './src/screens/ScanResultScreen';
import MealsScreen from './src/screens/MealsScreen';
import PlanScreen from './src/screens/PlanScreen';
import HealthScreen from './src/screens/HealthScreen';
import { BadgesScreen, CoachScreen, ProfileScreen, ScanHistoryScreen } from './src/screens/ProfileScreens';
import { PlusRecipeScreen, PlusRecipesScreen, PlusScreen } from './src/screens/PlusScreens';
import { remindersEnabled, setupReminders } from './src/reminders';
import { startStepWatcher } from './src/steps';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } };

const icon = (emoji, label) => ({
  tabBarLabel: label,
  tabBarIcon: ({ focused }) => <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>,
});

function Tabs() {
  const { user } = useAuth();
  const big = user?.large_text;
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primaryDark,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: big ? 14 : 12, fontWeight: '700' },
      tabBarStyle: { height: big ? 92 : 84, paddingTop: 6 },
    }}>
      <Tab.Screen name="Home" component={HomeScreen} options={icon('🏠', 'Ana Sayfa')} />
      <Tab.Screen name="Meals" component={MealsScreen} options={icon('🍽️', 'Öğünler')} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{
        tabBarLabel: 'Barkod',
        tabBarIcon: () => (
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#fff' }}>
            <Text style={{ fontSize: 26 }}>📷</Text>
          </View>
        ),
      }} />
      <Tab.Screen name="Plan" component={PlanScreen} options={icon('📋', 'Planım')} />
      <Tab.Screen name="Health" component={HealthScreen} options={icon('🩸', 'Sağlık')} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;
    startStepWatcher();
    remindersEnabled().then((on) => on && setupReminders(true));
  }, [user?.id]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}><Loading /></View>;

  const header = { headerTitleStyle: { fontSize: 20, fontWeight: '700' }, headerTintColor: colors.primaryDark, headerBackTitle: 'Geri' };
  return (
    <Stack.Navigator screenOptions={header}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt ol' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ title: 'Diyet uyumu' }} />
          <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ title: 'Barkod geçmişi' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil ve ayarlar' }} />
          <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: 'Rozetler' }} />
          <Stack.Screen name="Coach" component={CoachScreen} options={{ title: 'Beslenme koçu' }} />
          <Stack.Screen name="Plus" component={PlusScreen} options={{ title: 'MelMind Plus' }} />
          <Stack.Screen name="PlusRecipes" component={PlusRecipesScreen} options={{ title: 'Tarif defteri' }} />
          <Stack.Screen name="PlusRecipe" component={PlusRecipeScreen} options={({ route }) => ({ title: route.params?.title || 'Tarif' })} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
