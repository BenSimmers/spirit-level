import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export const AGE_VERIFIED_KEY = 'age_verified_v1';

type Props = {
    onVerified: () => void;
}

export const AgeGate: React.FC<Props> = ({ onVerified }) => {
    const confirm = async () => {
        await AsyncStorage.setItem(AGE_VERIFIED_KEY, 'true');
        onVerified();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Compass</Text>
            <Text style={styles.subtitle}>Find the nearest liquor store</Text>

            <View style={styles.divider} />

            <Text style={styles.body}>
                This app locates nearby stores using your device&apos;s location and compass.
                No purchases are made through this app.
            </Text>
            <Text style={styles.body}>
                By continuing, you confirm you are of legal drinking age in your jurisdiction.
            </Text>

            <Pressable style={styles.confirmBtn} onPress={confirm}>
                <Text style={styles.confirmText}>I am of legal age — Enter</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 32,
        fontFamily: fonts.headline,
        color: colors.headline,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: fonts.body,
        color: colors.body,
        marginTop: 6,
    },
    divider: {
        width: 60,
        height: 2,
        backgroundColor: colors.border,
        marginVertical: 28,
    },
    body: {
        color: colors.body,
        fontFamily: fonts.body,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 14,
    },
    confirmBtn: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 28,
        paddingVertical: 14,
        marginTop: 24,
    },
    confirmText: {
        color: colors.background,
        fontFamily: fonts.labelBold,
        fontSize: 15,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
