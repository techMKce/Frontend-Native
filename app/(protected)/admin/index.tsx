import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, GraduationCap, BookOpen } from 'lucide-react-native';

import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import api from '@/service/api';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const studentCountResponse = await api.get('/profile/student/count');
        const facultyCountResponse = await api.get('/profile/faculty/count');
        const courseCountResponse = await api.get('/course/count');

        setStats({
          totalStudents: studentCountResponse.data,
          totalFaculty: facultyCountResponse.data,
          totalCourses: courseCountResponse.data,
        });
      } catch (error) {
        console.error('Failed to fetch counts:', error);
        Alert.alert('Error', 'Failed to fetch data from server. Showing cached data.');
        
        const localStudents = await AsyncStorage.getItem('students');
        const localFaculty = await AsyncStorage.getItem('faculty');
        const localCourses = await AsyncStorage.getItem('courses');

        setStats({
          totalStudents: localStudents ? JSON.parse(localStudents).length : 0,
          totalFaculty: localFaculty ? JSON.parse(localFaculty).length : 0,
          totalCourses: localCourses ? JSON.parse(localCourses).length : 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title={`Welcome, ${profile?.profile.name.split(' ')[0] || 'ADMIN'}`} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={`Welcome, ${profile?.profile.name.split(' ')[0] || 'ADMIN'}`} />

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.statsContainer}>
          {/* Faculty Card */}
          <View style={[styles.statCard, styles.facultyCard]}>
            <View style={styles.statIconContainer}>
              <Users size={36} color={COLORS.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{stats.totalFaculty}</Text>
              <Text style={styles.statLabel}>Total Faculty</Text>
            </View>
          </View>

          {/* Students Card */}
          <View style={[styles.statCard, styles.studentsCard]}>
            <View style={styles.statIconContainer}>
              <GraduationCap size={36} color={COLORS.secondary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
          </View>

          {/* Courses Card */}
          <View style={[styles.statCard, styles.coursesCard]}>
            <View style={styles.statIconContainer}>
              <BookOpen size={36} color={COLORS.accent} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{stats.totalCourses}</Text>
              <Text style={styles.statLabel}>Total Courses</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'column',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  facultyCard: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 6,
  },
  studentsCard: {
    borderLeftColor: COLORS.secondary,
    borderLeftWidth: 6,
  },
  coursesCard: {
    borderLeftColor: COLORS.accent,
    borderLeftWidth: 6,
  },
  statIconContainer: {
    marginRight: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: 50,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});