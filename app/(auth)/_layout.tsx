import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import Toast from 'react-native-toast-message'; // Add this import

export default function AuthLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.white }
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Select Role' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
      </Stack>
      
      {/* Add Toast component here */}
      <Toast />
    </>
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