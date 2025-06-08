import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {
  COLORS,
  FONT,
  SIZES,
  SPACING,
  SHADOWS,
} from '@/constants/theme';
import Header from '@/components/shared/Header';
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  Calendar,
  TrendingUp,
  Star,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import api from '@/service/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface Course {
  course_id: number;
  courseCode: string | null;
  courseTitle: string;
  courseDescription: string;
  dept: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  duration: number;
  credit: number;
  imageUrl: string;
}

interface Enrollment {
  courseId: string;
  rollNums: string[];
  courseDetails?: Course;
}

interface AttendanceData {
  session: string | null;
  stdId: string;
  sem: number;
  batch: string;
  stdName: string;
  deptName: string;
  deptId: string;
  totaldays: number;
  presentcount: number;
  percentage: number;
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const user = profile?.profile;

  const [stats, setStats] = useState({
    enrolledCourses: 0,
    availableCourses: 0,
    attendancePercentage: 0
  });

  const [availableCoursesList, setAvailableCoursesList] = useState<Course[]>([]);
  const [enrolledCoursesList, setEnrolledCoursesLst] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState({
    main: true,
    available: false,
    enrolled: false,
    courseDetails: false
  });

  const [modalVisible, setModalVisible] = useState({
    availableCourses: false,
    enrolledCourses: false,
    courseDetails: false,
  });

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(prev => ({ ...prev, main: true }));
      await Promise.all([
        loadEnrolledCourses(),
        loadAvailableCourses(),
        loadAttendanceData(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, main: false }));
    }
  };

  const loadEnrolledCourses = async () => {
    if (!user?.id) return;
    try {
      const enrolledResponse = await api.get(`/course-enrollment/by-student/${user.id}`);
      const enrolledCourseIds: string[] = enrolledResponse.data || [];
    
      const countResponse = await api.get(`/course-enrollment/count-by-student/${user.id}`);
      const enrolledCoursesCount = countResponse.data;

      const enrichedEnrollments: Enrollment[] = [];
      const recentCoursesData: Course[] = [];

      setEnrolledCoursesLst(enrichedEnrollments);
      setRecentCourses(recentCoursesData);
      setStats(prev => ({ 
        ...prev, 
        enrolledCourses: enrolledCoursesCount 
      }));

    } catch (error) {
      console.error("Error loading enrolled courses:", error);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const response = await api.get('/course/details');
      const allCourses: Course[] = response.data || [];
      const activeCourses = allCourses.filter(course => course.isActive);

      const enrolledCourseIds = enrolledCoursesList.map(enrollment => enrollment.courseId);
      const availableCourses = activeCourses.filter(course =>
        !enrolledCourseIds.includes(course.course_id.toString())
      );

      setAvailableCoursesList(availableCourses);
      setStats(prev => ({ ...prev, availableCourses: availableCourses.length }));

    } catch (error) {
      console.error("Error loading available courses:", error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const attendanceResponse = await api.get('/attendance/allattendancepercentage');
      const attendanceData: AttendanceData[] = attendanceResponse.data || [];

      const studentAttendance = attendanceData.find(record => record.stdId === user.id);

      if (studentAttendance) {
        setStats(prev => ({
          ...prev,
          attendancePercentage: Math.round(studentAttendance.percentage)
        }));
      } else {
        setStats(prev => ({
          ...prev,
          attendancePercentage: 0
        }));
      }

    } catch (error) {
      console.error("Error loading attendance data:", error);
      setStats(prev => ({
        ...prev,
        attendancePercentage: 0
      }));
    }
  };
  const handleEnrolledCoursesClick = async () => {
    if (enrolledCoursesList.length === 0) {
      setLoading(prev => ({ ...prev, enrolled: true }));
      await loadEnrolledCourses();
      setLoading(prev => ({ ...prev, enrolled: false }));
    }
    setModalVisible(prev => ({ ...prev, enrolledCourses: true }));
  };

  const handleAvailableCoursesClick = async () => {
    setLoading(prev => ({ ...prev, available: true }));
    await loadAvailableCourses();
    setLoading(prev => ({ ...prev, available: false }));
    setModalVisible(prev => ({ ...prev, availableCourses: true }));
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    if (percentage >= 40) return '#F87171';
    return '#EF4444';
  };

  const getAttendanceIcon = (percentage: number) => {
    if (percentage >= 80) return '🎯';
    if (percentage >= 60) return '⚠️';
    return '🚨';
  };

  if (loading.main) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
      <Header title={`Welcome, ${user?.name?.split(' ')[0] || 'Student'}`} />
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Enhanced Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, styles.primaryCard]}
            onPress={handleEnrolledCoursesClick}
            activeOpacity={0.8}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E0F2FE' }]}>
                <BookOpen size={24} color="#0EA5E9" />
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </View>
            <Text style={styles.statValue}>{stats.enrolledCourses}</Text>
            <Text style={styles.statLabel}>Enrolled Courses</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%', backgroundColor: '#0EA5E9' }]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, styles.secondaryCard]}
            onPress={handleAvailableCoursesClick}
            activeOpacity={0.8}
          >
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Bookmark size={24} color="#F59E0B" />
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </View>
            <Text style={styles.statValue}>{stats.availableCourses}</Text>
            <Text style={styles.statLabel}>Available Courses</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%', backgroundColor: '#F59E0B' }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Enhanced Attendance Card */}
        <View style={[styles.attendanceCard, { borderColor: getAttendanceColor(stats.attendancePercentage) }]}>
          <View style={styles.attendanceHeader}>
            <View style={styles.attendanceInfo}>
              <Text style={styles.attendanceLabel}>Attendance Rate</Text>
              <View style={styles.attendanceValueContainer}>
                <Text style={[styles.attendanceValue, { color: getAttendanceColor(stats.attendancePercentage) }]}>
                  {stats.attendancePercentage}%
                </Text>
                <Text style={styles.attendanceEmoji}>{getAttendanceIcon(stats.attendancePercentage)}</Text>
              </View>
            </View>
            <View style={[styles.attendanceIconContainer, { backgroundColor: getAttendanceColor(stats.attendancePercentage) + '20' }]}>
              <TrendingUp size={24} color={getAttendanceColor(stats.attendancePercentage)} />
            </View>
          </View>
          <View style={styles.attendanceProgressContainer}>
            <View style={styles.attendanceProgressBar}>
              <View 
                style={[
                  styles.attendanceProgressFill, 
                  { 
                    width: `${stats.attendancePercentage}%`, 
                    backgroundColor: getAttendanceColor(stats.attendancePercentage) 
                  }
                ]} 
              />
            </View>
            <Text style={styles.attendanceProgressText}>
              {stats.attendancePercentage >= 75 ? 'Great job!' : 'Needs improvement'}
            </Text>
          </View>
        </View>

        {/* Enhanced Exam Timetable Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.examTimetableCard}>
            <View style={styles.examTimetableHeader}>
              <View style={styles.examIconContainer}>
                <Calendar size={32} color={COLORS.white} />
              </View>
              <View style={styles.examTimetableInfo}>
                <Text style={styles.examTimetableTitle}>Exam Timetable</Text>
                <Text style={styles.examTimetableSubtitle}>
                  Stay updated with your exam schedule
                </Text>
              </View>
              <Star size={24} color="#FFD700" />
            </View>
            
            <TouchableOpacity
              style={styles.viewTimetableButton}
              onPress={() => router.push('/exam-timetable')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewTimetableText}>View Full Timetable</Text>
              <ChevronRight size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },

  scrollContainer: {
    flex: 1,
    padding: SPACING.md,
    marginTop: -20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 4,
  },
  primaryCard: {
    borderTopColor: '#0EA5E9',
    borderTopWidth: 3,
  },
  secondaryCard: {
    borderTopColor: '#F59E0B',
    borderTopWidth: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statIconContainer: {
    padding: SPACING.sm,
    borderRadius: 12,
  },
  statValue: {
    fontFamily: FONT.bold,
    fontSize: 32,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  attendanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    ...SHADOWS.medium,
    elevation: 4,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginBottom: 4,
  },
  attendanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  attendanceValue: {
    fontFamily: FONT.bold,
    fontSize: 36,
  },
  attendanceEmoji: {
    fontSize: 24,
  },
  attendanceIconContainer: {
    padding: SPACING.sm,
    borderRadius: 12,
  },
  attendanceProgressContainer: {
    marginTop: SPACING.sm,
  },
  attendanceProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  attendanceProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  attendanceProgressText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  examTimetableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    elevation: 4,
  },
  examTimetableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  examIconContainer: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    marginRight: SPACING.md,
  },
  examTimetableInfo: {
    flex: 1,
  },
  examTimetableTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  examTimetableSubtitle: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  viewTimetableButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  viewTimetableText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});