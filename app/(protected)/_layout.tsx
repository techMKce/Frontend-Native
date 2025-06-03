import { COLORS } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
export default function ProtectedLayout() {
  const router = useRouter();
  const { isReady, isAuthenticated, profile } = useAuth();

  console.log("isReady "+ isReady);
  console.log("isAuthenticated "+ isAuthenticated)

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if(!isAuthenticated){
    return <Redirect href="/login"/> 
  }

  useEffect(() => {
    if (isAuthenticated && profile?.profile?.role) {
      const role = profile.profile.role;
      console.log('Redirecting based on role:', role);

      if (role === 'STUDENT') {
        router.replace('/student');
      } else if (role === 'FACULTY') {
        router.replace('/faculty');
      } else if (role === 'ADMIN') {
        router.replace('/admin');
      } else {
        console.error('Unknown role:', role);
      }
    }
  }, [isAuthenticated, profile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="student" options={{ headerShown: false }} />
      <Stack.Screen name="faculty" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
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
