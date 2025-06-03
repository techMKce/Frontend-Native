import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Check } from 'lucide-react-native';
import api from '@/service/api';
import Header from '@/components/shared/Header';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';

export default function AssignStudentsScreen() {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [facultyList, setFacultyList] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; roll: string; department: string }[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssigned, setIsAssigned] = useState(false);
  
  // Loading states for each API call
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Fetch departments on mount with better error handling
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await api.get('/profile/faculty/departments');
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid departments data format');
        }

        const transformedDepartments = response.data
          .filter(dept => dept !== null && typeof dept === 'string')
          .map((dept, index) => ({
            id: index.toString(),
            name: dept
          }));

        setDepartments(transformedDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        if (error.response?.status === 403) {
          Alert.alert(
            'Authentication Error', 
            'You are not authorized to access this resource. Please login again.'
          );
        } else {
          Alert.alert('Error', 'Failed to load departments. Please try again later.');
        }
      } finally {
        setLoadingDepartments(false);
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
      try {
        setLoadingFaculty(true);
        const response = await api.get(`/faculty?departments=${selectedDepartment}`);
        
        // Transform based on actual API response structure
        const transformedFaculty = Array.isArray(response.data) 
          ? response.data.map((faculty, index) => ({
              id: faculty.id || index.toString(),
              name: faculty.name || `Faculty ${index}`
            }))
          : [];

        setFacultyList(transformedFaculty);
      } catch (error) {
        console.error('Error fetching faculty:', error);
        Alert.alert('Error', 'Failed to load faculty list. Please try again.');
      } finally {
        setLoadingFaculty(false);
      }
    };

    fetchFaculty();
    setSelectedFaculty('');
  }, [selectedDepartment]);

  // Fetch courses when faculty changes
  useEffect(() => {
    if (!selectedFaculty) {
      setCourses([]);
      setSelectedCourse('');
      return;
    }

    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await api.get(`/courses?facultyId=${selectedFaculty}`);
        
        // Transform based on actual API response structure
        const transformedCourses = Array.isArray(response.data) 
          ? response.data.map((course, index) => ({
              id: course.id || index.toString(),
              name: course.name || `Course ${index}`
            }))
          : [];

        setCourses(transformedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        Alert.alert('Error', 'Failed to load courses. Please try again.');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
    setSelectedCourse('');
  }, [selectedFaculty]);

  // Fetch students when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setSelectedStudents([]);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const response = await api.get(`/students?department=${selectedDepartment}&course=${selectedCourse}`);
        
        // Transform based on actual API response structure
        const transformedStudents = Array.isArray(response.data) 
          ? response.data.map((student, index) => ({
              id: student.id || index.toString(),
              name: student.name || `Student ${index}`,
              roll: student.roll || `Roll${index}`,
              department: student.department || selectedDepartment
            }))
          : [];

        setStudents(transformedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        Alert.alert('Error', 'Failed to load students. Please try again.');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
    setSelectedStudents([]);
  }, [selectedCourse, selectedDepartment]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssign = async () => {
    if (!selectedFaculty || !selectedCourse || selectedStudents.length === 0) return;

    setAssigning(true);

    try {
      const payload = {
        facultyId: selectedFaculty,
        courseId: selectedCourse,
        studentIds: selectedStudents, // Changed from assignedRollNums to studentIds
      };

      await api.post('/faculty-student-assigning/admin/assign', payload);

      setIsAssigned(true);
      Alert.alert('Success', 'Students assigned successfully!');

      // Reset form
      setSelectedDepartment('');
      setSelectedFaculty('');
      setSelectedCourse('');
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error assigning students:', error);
      let errorMessage = 'Failed to assign students. Please try again.';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'You are not authorized to perform this action.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  // Render loading indicators when fetching data
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color={COLORS.primary} />
    </View>
  );

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
            
            {loadingDepartments ? (
              renderLoading()
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Department" value="" />
                  {departments.map(dept => (
                    <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                  ))}
                </Picker>
              </View>
            )}

            {selectedDepartment !== '' && (
              <View style={styles.pickerContainer}>
                {loadingFaculty ? (
                  renderLoading()
                ) : facultyList.length > 0 ? (
                  facultyList.map(faculty => (
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
                  ))
                ) : (
                  <Text style={styles.noDataText}>No faculty found for this department</Text>
                )}
              </View>
            )}
          </View>

          {/* Course + Students */}
          <View style={styles.filters}>
            <Text style={styles.selectedText}>Select Course and Students</Text>
            
            {loadingCourses ? (
              renderLoading()
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCourse}
                  onValueChange={setSelectedCourse}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Course" value="" />
                  {courses.map(course => (
                    <Picker.Item key={course.id} label={course.name} value={course.id} />
                  ))}
                </Picker>
              </View>
            )}

            {selectedCourse !== '' && (
              <View>
                {loadingStudents ? (
                  renderLoading()
                ) : students.length > 0 ? (
                  students.map(student => (
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
                          Roll: {student.roll} | Dept: {student.department}
                        </Text>
                      </View>
                      {selectedStudents.includes(student.id) && (
                        <View style={styles.checkmark}>
                          <Check size={20} color={COLORS.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No students found for this course</Text>
                )}
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={styles.selectedCount}>
            <Text style={styles.selectedText}>Assignment Summary</Text>
            {isAssigned ? (
              <Text style={[styles.departmentName, { color: COLORS.success }]}>
                ✅ Assigned Successfully!
              </Text>
            ) : (
              <>
                <Text style={styles.departmentName}>Course: {selectedCourse || 'N/A'}</Text>
                <Text style={styles.departmentName}>
                  Selected Students: {selectedStudents.length}
                </Text>
              </>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.assignButton,
              (assigning || !selectedFaculty || !selectedCourse || selectedStudents.length === 0) &&
                styles.disabledButton,
            ]}
            onPress={handleAssign}
            disabled={assigning || !selectedFaculty || !selectedCourse || selectedStudents.length === 0}
          >
            {assigning ? (
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