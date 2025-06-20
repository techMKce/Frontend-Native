import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { LayoutGrid, Users, GraduationCap, BookOpen, UserPlus, CalendarRangeIcon } from 'lucide-react-native';
import TabBar from '@/components/shared/TabBar';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
export default function AdminTabsLayout() {
  const { profile } = useAuth();
  const user = profile?.profile;
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const tabs = [
    {
      name: 'index',
      href: '/admin',
      icon: LayoutGrid,
      label: 'Dashboard',
    },
    {
      name: 'faculty',
      href: '/admin/faculty',
      icon: Users,
      label: 'Faculty',
    },
    {
      name: 'student',
      href: '/admin/student',
      icon: GraduationCap,
      label: 'Student',
    },
    {
      name: 'courses',
      href: '/admin/courses',
      icon: BookOpen,
      label: 'Courses',
    },
    {
      name: 'assign',
      href: '/admin/assign',
      icon: UserPlus,
      label: 'Assign',
    },
    {
      name: 'schedule',
      href: '/admin/schedule',
      icon: CalendarRangeIcon,
      label: 'Schedule',
    },
  ];
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => <TabBar tabs={tabs} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="faculty" />
        <Tabs.Screen name="student" />
        <Tabs.Screen name="courses" />
        <Tabs.Screen name="assign" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});