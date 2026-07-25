import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as useHankenGrotesk,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AGE_VERIFIED_KEY, AgeGate } from './src/components/AgeGate';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { CompassScreen } from './src/screens/CompassScreen';
import { colors, fonts } from './src/theme';

const Tab = createBottomTabNavigator();

const NAV_THEME: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.headline,
    border: colors.border,
    primary: colors.primary,
  },
};

const DiamondTabIcon: React.FC<{ name: keyof typeof Ionicons.glyphMap; focused: boolean }> = ({ name, focused }) => (
  <View style={styles.diamondSlot}>
    <View style={[styles.diamondWrap, focused && styles.diamondWrapFocused]}>
      <View style={styles.diamondIconCounter}>
        <Ionicons name={name} size={16} color={focused ? colors.background : colors.muted} />
      </View>
    </View>
  </View>
);

export default function App() {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [hankenLoaded] = useHankenGrotesk({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });
  const [spaceLoaded] = useSpaceGrotesk({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  const fontsLoaded = hankenLoaded && spaceLoaded;

  useEffect(() => {
    AsyncStorage.getItem(AGE_VERIFIED_KEY).then((v) => setAgeVerified(v === 'true'));
  }, []);

  if (ageVerified === null || !fontsLoaded) {
    return <View style={styles.blank} />;
  }

  if (!ageVerified) {
    return (
      <SafeAreaProvider>
        <AgeGate onVerified={() => setAgeVerified(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={NAV_THEME}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: styles.tabBarLabel,
          }}
        >
          <Tab.Screen
            name="Compass"
            component={CompassScreen}
            options={{ tabBarIcon: ({ focused }) => <DiamondTabIcon name="compass" focused={focused} /> }}
          />
          <Tab.Screen
            name="Browse"
            component={BrowseScreen}
            options={{ tabBarIcon: ({ focused }) => <DiamondTabIcon name="menu" focused={focused} /> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    height: 68,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  diamondSlot: {
    width: 30,
    height: 30,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondWrap: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  diamondWrapFocused: {
    backgroundColor: colors.primary,
  },
  diamondIconCounter: {
    transform: [{ rotate: '-45deg' }],
  },
});
