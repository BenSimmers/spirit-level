import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AGE_VERIFIED_KEY, AgeGate } from './src/components/AgeGate';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { CompassScreen } from './src/screens/CompassScreen';

const Tab = createBottomTabNavigator();

const NAV_THEME: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#100a02',
    card: '#1c1005',
    text: '#f0dca4',
    border: '#c8960c33',
    primary: '#c8960c',
  },
};

export default function App() {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AGE_VERIFIED_KEY).then((v) => setAgeVerified(v === 'true'));
  }, []);

  if (ageVerified === null) {
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
            tabBarActiveTintColor: '#c8960c',
            tabBarInactiveTintColor: '#a08050',
            tabBarLabelStyle: styles.tabBarLabel,
          }}
        >
          <Tab.Screen
            name="Compass"
            component={CompassScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>◈</Text> }}
          />
          <Tab.Screen
            name="Browse"
            component={BrowseScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>☰</Text> }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: '#100a02',
  },
  tabBar: {
    backgroundColor: '#1c1005',
    borderTopColor: '#c8960c33',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabIcon: {
    fontSize: 18,
  },
});
