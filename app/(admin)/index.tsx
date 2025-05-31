import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Users, GraduationCap, BookOpen } from 'lucide-react-native';

import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import profileApi from '@/service/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
  });

  useEffect(() => {
    const initCourses = async () => {
      const localCourses = await AsyncStorage.getItem('courses');
      setStats(prev => ({
        ...prev,
        totalCourses: localCourses ? JSON.parse(localCourses).length : 0,
      }));
    };

    const fetchCounts = async () => {
      try {
        const studentRes = await profileApi.get('/student/count');
        const facultyRes = await profileApi.get('/faculty/count');

        setStats(prev => ({
          ...prev,
          totalStudents: Number(studentRes.data),
          totalFaculty: Number(facultyRes.data),
        }));
      } catch (err) {
        console.error('Failed to fetch counts:', err);
        Alert.alert('Error', 'Failed to fetch counts from server. Using local data.');

        const localStudents = await AsyncStorage.getItem('students');
        const localFaculty = await AsyncStorage.getItem('faculty');

        setStats(prev => ({
          ...prev,
          totalStudents: localStudents ? JSON.parse(localStudents).length : 0,
          totalFaculty: localFaculty ? JSON.parse(localFaculty).length : 0,
        }));
      }
    };

    initCourses();
    fetchCounts();
  }, []);

  return (
    <View style={styles.container}>
<Header title={`Welcome, ${user?.name.split(' ')[0] || 'Admin'}`} />

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.facultyCard]}>
            <View style={styles.statIconContainer}>
              <Users size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.totalFaculty}</Text>
              <Text style={styles.statLabel}>Total Faculty</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.studentsCard]}>
            <View style={styles.statIconContainer}>
              <GraduationCap size={24} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.coursesCard]}>
            <View style={styles.statIconContainer}>
              <BookOpen size={24} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.totalCourses}</Text>
              <Text style={styles.statLabel}>Total Courses</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <Text style={styles.sectionSubtitle}>Current system overview</Text>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Students Enrolled</Text>
            <Text style={styles.statusValue}>{stats.totalStudents}</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Faculty Active</Text>
            <Text style={styles.statusValue}>{stats.totalFaculty}</Text>
          </View>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Courses Available</Text>
            <Text style={styles.statusValue}>{stats.totalCourses}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    flex: 1,
    minWidth: '30%',
    ...SHADOWS.small,
  },
  facultyCard: {
    borderTopColor: COLORS.primary,
    borderTopWidth: 3,
  },
  studentsCard: {
    borderTopColor: COLORS.secondary,
    borderTopWidth: 3,
  },
  coursesCard: {
    borderTopColor: COLORS.accent,
    borderTopWidth: 3,
  },
  statIconContainer: {
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  statLabel: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  statusLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  statusValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
});