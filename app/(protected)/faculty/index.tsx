import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Users, BookOpen, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import api from '@/service/api';

interface Course {
  id: string;
  name: string;
  isActive: boolean;
}

export default function FacultyDashboard() {
  const { profile } = useAuth();
  const user = profile?.profile;
  const router = useRouter();

  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalCourses, setTotalCourses] = useState<number | null>(null);
  const [activeCourses, setActiveCourses] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!profile?.profile?.id) return;

        // Fetch student count
        const studentsRes = await api.get(
          `/faculty-student-assigning/admin/faculty/${profile.profile.id}/count`
        );
        setTotalStudents(studentsRes.data?.count || 0);

        // Fetch total courses count
        const coursesRes = await api.get('/course/count');
        setTotalCourses(coursesRes.data || 0);

        // Fetch active courses
        const activeCoursesRes = await api.get('/course/active');
        if (activeCoursesRes.data && Array.isArray(activeCoursesRes.data)) {
          setActiveCourses(activeCoursesRes.data.length);
        } else {
          setActiveCourses(0);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Alert.alert('Error', 'Failed to load dashboard data');
        setActiveCourses(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.profile?.id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={`Welcome, ${user?.name?.split(' ')[0] || 'Faculty'}`} />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Stats - Now vertical */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.studentsCard]}>
            <View style={styles.statIconContainer}>
              <Users size={28} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{totalStudents ?? 'N/A'}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.coursesCard]}>
            <View style={styles.statIconContainer}>
              <BookOpen size={28} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={styles.statValue}>{totalCourses ?? 'N/A'}</Text>
              <Text style={styles.statLabel}>Total Courses</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.activeCoursesCard]}>
            <View style={styles.statIconContainer}>
              <BookOpen size={28} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.statValue}>{activeCourses ?? 'N/A'}</Text>
              <Text style={styles.statLabel}>Active Courses</Text>
            </View>
          </View>
        </View>

        {/* Exam Timetable */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exam Timetable</Text>
            <Calendar size={24} color={COLORS.primary} />
          </View>

          <View style={styles.examTimetableCard}>
            <Text style={styles.examTimetableText}>
              Download your <Text style={styles.examHighlight}>Exam Timetable</Text>
            </Text>
            <TouchableOpacity
              style={styles.viewTimetableButton}
              onPress={() => router.push('/exam-timetable')}
            >
              <Text style={styles.viewTimetableText}>View Full Timetable</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.lg,
    color: COLORS.gray,
  },
  scrollContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  statsContainer: {
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  studentsCard: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  coursesCard: {
    borderLeftColor: COLORS.secondary,
    borderLeftWidth: 4,
  },
  activeCoursesCard: {
    borderLeftColor: COLORS.accent,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    marginRight: SPACING.lg,
  },
  statValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xl,
    color: COLORS.darkGray,
  },
  statLabel: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  viewAllText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
  },
  examTimetableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  examTimetableText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  examHighlight: { 
    fontFamily: FONT.semiBold, 
    color: COLORS.primary,
    fontSize: SIZES.md,
  },
  viewTimetableButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
  },
  viewTimetableText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.white,
  },
});