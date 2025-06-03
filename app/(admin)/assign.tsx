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
}

interface Faculty {
  id: string;
  name: string;
  facultyId: string;
  department: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  isEnabled: boolean;
}

export default function AssignStudentsScreen() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState({
    departments: false,
    faculty: false,
    courses: false,
    students: false,
    assigning: false,
  });

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(prev => ({...prev, departments: true}));
      try {
        const res = await api.get('/profile/faculty/departments');
        if (res.data) {
          setDepartments(res.data.filter((dept: string) => dept !== null));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load departments');
        console.error('Error fetching departments', error);
      } finally {
        setLoading(prev => ({...prev, departments: false}));
      }
    };
    fetchDepartments();
  }, []);

  // Fetch faculty when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      setFacultyList([]);
      setSelectedFaculty('');
      return;
    }

    const fetchFaculty = async () => {
      setLoading(prev => ({...prev, faculty: true}));
      try {
        const endpoint = selectedDepartment === 'all' 
          ? '/profile/faculty' 
          : `/profile/faculty/by-department/${selectedDepartment}`;
        
        const res = await api.get(endpoint);
        if (res.data) {
          const facultyData: Faculty[] = res.data.map((f: any) => ({
            id: f.staffId,
            name: f.name,
            facultyId: f.facultyId,
            department: f.department,
          }));
          setFacultyList(facultyData);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load faculty');
        console.error('Error fetching faculty', error);
      } finally {
        setLoading(prev => ({...prev, faculty: false}));
      }
    };

    fetchFaculty();
    setSelectedFaculty('');
    setSelectedCourse('');
  }, [selectedDepartment]);

  // Fetch all courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(prev => ({...prev, courses: true}));
      try {
        const res = await api.get('/course/details');
        if (res.data) {
          const coursesData: Course[] = res.data.map((course: any) => ({
            id: course.course_id,
            name: course.courseTitle,
            code: course.courseCode,
            department: course.department,
            isEnabled: course.isActive,
          }));
          setCourses(coursesData.filter((course) => course.isEnabled));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load courses');
        console.error('Error fetching courses', error);
      } finally {
        setLoading(prev => ({...prev, courses: false}));
      }
    };

    fetchCourses();
  }, []);

  // Fetch students when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setEnrolledStudents([]);
      setSelectedStudents([]);
      return;
    }

    const fetchEnrolledStudents = async () => {
      setLoading(prev => ({...prev, students: true}));
      try {
        // Get all students first
        const studentsRes = await api.get('/profile/student');
        if (studentsRes.data) {
          const studentsData: Student[] = studentsRes.data.map((s: any) => ({
            id: s.rollNum,
            name: s.name,
            rollNumber: s.rollNum,
            department: s.program,
          }));
          setStudents(studentsData);

          // Get enrolled students for the course
          const enrollmentRes = await api.get(`/course-enrollment/by-course/${selectedCourse}`);
          if (enrollmentRes.data?.rollNums) {
            const rollNumbers = enrollmentRes.data.rollNums;
            const enrolled = studentsData.filter(student => 
              rollNumbers.includes(student.id)
            );
            setEnrolledStudents(enrolled);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load enrolled students');
        console.error('Error fetching enrolled students', error);
      } finally {
        setLoading(prev => ({...prev, students: false}));
      }
    };

    fetchEnrolledStudents();
    setSelectedStudents([]);
  }, [selectedCourse]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssign = async () => {
    if (!selectedFaculty || !selectedCourse || selectedStudents.length === 0) {
      Alert.alert('Error', 'Please select faculty, course, and at least one student');
      return;
    }

    setLoading(prev => ({...prev, assigning: true}));

    try {
      const payload = {
        courseId: selectedCourse,
        facultyId: selectedFaculty,
        rollNums: selectedStudents,
      };

      const res = await api.post('/faculty-student-assigning/admin/assign', payload);

      if (res.status === 200) {
        Alert.alert('Success', 'Students assigned successfully!');
        // Reset selections
        setSelectedDepartment('');
        setSelectedFaculty('');
        setSelectedCourse('');
        setSelectedStudents([]);
      } else {
        throw new Error(res.data?.message || 'Assignment failed');
      }
    } catch (error: any) {
      console.error('Error assigning students', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to assign students. Please try again.'
      );
    } finally {
      setLoading(prev => ({...prev, assigning: false}));
    }
  };

  // Filter courses by selected department
  const filteredCourses = selectedDepartment === 'all' 
    ? courses 
    : courses.filter(course => course.department === selectedDepartment);

  return (
    <View style={styles.container}>
      <Header title="Assign Students" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Department + Faculty */}
          <View style={styles.filters}>
            <Text style={styles.selectedText}>Select Department & Faculty</Text>
            
            {loading.departments ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Department" value="" />
                  <Picker.Item label="All Departments" value="all" />
                  {departments.map((dept, index) => (
                    <Picker.Item key={index} label={dept} value={dept} />
                  ))}
                </Picker>
              </View>
            )}

            {selectedDepartment !== '' && (
              <>
                {loading.faculty ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : facultyList.length > 0 ? (
                  <View style={styles.pickerContainer}>
                    {facultyList.map(faculty => (
                      <TouchableOpacity
                        key={faculty.id}
                        onPress={() => setSelectedFaculty(faculty.id)}
                        style={[
                          styles.studentCard,
                          selectedFaculty === faculty.id && styles.selectedCard,
                        ]}
                      >
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{faculty.name}</Text>
                          <Text style={styles.departmentName}>Faculty ID: {faculty.id}</Text>
                        </View>
                        {selectedFaculty === faculty.id && (
                          <View style={styles.checkmark}>
                            <Check size={20} color={COLORS.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.departmentName, { textAlign: 'center' }]}>
                    No faculty found in this department
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Course + Students */}
          <View style={styles.filters}>
            <Text style={styles.selectedText}>Select Course and Students</Text>
            
            {loading.courses ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCourse}
                  onValueChange={setSelectedCourse}
                  style={styles.picker}
                  enabled={!!selectedDepartment}
                >
                  <Picker.Item label={selectedDepartment ? "Select Course" : "Select Department First"} value="" />
                  {filteredCourses.map(course => (
                    <Picker.Item 
                      key={course.id} 
                      label={`${course.code} - ${course.name}`} 
                      value={course.id} 
                    />
                  ))}
                </Picker>
              </View>
            )}

            {selectedCourse !== '' && (
              <>
                {loading.students ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
                ) : enrolledStudents.length > 0 ? (
                  <View>
                    {enrolledStudents.map(student => (
                      <TouchableOpacity
                        key={student.id}
                        style={[
                          styles.studentCard,
                          selectedStudents.includes(student.id) && styles.selectedCard,
                        ]}
                        onPress={() => toggleStudent(student.id)}
                      >
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.departmentName}>
                            Roll: {student.rollNumber} | Dept: {student.department}
                          </Text>
                        </View>
                        {selectedStudents.includes(student.id) && (
                          <View style={styles.checkmark}>
                            <Check size={20} color={COLORS.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.departmentName, { textAlign: 'center', padding: SPACING.md }]}>
                    No students enrolled in this course
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Summary */}
          <View style={styles.selectedCount}>
            <Text style={styles.selectedText}>Assignment Summary</Text>
            <Text style={styles.departmentName}>
              Course: {courses.find(c => c.id === selectedCourse)?.name || 'N/A'}
            </Text>
            <Text style={styles.departmentName}>
              Faculty: {facultyList.find(f => f.id === selectedFaculty)?.name || 'N/A'}
            </Text>
            <Text style={styles.departmentName}>
              Selected Students: {selectedStudents.length}
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.assignButton,
              (loading.assigning || !selectedFaculty || !selectedCourse || selectedStudents.length === 0) &&
                styles.disabledButton,
            ]}
            onPress={handleAssign}
            disabled={
              loading.assigning || !selectedFaculty || !selectedCourse || selectedStudents.length === 0
            }
          >
            {loading.assigning ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.assignButtonText}>
                Assign Selected Students to Faculty
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  filters: {
    marginBottom: SPACING.md,
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  picker: { height: 50 },
  selectedText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
    marginBottom: 4,
  },
  studentCard: {
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
  studentInfo: { flex: 1 },
  studentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  departmentName: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCount: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
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
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  assignButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});