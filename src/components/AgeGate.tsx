import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const AGE_VERIFIED_KEY = 'age_verified_v1';

type Props = {
    onVerified: () => void;
}

export const AgeGate: React.FC<Props> = ({ onVerified }) => {
    const confirm = useCallback(async () => {
        await AsyncStorage.setItem(AGE_VERIFIED_KEY, 'true');
        onVerified();
    }, [onVerified]);

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
        backgroundColor: '#100a02',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#f0dca4',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#a08050',
        fontStyle: 'italic',
        marginTop: 6,
    },
    divider: {
        width: 60,
        height: 2,
        backgroundColor: '#6b4c00',
        marginVertical: 28,
    },
    body: {
        color: '#c8b088',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 14,
    },
    confirmBtn: {
        backgroundColor: '#c8960c',
        borderRadius: 8,
        paddingHorizontal: 28,
        paddingVertical: 14,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#6b4c00',
    },
    confirmText: {
        color: '#100a02',
        fontWeight: '800',
        fontSize: 15,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
