import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/theme';
<<<<<<< HEAD
import { LayoutGrid, ClipboardList, GraduationCap, User, BookOpen } from 'lucide-react-native';
=======
import { LayoutGrid, BookOpen, GraduationCap, User } from 'lucide-react-native';
>>>>>>> a4274f2c51e962dc798fc9b52d8e18a89a2d12db
import TabBar from '@/components/shared/TabBar';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function StudentTabsLayout() {
  const { user } = useAuth();

  // If no user or user is not a student, this layout should not render
  if (!user || user.role !== 'student') {
    return null;
  }

  const tabs = [
    {
      name: 'index',
      href: '/(student)',
      icon: LayoutGrid,
      label: 'Dashboard',
    },
    {
      name: 'available-courses',
<<<<<<< HEAD
      href: '/(student)/availabe-course',
=======
      href: '/(student)/available-courses',
>>>>>>> a4274f2c51e962dc798fc9b52d8e18a89a2d12db
      icon: BookOpen,
      label: 'Available',
    },
    {
<<<<<<< HEAD
      name: 'assignment',
      href: '/(student)/assignments',
      icon: ClipboardList,
      label: 'Assignment',
    },
    {
=======
>>>>>>> a4274f2c51e962dc798fc9b52d8e18a89a2d12db
      name: 'enrolled-courses',
      href: '/(student)/enrolled-courses',
      icon: GraduationCap,
      label: 'Enrolled',
    },
    {
      name: 'profile',
      href: '/(student)/profile',
      icon: User,
      label: 'Profile',
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
        <Tabs.Screen name="available-courses" />
        <Tabs.Screen name="enrolled-courses" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="profile/edit" />
        <Tabs.Screen name="profile/education" />
        <Tabs.Screen name="course/[id]" />
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