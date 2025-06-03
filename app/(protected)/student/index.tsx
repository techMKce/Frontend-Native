import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
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
  Calendar,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  ChartBar as BarChart3,
} from 'lucide-react-native';
import api from '@/service/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';


type AttendanceSessionData = {
  session: string;
  stdId: string;
  sem: number;
  stdName: string;
  batch: string;
  deptId: string;
  deptName: string;
  presentcount: number;
  totaldays: number;
  percentage: number;
};

type AttendanceData = {
  forenoon?: AttendanceSessionData;
  afternoon?: AttendanceSessionData;
  overallPercentage?: number;
};

export default function StudentDashboard() {
  const { profile } = useAuth();
  const user = profile?.profile;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceData, setAttendanceData] = useState<{
    percentage: number;
    presentsession: number;
    totalsession: number;
    afternoon: number;
    forenoon: number;
  } | null>(null);
  const [semesterAttendanceDetails, setSemesterAttendanceDetails] = useState<
    Record<
      number,
      {
        percentage: number;
        FN: { conducted: number; present: number };
        AN: { conducted: number; present: number };
      }
    >
  >({});
  const router = useRouter();

  /* modal state */
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  useEffect(() => {
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/getstudent', {
        params: {
          id: 'l301',
        },
      });

      const apiData = response.data as AttendanceSessionData[];

      // Initialize all 8 semesters with zero values
      const initialSemesterData: Record<number, {
        percentage: number;
        FN: { conducted: number; present: number };
        AN: { conducted: number; present: number };
      }> = {};
      
      for (let i = 1; i <= 8; i++) {
        initialSemesterData[i] = {
          percentage: 0,
          FN: { present: 0, conducted: 0 },
          AN: { present: 0, conducted: 0 }
        };
      }

      // Fill in data from API
      apiData.forEach(item => {
        if (!initialSemesterData[item.sem]) {
          initialSemesterData[item.sem] = {
            percentage: 0,
            FN: { present: 0, conducted: 0 },
            AN: { present: 0, conducted: 0 }
          };
        }

        if (item.session === 'forenoon') {
          initialSemesterData[item.sem].FN = {
            present: item.presentcount,
            conducted: item.totaldays
          };
        } else if (item.session === 'afternoon') {
          initialSemesterData[item.sem].AN = {
            present: item.presentcount,
            conducted: item.totaldays
          };
        }

        // Calculate percentage for each semester
        const totalPresent = initialSemesterData[item.sem].FN.present + initialSemesterData[item.sem].AN.present;
        const totalConducted = initialSemesterData[item.sem].FN.conducted + initialSemesterData[item.sem].AN.conducted;
        initialSemesterData[item.sem].percentage = totalConducted > 0 
          ? (totalPresent / totalConducted) * 100 
          : 0;
      });

      setSemesterAttendanceDetails(initialSemesterData);

      // Calculate overall attendance across all semesters
      let totalPresent = 0;
      let totalConducted = 0;
      
      Object.values(initialSemesterData).forEach(semester => {
        totalPresent += semester.FN.present + semester.AN.present;
        totalConducted += semester.FN.conducted + semester.AN.conducted;
      });

      const overallPercentage = totalConducted > 0 
        ? (totalPresent / totalConducted) * 100 
        : 0;

      setAttendanceData({
        percentage: overallPercentage,
        presentsession: totalPresent,
        totalsession: totalConducted,
        afternoon: 0, // These will be calculated per semester
        forenoon: 0   // These will be calculated per semester
      });

    } catch (err) {
      setError('Failed to fetch attendance data');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.id) {
    fetchAttendanceData();
  }
}, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Mock data for courses
  const mockCourseData = {
    enrolled: 5,
    recent: [
      { id: 1, name: 'Mathematics', lastAccessed: '2024-06-01' },
      { id: 2, name: 'Physics', lastAccessed: '2024-05-28' },
      { id: 3, name: 'Chemistry', lastAccessed: '2024-05-25' },
    ],
  };

  // Mock data for assignments
  const mockAssignmentData = {
    pending: 3,
    upcoming: [
      { id: 1, name: 'Algebra Homework', course: 'Mathematics', dueDate: '2024-06-10' },
      { id: 2, name: 'Lab Report', course: 'Physics', dueDate: '2024-06-12' },
      { id: 3, name: 'Organic Chemistry Essay', course: 'Chemistry', dueDate: '2024-06-15' },
    ],
  };

  return (
    <View style={styles.container}>
      <Header title={`Hello, ${user?.name.split(' ')[0] || 'Student'}`} />

      {/* ─────────────────────────── Dashboard Scroll ─────────────────────────── */}
      <ScrollView style={styles.scrollContainer}>
        {/* ──────────── Stat Cards Row ──────────── */}
        <View style={styles.statsContainer}>
          {/* Attendance Card (clickable) */}
          <TouchableOpacity
            style={[styles.statCard, styles.attendanceCard]}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.statIconContainer}>
              <BarChart3 size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>
                {attendanceData?.percentage?.toFixed(1) || 0}%
              </Text>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={styles.statLabel}>Click to view details</Text>
            </View>
          </TouchableOpacity>

          {/* Enrolled Courses */}
          <View style={[styles.statCard, styles.coursesCard]}>
            <View style={styles.statIconContainer}>
              <BookOpen size={24} color={COLORS.secondary} />
            </View>
            <View>
              <Text style={styles.statValue}>{mockCourseData.enrolled}</Text>
              <Text style={styles.statLabel}>Enrolled Courses</Text>
            </View>
          </View>

          {/* Pending Assignments */}
          <View style={[styles.statCard, styles.assignmentsCard]}>
            <View style={styles.statIconContainer}>
              <ClipboardCheck size={24} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.statValue}>{mockAssignmentData.pending}</Text>
              <Text style={styles.statLabel}>Pending Assignments</Text>
            </View>
          </View>
        </View>

        {/* ──────────── Upcoming Assignments ──────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockAssignmentData.upcoming.map((assignment) => (
            <TouchableOpacity key={assignment.id} style={styles.assignmentCard}>
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentName}>{assignment.name}</Text>
                <Text style={styles.assignmentCourse}>{assignment.course}</Text>
              </View>
              <View style={styles.assignmentDueContainer}>
                <Text style={styles.assignmentDueLabel}>Due Date</Text>
                <Text style={styles.assignmentDueDate}>
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ──────────── Recent Courses ──────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Courses</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockCourseData.recent.map((course) => (
            <TouchableOpacity key={course.id} style={styles.courseCard}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseLastAccessed}>
                  Last accessed: {course.lastAccessed}
                </Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ──────────── Exam Timetable ──────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exam Timetable</Text>
            <Calendar size={20} color={COLORS.primary} />
          </View>

          <View style={styles.examTimetableCard}>
            <Text style={styles.examTimetableText}>
              Download your{' '}
              <Text style={styles.examHighlight}>Exam Timetable</Text>
            </Text>
            <TouchableOpacity
              style={styles.viewTimetableButton}
              onPress={() => router.push('/exam-timetable')}
            >
              <Text style={styles.viewTimetableText}>View Full Timetable</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ────────────────────────── Attendance Modal ─────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Semester</Text>

            {/* Semester buttons */}
            <View style={styles.semesterGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => {
                const selected = selectedSemester === semester;
                return (
                  <TouchableOpacity
                    key={semester}
                    style={[
                      styles.semesterButton,
                      selected && styles.semesterButtonSelected,
                    ]}
                    onPress={() => setSelectedSemester(semester)}
                  >
                    <Text
                      style={[
                        styles.semesterText,
                        selected && { color: COLORS.white },
                      ]}
                    >
                      Semester {semester}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Attendance details */}
            {selectedSemester && (
              <View style={styles.attendanceDetail}>
                <Text style={styles.attendanceDetailText}>
                  Overall Attendance:{' '}
                  {semesterAttendanceDetails[
                    selectedSemester
                  ].percentage.toFixed(1)}
                  %
                </Text>
                <Text style={styles.attendanceDetailText}>
                  FN — Present:{' '}
                  {semesterAttendanceDetails[selectedSemester].FN.present} /
                  {semesterAttendanceDetails[selectedSemester].FN.conducted}{' '}
                  days
                </Text>
                <Text style={styles.attendanceDetailText}>
                  AN — Present:{' '}
                  {semesterAttendanceDetails[selectedSemester].AN.present} /
                  {semesterAttendanceDetails[selectedSemester].AN.conducted}{' '}
                  days
                </Text>
              </View>
            )}

            {/* Close */}
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSelectedSemester(null);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /* core layout */
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    padding: SPACING.md,
  },

  /* stats row */
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    minWidth: '30%',
    flex: 1,
    marginHorizontal: 4,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  attendanceCard: {
    borderTopColor: COLORS.primary,
    borderTopWidth: 3,
  },
  coursesCard: {
    borderTopColor: COLORS.secondary,
    borderTopWidth: 3,
  },
  assignmentsCard: {
    borderTopColor: COLORS.accent,
    borderTopWidth: 3,
  },
  statIconContainer: { marginBottom: SPACING.sm },
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

  /* sections */
  sectionContainer: { marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  viewAllText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.primary,
  },

  /* upcoming assignments */
  assignmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  assignmentInfo: { flex: 1 },
  assignmentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  assignmentCourse: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
  assignmentDueContainer: { marginRight: SPACING.md, alignItems: 'center' },
  assignmentDueLabel: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
  assignmentDueDate: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.accent,
  },

  /* recent courses */
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  courseInfo: { flex: 1 },
  courseName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  courseLastAccessed: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },

  /* exam timetable */
  examTimetableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  examTimetableText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  examHighlight: { fontFamily: FONT.semiBold, color: COLORS.primary },
  viewTimetableButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
  },
  viewTimetableText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.white,
  },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    width: '90%',
    borderRadius: 12,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  semesterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  semesterButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    width: '48%',
    alignItems: 'center',
  },
  semesterButtonSelected: { backgroundColor: COLORS.primary },
  semesterText: {
    fontFamily: FONT.medium,
    color: COLORS.darkGray,
  },
  attendanceDetail: { marginVertical: SPACING.md },
  attendanceDetailText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  closeButton: {
    backgroundColor: COLORS.accent,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: FONT.medium,
    color: COLORS.white,
  },
  errorText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
  },
});