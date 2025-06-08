
import { Stack } from 'expo-router';
import { COLORS } from '@/constants/theme';
export default function Layout() {
  return (
    <Stack>
      {/* <Stack.Screen name="assignments" options={{ headerShown: false }} /> */}
      <Stack.Screen name="submit" options={{ headerShown: false }} />
      <Stack.Screen name="resubmit" options={{ headerShown: false }} />
      <Stack.Screen name="overdue" options={{ headerShown: false }} />
    </Stack>
  );
}