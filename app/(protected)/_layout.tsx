import { COLORS } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
export default function ProtectedLayout() {
  const router = useRouter();
  const { isLoading, isAuthenticated, profile } = useAuth();
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  useEffect(() => {
    if (isAuthenticated && profile?.profile?.role) {
      const role = profile.profile.role;
      console.log('Redirecting based on role:', role);

      if (role === 'STUDENT') {
        router.replace('/(protected)/(student)');
      } else if (role === 'FACULTY') {
        router.replace('/(protected)/(faculty)');
      } else if (role === 'ADMIN') {
        router.replace('/(protected)/(admin)');
      } else {
        console.error('Unknown role:', role);
      }
    }
  }, [isAuthenticated, profile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(faculty)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
