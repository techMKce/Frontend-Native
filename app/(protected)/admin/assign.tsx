import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Check } from 'lucide-react-native';
import api from '@/service/api';
import Header from '@/components/shared/Header';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  email?: string;
}

interface Faculty {
  id: string;
  name: string;
  facultyId: string;
  department: string;
  email?: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  isEnabled: boolean;
}

interface Assignment {
  id: string;
  studentId: string;
  facultyId: string;
  courseId: string;
}

interface User {
  id: string;
  name: string;
  type: 'student' | 'faculty';
  status: string;
}

const AssignStudentsScreen = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [enrolledUsers, setEnrolledUsers] = useState<User[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [existingAssignments, setExistingAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState({
    initial: true,
    faculty: false,
    students: false,
    assignment: false,
  });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading((prev) => ({ ...prev, initial: true }));
        const [deptResponse, courseResponse] = await Promise.all([
          api.get('/profile/faculty/departments'),
          api.get('/course/details'),
        ]);

        if (deptResponse.status !== 200 || courseResponse.status !== 200) {
          Alert.alert('Error', 'Failed to load initial data');
          return;
        }

        const departmentsData: string[] = deptResponse.data.filter(
          (dep: string) => dep !== null
        );
        setDepartments(departmentsData);

        const coursesData: Course[] = courseResponse.data.map((course: any) => ({
          id: course.course_id,
          name: course.courseTitle,
          code: course.courseCode,
          department: course.dept || course.department,
          isEnabled: course.isActive,
        }));
        setCourses(coursesData.filter((course) => course.isEnabled));
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Error loading initial data'
        );
      } finally {
        setLoading((prev) => ({ ...prev, initial: false }));
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) return;

    const fetchFaculty = async () => {
      try {
        setLoading((prev) => ({ ...prev, faculty: true }));
        let response;
        if (selectedDepartment === 'all') {
          response = await api.get('/profile/faculty');
        } else {
          response = await api.get(
            `/profile/faculty/by-department/${selectedDepartment}`
          );
        }

        if (response.status !== 200) {
          Alert.alert('Error', 'Failed to load faculty');
          return;
        }

        const facultyData: Faculty[] = response.data.map((f: any) => ({
          id: f.staffId || f.facultyId || f.id,
          name: f.name,
          email: f.email,
          facultyId: f.facultyId,
          department: f.department,
        }));
        setFaculty(facultyData);
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Error loading faculty data'
        );
      } finally {
        setLoading((prev) => ({ ...prev, faculty: false }));
      }
    };

    fetchFaculty();
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedCourse) return;

    const fetchEnrolledStudents = async () => {
      try {
        setLoading((prev) => ({ ...prev, students: true }));
        const [enrollmentResponse, studentsResponse] = await Promise.all([
          api.get(`/course-enrollment/by-course/${selectedCourse}`),
          api.get('/profile/student'),
        ]);

        if (
          enrollmentResponse.status !== 200 ||
          studentsResponse.status !== 200
        ) {
          Alert.alert('Error', 'Failed to load student data');
          return;
        }

        const rollNumbers = enrollmentResponse.data.rollNums;

        const studentsData: Student[] = studentsResponse.data.map((s: any) => ({
          id: s.rollNum,
          name: s.name,
          email: s.email,
          rollNumber: s.rollNum,
          department: s.program,
        }));

        setStudents(studentsData);

        const enrollmentData: User[] = studentsResponse.data
          .filter((s: any) => rollNumbers.includes(s.rollNum))
          .map((s: any) => ({
            id: s.rollNum,
            name: s.name,
            type: 'student',
            status: `Roll: ${s.rollNum}`,
          }));

        setEnrolledUsers(enrollmentData);
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Error loading enrolled students'
        );
      } finally {
        setLoading((prev) => ({ ...prev, students: false }));
      }
    };

    fetchEnrolledStudents();
  }, [selectedCourse]);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedUsers([]);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const checkExistingAssignments = (
    studentIds: string[],
    facultyId: string,
    courseId: string
  ) => {
    return studentIds.some((studentId) =>
      existingAssignments.some(
        (assignment) =>
          assignment.studentId === studentId && assignment.courseId === courseId
      )
    );
  };

  const getAssignedFacultyForStudent = (studentId: string, courseId: string) => {
    const assignment = existingAssignments.find(
      (a) => a.studentId === studentId && a.courseId === courseId
    );

    if (assignment) {
      const assignedFaculty = faculty.find((f) => f.id === assignment.facultyId);
      return assignedFaculty?.name || 'Assigned Faculty';
    }
    return null;
  };

  const handleAssignStudents = async () => {
    if (!selectedCourse || selectedUsers.length === 0 || !selectedFaculty) {
      Alert.alert(
        'Error',
        'Please select a course, at least one student, and a faculty member'
      );
      return;
    }

    const hasExistingAssignments = checkExistingAssignments(
      selectedUsers,
      selectedFaculty,
      selectedCourse
    );

    if (hasExistingAssignments) {
      Alert.alert(
        'Error',
        'One or more selected students are already assigned to a faculty for this course'
      );
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, assignment: true }));
      setAssigning(true);
      const response = await api.post(
        '/faculty-student-assigning/admin/assign',
        {
          courseId: selectedCourse,
          facultyId: selectedFaculty,
          rollNums: selectedUsers,
        }
      );

      if (response.status !== 200) {
        Alert.alert('Error', 'Failed to assign students to faculty');
        return;
      }

      // Update existing assignments state
      const newAssignments = selectedUsers.map((studentId) => ({
        id: `${studentId}-${selectedFaculty}-${selectedCourse}`,
        studentId,
        facultyId: selectedFaculty,
        courseId: selectedCourse,
      }));

      setExistingAssignments([...existingAssignments, ...newAssignments]);
      setSelectedUsers([]);
      Alert.alert('Success', `Successfully assigned ${selectedUsers.length} students`);
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data || '';

        if (status === 409) {
          Alert.alert(
            'Error',
            'One or more students are already assigned to another faculty for this course'
          );
        } else if (status === 400) {
          Alert.alert('Error', message || 'Bad request');
        } else {
          Alert.alert('Error', 'Failed to assign students. Please try again.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading((prev) => ({ ...prev, assignment: false }));
      setAssigning(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={COLORS.primary} />
    </View>
  );

  const renderFacultyItem = ({ item }: { item: Faculty }) => (
    <TouchableOpacity
      onPress={() => setSelectedFaculty(item.id)}
      style={[
        styles.selectionCard,
        selectedFaculty === item.id && styles.selectedCard,
      ]}
    >
      <View style={styles.selectionInfo}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Text style={styles.idText}>Faculty ID: {item.facultyId}</Text>
        <Text style={styles.idText}>Department: {item.department}</Text>
      </View>
      {selectedFaculty === item.id && (
        <View style={styles.checkmark}>
          <Check size={20} color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStudentItem = ({ item }: { item: User }) => {
    const studentData = students.find((s) => s.id === item.id);
    const isAssigned = existingAssignments.some(
      (a) => a.studentId === item.id && a.courseId === selectedCourse
    );
    const assignedFaculty = getAssignedFacultyForStudent(item.id, selectedCourse);

    return (
      <TouchableOpacity
        style={[
          styles.selectionCard,
          selectedUsers.includes(item.id) && styles.selectedCard,
          isAssigned && styles.assignedCard,
        ]}
        onPress={() => !isAssigned && handleUserSelect(item.id)}
        disabled={isAssigned}
      >
        <View style={styles.selectionInfo}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.idText}>Roll: {item.id}</Text>
          <Text style={styles.idText}>Dept: {studentData?.department || 'N/A'}</Text>
          {isAssigned && (
            <View style={styles.assignmentStatus}>
              <Text style={styles.assignedText}>Assigned</Text>
              {assignedFaculty && (
                <Text style={styles.facultyText}>Faculty: {assignedFaculty}</Text>
              )}
            </View>
          )}
        </View>
        {selectedUsers.includes(item.id) && !isAssigned && (
          <View style={styles.checkmark}>
            <Check size={20} color={COLORS.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Assign Students" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Department Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>1. Select Department</Text>
            {loading.initial ? (
              renderLoading()
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDepartment}
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    setSelectedFaculty('');
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Department" value="" />
                  <Picker.Item label="All Departments" value="all" />
                  {departments.map((dept, index) => (
                    <Picker.Item
                      key={`${dept}-${index}`}
                      label={dept}
                      value={dept}
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* Faculty Selection */}
          {selectedDepartment && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>2. Select Faculty</Text>
              {loading.faculty ? (
                renderLoading()
              ) : faculty.length > 0 ? (
                <FlatList
                  data={faculty}
                  renderItem={renderFacultyItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContainer}
                />
              ) : (
                <Text style={styles.noDataText}>No faculty members found</Text>
              )}
            </View>
          )}

          {/* Course Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>3. Select Course</Text>
            {loading.initial ? (
              renderLoading()
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCourse}
                  onValueChange={handleCourseSelect}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Course" value="" />
                  {courses.map((course) => (
                    <Picker.Item
                      key={course.id}
                      label={`${course.code} - ${course.name}`}
                      value={course.id}
                    />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* Students Selection */}
          {selectedCourse && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>4. Select Students</Text>
              {loading.students ? (
                renderLoading()
              ) : enrolledUsers.length > 0 ? (
                <FlatList
                  data={enrolledUsers}
                  renderItem={renderStudentItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContainer}
                />
              ) : (
                <Text style={styles.noDataText}>No students enrolled in this course</Text>
              )}
            </View>
          )}

          {/* Summary Section */}
          {selectedFaculty && selectedCourse && (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionHeader}>Assignment Summary</Text>
              <Text style={styles.summaryText}>
                Faculty: {faculty.find((f) => f.id === selectedFaculty)?.name || 'N/A'}
              </Text>
              <Text style={styles.summaryText}>
                Course: {courses.find((c) => c.id === selectedCourse)?.name || 'N/A'}
              </Text>
              <Text style={styles.summaryText}>
                Selected Students: {selectedUsers.length}
              </Text>
            </View>
          )}

          {/* Submit Button */}
          {selectedFaculty && selectedCourse && selectedUsers.length > 0 && (
            <TouchableOpacity
              style={[styles.assignButton, assigning && styles.disabledButton]}
              onPress={handleAssignStudents}
              disabled={assigning}
            >
              {assigning ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.assignButtonText}>
                  Assign Selected Students
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    fontFamily: FONT.bold,
    fontSize: SIZES.md,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  picker: { height: 50 },
  listContainer: {
    paddingBottom: SPACING.sm,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  selectedCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  assignedCard: {
    backgroundColor: `${COLORS.gray}10`,
    borderColor: COLORS.gray,
    borderWidth: 1,
  },
  selectionInfo: { flex: 1 },
  nameText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  idText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentStatus: {
    marginTop: SPACING.xs,
  },
  assignedText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.primary,
  },
  facultyText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  summaryText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  assignButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  disabledButton: {
    opacity: 0.7,
  },
  assignButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  loadingContainer: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    textAlign: 'center',
    padding: SPACING.md,
  },
});

export default AssignStudentsScreen;