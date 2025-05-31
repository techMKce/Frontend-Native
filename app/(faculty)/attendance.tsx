import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch, Modal, FlatList,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Header from '@/components/shared/Header';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Eye, Filter, Users, Clock, FileText, ArrowLeft } from 'lucide-react-native';
import api from '@/service/api';
import { useAuth } from '@/context/AuthContext';

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

const AttendanceScreen = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    batch: '', course: '', department: '', semester: '', session: 'forenoon', date: new Date()
  });
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCourseSelection, setShowCourseSelection] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFacultyCourses();
    }
  }, [user]);

  const fetchFacultyCourses = async () => {
    try {
      setLoading(true);
      // Fetch assigned courses and students
      const assignResponse = await api.get(
        `/v1/faculty-student-assigning/admin/faculty/${user?.id}`
      );
      
      if (assignResponse.data && assignResponse.data.length > 0) {
        const courseIds = assignResponse.data.map(item => item.courseId).join('&id=');
        
        // Fetch course details
        const courseResponse = await api.get(
          `/api/course/detailsbyId?id=${courseIds}`
        );
        
        setCourses(courseResponse.data.map((course: any) => ({
          courseId: course.course_id.toString(),
          courseTitle: course.courseTitle,
          courseDescription: course.courseDescription,
          instructorName: course.instructorName,
          dept: course.dept,
          duration: course.duration,
          credit: course.credit,
          imageUrl: course.imageUrl
        })));
      }
    } catch (err) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForCourse = async (course: Course) => {
    try {
      setLoading(true);

      // Get assigned students for this course
      const assignResponse = await api.get(
        `/v1/faculty-student-assigning/admin/faculty/${user?.id}`
      );
      
      const courseAssignments = assignResponse.data.find(
        (item: any) => item.courseId === course.courseId
      );
      
      if (courseAssignments) {
        // Fetch each student's profile in parallel
        const studentDetails = await Promise.all(
          courseAssignments.assignedRollNums.map(async (rollNum: string) => {
            const res = await api.get(`/v1/profile/student/${rollNum}`);
            return {
              ...res.data,
              courseId: course.courseId,
              courseName: course.courseTitle
            };
          })
        );

        setStudents(studentDetails);
        setSelectedCourse(course);
        setShowCourseSelection(false);
      }
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const submitAttendance = async () => {
    if (!selectedCourse || !user) return;
    try {
      setLoading(true);
      const dateStr = filters.date.toISOString().split('T')[0];
      
      const attendanceRecords = students.map(student => ({
        stdId: student.stdId,
        stdName: student.stdName,
        facultyId: user.id,
        facultyName: user.name || "Faculty Name",
        status: attendance[student.stdId] ? 1 : 0,
        session: filters.session,
        courseId: selectedCourse.courseId,
        courseName: selectedCourse.courseTitle,
        batch: student.batch,
        deptId: student.deptId,
        deptName: student.deptName,
        sem: student.sem,
        dates: dateStr
      }));
      
      await api.post('/api/attupdate', attendanceRecords);
      setShowStats(true);
    } catch (err) {
      setError('Failed to submit attendance');
      console.error('Error submitting attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleViewAttendance = async () => {
    if (viewMode) {
      setViewMode(false);
      setShowStats(false);
      setAttendance({});
    } else {
      try {
        setLoading(true);
        if (!selectedCourse) return;
        
        const dateStr = filters.date.toISOString().split('T')[0];
        const response = await api.get(
          `/api/getfaculty?id=${user?.id}&date=${dateStr}`
        );
        
        // Filter records for the selected course and session
        const filteredRecords = response.data.filter(
          (record: AttendanceRecord) => 
            record.courseId === selectedCourse.courseId && 
            record.session === filters.session
        );
        
        const attendanceData = filteredRecords.reduce((acc: Record<string, boolean>, record: AttendanceRecord) => {
          acc[record.stdId] = record.status === 1;
          return acc;
        }, {});
        
        setAttendance(attendanceData);
        setViewMode(true);
      } catch (err) {
        setError('Failed to fetch attendance records');
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetAttendance = () => {
    setShowCourseSelection(true);
    setStudents([]);
    setSelectedCourse(null);
    setShowStats(false);
    setViewMode(false);
    setAttendance({});
    setFilters({ batch: '', course: '', department: '', semester: '', session: 'forenoon', date: new Date() });
  };

  const total = students.length;
  const present = Object.values(attendance).filter(Boolean).length;
  const absent = total - present;

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
        <TouchableOpacity onPress={resetAttendance}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={viewMode ? 'View Attendance' : 'Take Attendance'} />

      {showCourseSelection ? (
        <View style={{ flex: 1 }}>
          <View style={styles.topToolbar}>
            {!viewMode && (
              <TouchableOpacity onPress={() => setShowModal(true)}>
                <Filter size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleViewAttendance}>
              <Eye size={24} color={viewMode ? COLORS.primary : COLORS.gray} />
            </TouchableOpacity>
          </View>

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
              <Text style={styles.emptyText}>No courses assigned</Text>
            }
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {viewMode && (
            <TouchableOpacity style={styles.backButtonViewMode} onPress={resetAttendance}>
              <ArrowLeft size={20} color={COLORS.primary} />
              <Text style={styles.backButtonViewModeText}>Back</Text>
            </TouchableOpacity>
          )}

          {students.length > 0 && !showStats && (
            <View style={styles.list}>
              {students.map((student) => (
                <TouchableOpacity
                  key={student.stdId}
                  style={styles.studentRow}
                  disabled={viewMode}
                  onPress={() => !viewMode && handleToggle(student.stdId)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.studentName}>{student.stdName}</Text>
                    <Text style={styles.studentRoll}>{student.rollNum}</Text>
                    <Text style={styles.studentDept}>{student.deptName} - {student.batch}</Text>
                  </View>

                  {viewMode ? (
                    <Text style={{
                      color: attendance[student.stdId] ? 'green' : 'red',
                      fontWeight: '600'
                    }}>
                      {attendance[student.stdId] ? 'Present' : 'Absent'}
                    </Text>
                  ) : (
                    <Switch
                      value={attendance[student.stdId] || false}
                      onValueChange={() => handleToggle(student.stdId)}
                      thumbColor={attendance[student.stdId] ? COLORS.primary : '#f4f3f4'}
                      trackColor={{ false: '#767577', true: COLORS.primaryLight }}
                    />
                  )}
                </TouchableOpacity>
              ))}
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

          {!viewMode && students.length > 0 && !showStats && (
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
                <TouchableOpacity onPress={() => {
                  setShowModal(false);
                  if (viewMode) toggleViewAttendance();
                }}>
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
    justifyContent: 'center',
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
  backButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  backButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
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
  retryText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.primary,
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