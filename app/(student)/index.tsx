import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  COLORS,
  FONT,
  SIZES,
  SPACING,
  SHADOWS,
} from '@/constants/theme';
import Header from '@/components/shared/Header';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  ChartBar as BarChart3,
} from 'lucide-react-native';

/* -------------------------------------------------------------------------- */
/*                          ─── DASHBOARD MOCK DATA ───                       */
/* -------------------------------------------------------------------------- */

const mockAttendanceData = {
  overall: 85,
};

const mockCourseData = {
  enrolled: 5,
  available: 12,
  recent: [
    { id: '1', name: 'Advanced Algorithms', lastAccessed: '2 days ago' },
    { id: '2', name: 'Database Systems', lastAccessed: '1 week ago' },
  ],
};

const mockAssignmentData = {
  total: 8,
  pending: 3,
  upcoming: [
    {
      id: '1',
      name: 'Algorithm Analysis',
      dueDate: '2025-06-20',
      course: 'Advanced Algorithms',
    },
    {
      id: '2',
      name: 'Database Design',
      dueDate: '2025-06-25',
      course: 'Database Systems',
    },
  ],
};

/* Attendance details semester-wise (FN/AN) */
const semesterAttendanceDetails: Record<
  number,
  {
    percentage: number;
    FN: { conducted: number; present: number };
    AN: { conducted: number; present: number };
  }
> = {
  1: { percentage: 84, FN: { conducted: 20, present: 18 }, AN: { conducted: 18, present: 15 } },
  2: { percentage: 86, FN: { conducted: 22, present: 20 }, AN: { conducted: 19, present: 17 } },
  3: { percentage: 88, FN: { conducted: 23, present: 21 }, AN: { conducted: 21, present: 20 } },
  4: { percentage: 89, FN: { conducted: 25, present: 24 }, AN: { conducted: 22, present: 21 } },
  5: { percentage: 90, FN: { conducted: 26, present: 25 }, AN: { conducted: 24, present: 23 } },
  6: { percentage: 92, FN: { conducted: 28, present: 27 }, AN: { conducted: 26, present: 25 } },
  7: { percentage: 93, FN: { conducted: 30, present: 29 }, AN: { conducted: 27, present: 26 } },
  8: { percentage: 95, FN: { conducted: 32, present: 30 }, AN: { conducted: 28, present: 27 } },
};

/* -------------------------------------------------------------------------- */
/*                             ─── COMPONENT ───                              */
/* -------------------------------------------------------------------------- */

export default function StudentDashboard() {
  const { user } = useAuth();

  /* modal state */
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

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
              <Text style={styles.statValue}>{mockAttendanceData.overall}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={styles.statLabel}>
                Click to view details
              </Text>
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
            <TouchableOpacity style={styles.viewTimetableButton}>
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
              {Array.from({ length: 8 }).map((_, idx) => {
                const sem = idx + 1;
                const selected = selectedSemester === sem;
                return (
                  <TouchableOpacity
                    key={sem}
                    style={[
                      styles.semesterButton,
                      selected && styles.semesterButtonSelected,
                    ]}
                    onPress={() => setSelectedSemester(sem)}
                  >
                    <Text
                      style={[
                        styles.semesterText,
                        selected && { color: COLORS.white },
                      ]}
                    >
                      Semester {sem}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Attendance details */}
            {selectedSemester && (
              <View style={styles.attendanceDetail}>
                <Text style={styles.attendanceDetailText}>
                  Attendance: {
                    semesterAttendanceDetails[selectedSemester].percentage
                  }
                  %
                </Text>
                <Text style={styles.attendanceDetailText}>
                  FN — Conducted:{' '}
                  {
                    semesterAttendanceDetails[selectedSemester].FN.conducted
                  }{' '}
                  | Present:{' '}
                  {
                    semesterAttendanceDetails[selectedSemester].FN.present
                  }
                </Text>
                <Text style={styles.attendanceDetailText}>
                  AN — Conducted:{' '}
                  {
                    semesterAttendanceDetails[selectedSemester].AN.conducted
                  }{' '}
                  | Present:{' '}
                  {
                    semesterAttendanceDetails[selectedSemester].AN.present
                  }
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
});