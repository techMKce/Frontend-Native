import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { 
  Users, BookOpen, Calendar, TrendingUp, Clock, Award, 
  ChevronRight, Target, BarChart3, Settings, Download,
  Bell, Star, CheckCircle, Activity
} from 'lucide-react-native';
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
        setTotalStudents(studentsRes.data || 0); 

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
        <View style={styles.loadingCard}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment</Text>
        </View>
      </View>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <Header title={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'Professor'}`} />
      
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Welcome Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Welcome back! 👋</Text>
              <Text style={styles.heroSubtitle}>
                Ready to inspire minds today? Here's your academic overview.
              </Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <CheckCircle size={16} color="#10b981" />
                <Text style={styles.heroStatText}>All systems active</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroDecoration} />
        </View>

        {/* Enhanced Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Dashboard Overview</Text>
          
          <View style={styles.statsGrid}>
            {/* Primary Stat Card */}
            <View style={[styles.statCard, styles.featuredCard]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.primaryIconBg]}>
                  <Users size={28} color={COLORS.white} />
                </View>
                <View style={styles.statTrendContainer}>
                  <TrendingUp size={18} color="#10b981" />
                  <Text style={styles.trendText}>+12%</Text>
                </View>
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{totalStudents ?? '...'}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
                <Text style={styles.statDescription}>Across all your courses</Text>
              </View>
              <View style={styles.statProgress}>
                <View style={[styles.progressBar, { width: '75%' }]} />
              </View>
            </View>

            {/* Secondary Stats Row */}
            <View style={styles.secondaryStatsRow}>
              <View style={[styles.statCard, styles.compactCard, styles.secondaryCard]}>
                <View style={[styles.statIconContainer, styles.secondaryIconBg]}>
                  <BookOpen size={24} color={COLORS.white} />
                </View>
                <View style={styles.compactStatContent}>
                  <Text style={styles.compactStatValue}>{totalCourses ?? '...'}</Text>
                  <Text style={styles.compactStatLabel}>Total Courses</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.badgeText}>All</Text>
                </View>
              </View>

              <View style={[styles.statCard, styles.compactCard, styles.accentCard]}>
                <View style={[styles.statIconContainer, styles.accentIconBg]}>
                  <Award size={24} color={COLORS.white} />
                </View>
                <View style={styles.compactStatContent}>
                  <Text style={styles.compactStatValue}>{activeCourses ?? '...'}</Text>
                  <Text style={styles.compactStatLabel}>Active Courses</Text>
                </View>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Live</Text>
                </View>
              </View>
            </View>
          </View>
        </View>


        {/* Enhanced Exam Timetable Section */}
        <View style={styles.examSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Examination Portal</Text>
            </View>
          </View>

          <View style={styles.examTimetableCard}>
            <View style={styles.examCardHeader}>
              <View style={styles.examIconContainer}>
                <Clock size={36} color={COLORS.primary} />
                <View style={styles.examIconBadge}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                </View>
              </View>
              <View style={styles.examCardContent}>
                <Text style={styles.examTimetableTitle}>
                  Exam Schedule & Management
                </Text>
                <Text style={styles.examTimetableSubtitle}>
                  Access your complete examination timetable, manage schedules, and download resources
                </Text>
              </View>
            </View>

            <View style={styles.examActions}>
              <TouchableOpacity
                style={styles.viewTimetableButton}
                onPress={() => router.push('/exam-timetable')}
              >
                <Calendar size={18} color={COLORS.white} />
                <Text style={styles.viewTimetableText}>View Full Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.large,
    minWidth: 280,
  },
  loadingIconContainer: {
    marginBottom: SPACING.lg,
  },
  loadingText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  loadingSubtext: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  
  // Hero Section
  heroSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    zIndex: 1,
  },
  heroTextContainer: {
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xxl,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    lineHeight: SIZES.md * 1.4,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  heroStatText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: '#10b981',
  },
  heroDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${COLORS.primary}10`,
  },

  // Stats Section
  statsSection: {
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    gap: SPACING.md,
  },
  featuredCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOWS.medium,
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 5,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  statTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  trendText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.xs,
    color: '#10b981',
  },
  statDescription: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  statProgress: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    marginTop: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Secondary Stats
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  compactCard: {
    flex: 1,
    padding: SPACING.lg,
    minHeight: 120,
  },
  compactStatContent: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  compactStatValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xl,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  compactStatLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  statusIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    color: '#10b981',
  },

  // Common stat card styles
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOWS.small,
    elevation: 2,
    position: 'relative',
  },
  primaryCard: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  secondaryCard: {
    borderLeftColor: COLORS.secondary,
    borderLeftWidth: 4,
  },
  accentCard: {
    borderLeftColor: COLORS.accent,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryIconBg: {
    backgroundColor: COLORS.primary,
  },
  secondaryIconBg: {
    backgroundColor: COLORS.secondary,
  },
  accentIconBg: {
    backgroundColor: COLORS.accent,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xxxl,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  statBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    color: COLORS.white,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  seeAllText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.primary,
  },
  quickActionsScroll: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  quickActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    width: 180,
    ...SHADOWS.small,
    position: 'relative',
  },
  primaryAction: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  secondaryAction: {
    borderLeftColor: COLORS.secondary,
    borderLeftWidth: 4,
  },
  accentAction: {
    borderLeftColor: COLORS.accent,
    borderLeftWidth: 4,
  },
  neutralAction: {
    borderLeftColor: '#6b7280',
    borderLeftWidth: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryActionIcon: {
    backgroundColor: COLORS.primary,
  },
  secondaryActionIcon: {
    backgroundColor: COLORS.secondary,
  },
  accentActionIcon: {
    backgroundColor: COLORS.accent,
  },
  neutralActionIcon: {
    backgroundColor: '#6b7280',
  },
  quickActionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  quickActionSubtitle: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },

  // Exam Section
  examSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  examTimetableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOWS.medium,
    elevation: 3,
  },
  examCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  examIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
    position: 'relative',
  },
  examIconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  examCardContent: {
    flex: 1,
  },
  examTimetableTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  examTimetableSubtitle: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    lineHeight: SIZES.sm * 1.4,
    marginBottom: SPACING.md,
  },
  examFeatures: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  examFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  examFeatureText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    color: '#10b981',
  },
  examActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  viewTimetableButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  viewTimetableText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  downloadButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  downloadText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.primary,
  },

  // Activity Section
  activitySection: {
    marginBottom: SPACING.lg,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.small,
    gap: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  activityTime: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
});