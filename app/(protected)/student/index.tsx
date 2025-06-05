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
  X,
  Award,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import api from '@/service/api';
import { router } from 'expo-router';

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

interface Assignment {
  id: number;
  name: string;
  course: string;
  dueDate: string;
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
  const [enrolledCoursesList, setEnrolledCoursesList] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
        loadAssignments(),
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

      const enrichedEnrollments: Enrollment[] = [];
      const recentCoursesData: Course[] = [];

      for (const courseId of enrolledCourseIds) {
        try {
          const courseDetailsResponse = await api.get(`/course/details/${courseId}`);
          const courseDetails = courseDetailsResponse.data;

          enrichedEnrollments.push({
            courseId,
            rollNums: [],
            courseDetails
          });

          if (recentCoursesData.length < 3) {
            recentCoursesData.push(courseDetails);
          }
        } catch (error) {
          console.error(`Error fetching details for course ${courseId}:`, error);
        }
      }

      setEnrolledCoursesList(enrichedEnrollments);
      setRecentCourses(recentCoursesData);
      setStats(prev => ({ ...prev, enrolledCourses: enrichedEnrollments.length }));

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

  const loadAssignments = async () => {
    try {
      const mockAssignments: Assignment[] = [
        { id: 1, name: 'Algebra Homework', course: 'Mathematics', dueDate: '2024-06-10' },
        { id: 2, name: 'Lab Report', course: 'Physics', dueDate: '2024-06-12' },
        { id: 3, name: 'Organic Chemistry Essay', course: 'Chemistry', dueDate: '2024-06-15' },
      ];
      setAssignments(mockAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      setLoading(prev => ({ ...prev, courseDetails: true }));
      const response = await api.get(`/course/details/${courseId}`);
      setSelectedCourse(response.data);
      setModalVisible(prev => ({ ...prev, courseDetails: true }));
    } catch (error) {
      console.error("Error fetching course details:", error);
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(prev => ({ ...prev, courseDetails: false }));
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

  if (loading.main) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={`Hello, ${user?.name?.split(' ')[0] || 'Student'}`} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, styles.enrolledCard]}
            onPress={handleEnrolledCoursesClick}
          >
            <View style={styles.statIconContainer}>
              <BookOpen size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.enrolledCourses}</Text>
              <Text style={styles.statLabel}>Enrolled Courses</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, styles.availableCard]}
            onPress={handleAvailableCoursesClick}
          >
            <View style={styles.statIconContainer}>
              <Bookmark size={24} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.availableCourses}</Text>
              <Text style={styles.statLabel}>Available Courses</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.statCard, styles.attendanceCard]}>
            <View style={styles.statIconContainer}>
              <Award size={24} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.statValue}>{stats.attendancePercentage}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />

        {/* Exam Timetable Card */}
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
      </ScrollView>

      {/* Enrolled Courses Modal */}
      <Modal
        visible={modalVisible.enrolledCourses}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enrolled Courses</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(prev => ({ ...prev, enrolledCourses: false }))}
            >
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {loading.enrolled ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading enrolled courses...</Text>
            </View>
          ) : (
            <FlatList
              data={enrolledCoursesList}
              keyExtractor={(item) => item.courseId}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalCourseCard}
                  onPress={() => {
                    setModalVisible(prev => ({ ...prev, enrolledCourses: false }));
                    fetchCourseDetails(item.courseId);
                  }}
                >
                  <View style={styles.modalCourseInfo}>
                    <Text style={styles.modalCourseTitle}>
                      {item.courseDetails?.courseTitle}
                    </Text>
                    <Text style={styles.modalCourseDept}>
                      {item.courseDetails?.dept}
                    </Text>
                    <View style={styles.modalCourseStatus}>
                      <Text style={[
                        styles.statusBadge,
                        item.courseDetails?.isActive ? styles.activeBadge : styles.inactiveBadge
                      ]}>
                        {item.courseDetails?.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={COLORS.gray} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyModalContent}>
                  <BookOpen size={48} color={COLORS.gray} />
                  <Text style={styles.emptyModalTitle}>No enrolled courses</Text>
                  <Text style={styles.emptyModalText}>
                    You haven't enrolled in any courses yet
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* Available Courses Modal */}
      <Modal
        visible={modalVisible.availableCourses}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Available Courses</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(prev => ({ ...prev, availableCourses: false }))}
            >
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {loading.available ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading available courses...</Text>
            </View>
          ) : (
            <FlatList
              data={availableCoursesList}
              keyExtractor={(item) => item.course_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.modalCourseCard}
                  onPress={() => {
                    setModalVisible(prev => ({ ...prev, availableCourses: false }));
                    fetchCourseDetails(item.course_id.toString());
                  }}
                >
                  <View style={styles.modalCourseInfo}>
                    <Text style={styles.modalCourseTitle}>{item.courseTitle}</Text>
                    <Text style={styles.modalCourseDept}>{item.dept}</Text>
                    <View style={styles.modalCourseStatus}>
                      <Text style={[
                        styles.statusBadge,
                        item.isActive ? styles.activeBadge : styles.inactiveBadge
                      ]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={COLORS.gray} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyModalContent}>
                  <BookOpen size={48} color={COLORS.gray} />
                  <Text style={styles.emptyModalTitle}>No courses available</Text>
                  <Text style={styles.emptyModalText}>
                    There are currently no courses available for enrollment
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>

      {/* Course Details Modal */}
      <Modal
        visible={modalVisible.courseDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Course Details</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(prev => ({ ...prev, courseDetails: false }))}
            >
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {loading.courseDetails ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading course details...</Text>
            </View>
          ) : selectedCourse ? (
            <ScrollView style={styles.courseDetailsContainer}>
              <View style={styles.courseDetailsGrid}>
                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Course ID</Text>
                  <Text style={styles.courseDetailValue}>
                    {selectedCourse.course_id}
                  </Text>
                </View>

                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Course Code</Text>
                  <Text style={styles.courseDetailValue}>
                    {selectedCourse.courseCode || 'N/A'}
                  </Text>
                </View>

                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Title</Text>
                  <Text style={styles.courseDetailValue}>
                    {selectedCourse.courseTitle}
                  </Text>
                </View>

                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Department</Text>
                  <Text style={styles.courseDetailValue}>
                    {selectedCourse.dept}
                  </Text>
                </View>

                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Duration</Text>
                  <Text style={styles.courseDetailValue}>
                    {selectedCourse.duration} weeks
                  </Text>
                </View>

                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Credits</Text>
                  <Text style={styles.courseDetailValue}>
                    {selectedCourse.credit}
                  </Text>
                </View>

                <View style={styles.courseDetailItem}>
                  <Text style={styles.courseDetailLabel}>Status</Text>
                  <Text style={[
                    styles.statusBadge,
                    selectedCourse.isActive ? styles.activeBadge : styles.inactiveBadge
                  ]}>
                    {selectedCourse.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.courseDescriptionContainer}>
                <Text style={styles.courseDetailLabel}>Description</Text>
                <Text style={styles.courseDescription}>
                  {selectedCourse.courseDescription}
                </Text>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyModalContent}>
              <Text style={styles.emptyModalTitle}>No course details available</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  scrollContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'column',
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  availableCard: {
    borderLeftColor: COLORS.primary,
    borderLeftWidth: 4,
  },
  enrolledCard: {
    borderLeftColor: COLORS.secondary,
    borderLeftWidth: 4,
  },
  attendanceCard: {
    borderLeftColor: COLORS.accent,
    borderLeftWidth: 4,
  },
  statIconContainer: { 
    marginRight: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCourseCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  modalCourseInfo: {
    flex: 1,
  },
  modalCourseTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  modalCourseDept: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  modalCourseStatus: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
  },
  inactiveBadge: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.gray,
  },
  emptyModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyModalTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyModalText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
  },
  courseDetailsContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  courseDetailsGrid: {
    marginBottom: SPACING.lg,
  },
  courseDetailItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  courseDetailLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: 4,
  },
  courseDetailValue: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  courseDescriptionContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  courseDescription: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  examTimetableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  examTimetableText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  examHighlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  viewTimetableButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  viewTimetableText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
  },
});