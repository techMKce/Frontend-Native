import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch, Modal, FlatList,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router'; // Add this import
import Header from '@/components/shared/Header';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Eye, Filter, FileText, ArrowLeft } from 'lucide-react-native';
import api from '@/service/api';
import { useAuth } from '@/hooks/useAuth';

// Define types for our data
type Student = {
  stdId: string;
  stdName: string;
  rollNum: string;
  deptId: string;
  deptName: string;
  batch: string;
  sem: number;
  courseId: string;
  courseName: string;
};

type Course = {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  dept: string;
  duration: number;
  credit: number;
  imageUrl: string;
};

type AttendanceRecord = {
  id: number;
  stdId: string;
  stdName: string;
  facultyId: string;
  facultyName: string;
  courseId: string;
  courseName: string;
  status: number;
  session: string;
  batch: string;
  deptId: string;
  deptName: string;
  sem: number;
  dates: string;
};

type UserProfile = {
  id: string;
  name: string;
};

type AuthProfile = {
  profile: UserProfile;
};

const AttendanceScreen = () => {
  const { profile } = useAuth();
  const router = useRouter(); // Add this line
  const authProfile = profile as AuthProfile | undefined;
  const user = authProfile?.profile;

  const [filters, setFilters] = useState({
    batch: '',
    course: '',
    department: '',
    semester: '',
    session: 'forenoon',
    date: new Date()
  });

  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [showStats, setShowStats] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCourseSelection, setShowCourseSelection] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFacultyCourses();
    }
    // eslint-disable-next-line
  }, [user?.id]);

  const fetchFacultyCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const assignResponse = await api.get(
        `/faculty-student-assigning/admin/faculty/${user?.id}`
      );

      if (assignResponse.data?.length > 0) {
        const courseIds = assignResponse.data
          .map((item: { courseId: string }) => item.courseId)
          .filter(Boolean)
          .join('&id=');

        if (!courseIds) {
          setError('No valid course IDs found');
          setCourses([]);
          return;
        }

        const courseResponse = await api.get(
          `/course/detailsbyId?id=${courseIds}`
        );

        if (courseResponse.data) {
          setCourses(courseResponse.data.map((course: any) => ({
            courseId: course.course_id?.toString() || '',
            courseTitle: course.courseTitle || 'Untitled Course',
            courseDescription: course.courseDescription || '',
            instructorName: course.instructorName || '',
            dept: course.dept || '',
            duration: Number(course.duration) || 0,
            credit: Number(course.credit) || 0,
            imageUrl: course.imageUrl || ''
          })));
        } else {
          setCourses([]);
          setError('No courses found');
        }
      } else {
        setCourses([]);
        setError('No courses assigned');
      }
    } catch (err) {
      setCourses([]);
      setError('Failed to fetch courses. Please try again.');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForCourse = async (course: Course) => {
    try {
      setLoading(true);
      setError('');

      const assignResponse = await api.get(
        `/faculty-student-assigning/admin/faculty/${user?.id}`
      );


      const courseAssignments = assignResponse.data?.find(
        (item: any) => item.courseId === course.courseId
      );


      if (courseAssignments?.assignedRollNums?.length > 0) {
        
        const studentDetails = [];
        
        // Fetch students one by one with better error handling
        for (const rollNum of courseAssignments.assignedRollNums) {
          try {
            const res = await api.get(`/profile/student/${rollNum}`);
            
            if (res.data) {
              studentDetails.push({
                stdId: res.data.stdId || res.data.id || rollNum, // Fallback to rollNum if no stdId
                stdName: res.data.stdName || res.data.name || 'Unknown',
                rollNum: res.data.rollNum || rollNum,
                deptId: res.data.deptId || '',
                deptName: res.data.deptName || 'Unknown Department',
                batch: res.data.batch || '',
                sem: res.data.sem || 0,
                courseId: course.courseId,
                courseName: course.courseTitle
              });
            }
          } catch (err) {
            // Add a placeholder student even if API fails
            studentDetails.push({
              stdId: rollNum, // Use rollNum as fallback ID
              stdName: `Student ${rollNum}`,
              rollNum: rollNum,
              deptId: '',
              deptName: 'Unknown Department',
              batch: '',
              sem: 0,
              courseId: course.courseId,
              courseName: course.courseTitle
            });
          }
        }


        // Filter out invalid students but be more lenient
        const validStudents = studentDetails.filter(student => 
          student && (student.stdId || student.rollNum)
        ) as Student[];


        if (validStudents.length > 0) {
          setStudents(validStudents);
          setSelectedCourse(course);
          setShowCourseSelection(false);

          // Initialize attendance state
          const initialAttendance = validStudents.reduce((acc: Record<string, boolean>, student) => {
            const studentId = student.stdId || student.rollNum;
            acc[studentId] = false;
            return acc;
          }, {});
          
          setAttendance(initialAttendance);
        } else {
          setError('No valid students found for this course');
        }
      } else {
        setError('No students assigned to this course');
      }
    } catch (err) {
      setError('Failed to fetch students. Please try again.');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const submitAttendance = async () => {
    if (!selectedCourse || !user?.id) return;
    try {
      setLoading(true);
      const dateStr = filters.date.toISOString().split('T')[0];

      const attendanceRecords = students
        .filter(student => student.stdId || student.rollNum)
        .map(student => {
          const studentId = student.stdId || student.rollNum;
          return {
            stdId: student.stdId || student.rollNum,
            stdName: student.stdName,
            facultyId: user.id,
            facultyName: user.name || "Faculty",
            status: attendance[studentId] ? 1 : 0,
            session: filters.session,
            courseId: selectedCourse.courseId,
            courseName: selectedCourse.courseTitle,
            batch: student.batch,
            deptId: student.deptId,
            deptName: student.deptName,
            sem: student.sem,
            dates: dateStr
          };
        });


      if (attendanceRecords.length > 0) {
        await api.post('/attendance/attendanceupdate', attendanceRecords);
        setShowStats(true);
      } else {
        setError('No valid attendance records to submit');
      }
    } catch (err) {
      setError('Failed to submit attendance. Please try again.');
      console.error('Error submitting attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Replace the toggleViewAttendance function with navigateToHistory
  const navigateToHistory = () => {
    router.push('/(protected)/faculty/attendance-history');
  };

  const resetAttendance = () => {
    setShowCourseSelection(true);
    setStudents([]);
    setSelectedCourse(null);
    setShowStats(false);
    setAttendance({});
    setError(''); // Clear any existing errors
    setFilters({
      batch: '',
      course: '',
      department: '',
      semester: '',
      session: 'forenoon',
      date: new Date()
    });
  };

  const total = students.length;
  const present = Object.values(attendance).filter(Boolean).length;
  const absent = total - present;

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Take Attendance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Take Attendance" />

      {error && !showCourseSelection && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError('');
              if (selectedCourse) {
                fetchStudentsForCourse(selectedCourse);
              } else {
                resetAttendance();
              }
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCourseSelection ? (
        <View style={{ flex: 1 }}>
          <View style={styles.topToolbar}>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Filter size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToHistory}>
              <Eye size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError('');
                  fetchFacultyCourses();
                }}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={courses}
            keyExtractor={(item) => item.courseId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.courseCard}
                onPress={() => fetchStudentsForCourse(item)}
              >
                <Text style={styles.courseName}>{item.courseTitle}</Text>
                <View style={styles.courseDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Department:</Text>
                    <Text style={styles.detailValue}>{item.dept}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Instructor:</Text>
                    <Text style={styles.detailValue}>{item.instructorName}</Text>
                  </View>
                </View>
                <View style={styles.courseStats}>
                  <View style={styles.statItem}>
                    <FileText size={16} color={COLORS.gray} />
                    <Text style={styles.statText}>{item.credit} Credits</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.coursesList}
            ListEmptyComponent={
              !loading && !error ? (
                <Text style={styles.emptyText}>No courses assigned</Text>
              ) : null
            }
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {selectedCourse && (
            <TouchableOpacity style={styles.backButtonViewMode} onPress={resetAttendance}>
              <ArrowLeft size={20} color={COLORS.primary} />
              <Text style={styles.backButtonViewModeText}>Back to Courses</Text>
            </TouchableOpacity>
          )}

          {selectedCourse && (
            <View style={styles.selectedCourseInfo}>
              <Text style={styles.selectedCourseTitle}>{selectedCourse.courseTitle}</Text>
              <Text style={styles.selectedCourseDept}>{selectedCourse.dept}</Text>
            </View>
          )}

          {students.length > 0 && !showStats && (
            <View style={styles.list}>
              {students.map((student) => {
                const studentId = student.stdId || student.rollNum;
                return (
                  <TouchableOpacity
                    key={studentId}
                    style={styles.studentRow}
                    onPress={() => handleToggle(studentId)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.studentName}>{student.stdName}</Text>
                      <Text style={styles.studentRoll}>{student.rollNum}</Text>
                      <Text style={styles.studentDept}>{student.deptName} - {student.batch}</Text>
                    </View>

                    <Switch
                      value={attendance[studentId] || false}
                      onValueChange={() => handleToggle(studentId)}
                      thumbColor={attendance[studentId] ? COLORS.primary : '#f4f3f4'}
                      trackColor={{ false: '#767577', true: COLORS.primaryLight }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showStats && (
            <Modal
              visible={showStats}
              animationType="slide"
              transparent
              onRequestClose={() => setShowStats(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.slideUpBox}>
                  <Text style={styles.statsText}>Total Students: {total}</Text>
                  <Text style={styles.statsText}>Present: {present}</Text>
                  <Text style={styles.statsText}>Absent: {absent}</Text>

                  <View style={styles.statsActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowStats(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.okButton}
                      onPress={() => {
                        setShowStats(false);
                        resetAttendance();
                      }}
                    >
                      <Text style={styles.okButtonText}>OK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {students.length > 0 && !showStats && (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitAttendance}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Submit Attendance</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.picker}>
                <Picker
                  selectedValue={filters.session}
                  onValueChange={(val) => setFilters({ ...filters, session: val })}
                >
                  <Picker.Item label="Forenoon" value="forenoon" />
                  <Picker.Item label="Afternoon" value="afternoon" />
                </Picker>
              </View>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowPicker(true)}
              >
                <Calendar size={20} />
                <Text style={styles.dateText}>
                  {filters.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={filters.date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => {
                    setShowPicker(false);
                    if (date) setFilters({ ...filters, date });
                  }}
                />
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={{ color: 'red', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={{ color: 'green', fontWeight: 'bold' }}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: SIZES.md,
    color: COLORS.gray,
    fontFamily: FONT.regular,
  },
  errorContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    padding: SPACING.md,
    paddingBottom: 100
  },
  coursesList: {
    paddingBottom: 100,
    paddingHorizontal: SPACING.md
  },
  topToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    padding: SPACING.md,
  },
  backButtonViewMode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingLeft: SPACING.md,
  },
  backButtonViewModeText: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontFamily: FONT.medium,
  },
  selectedCourseInfo: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  selectedCourseTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  selectedCourseDept: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  courseName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  courseDescription: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  courseDetails: {
    marginBottom: SPACING.sm
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs
  },
  detailLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginRight: SPACING.xs,
  },
  detailValue: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md
  },
  statText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  list: {
    width: '100%'
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  studentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  studentRoll: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  studentDept: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  buttonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: 12,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  statsBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginTop: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statsText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    marginBottom: SPACING.sm,
    color: COLORS.darkGray,
  },
  picker: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  dateText: {
    marginLeft: SPACING.sm,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  emptyText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  errorText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignSelf: 'center',
    ...SHADOWS.small,
  },
  retryText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  slideUpBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...SHADOWS.medium,
  },
  statsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  okButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  okButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
});

export default AttendanceScreen;