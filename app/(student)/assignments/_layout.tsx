
import { Stack } from 'expo-router';
import { COLORS } from '@/constants/theme';
export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="assignments" options={{ headerShown: false }} />
      <Stack.Screen name="assignments/submit" options={{ headerShown: false }} />
      <Stack.Screen name="assignments/resubmit" options={{ headerShown: false }} />
      <Stack.Screen name="assignments/overdue" options={{ headerShown: false }} />
    </Stack>
  );
}