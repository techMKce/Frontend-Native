import React, { useState, useEffect } from 'react';
import api from '@/service/api';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
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
  Search,
  Plus,
  Mail,
  GraduationCap,
  Trash2,
  Edit2,
} from 'lucide-react-native';

export default function StudentManagementScreen() {
  const [studentList, setStudentList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [newStudent, setNewStudent] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: '',
    year: '',
  });

  // Fetch students on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/auth/students/all');
        if (response.data) {
          const studentData = response.data.map((student) => ({
            rollNumber: student.id,
            name: student.name,
            email: student.email,
            department: student.department,
            year: student.year,
          }));
          setStudentList(studentData);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        Alert.alert('Error', 'Failed to fetch students');
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = studentList.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveStudent = async () => {
    if (
      !newStudent.name.trim() ||
      !newStudent.email.trim() ||
      !newStudent.rollNumber.trim() ||
      !newStudent.department.trim() ||
      !newStudent.year.trim()
    ) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    try {
      if (isEditMode) {
        // Update existing student

        const studentData = {
          id: newStudent.rollNumber,
          name: newStudent.name,
          email: newStudent.email,
          department: newStudent.department,
          year: newStudent.year,
        };
        const response = await api.put(`/auth/update/${editStudentId}`, studentData);
        if (response.status === 200) {
          setStudentList((prev) =>
            prev.map((student) =>
              student.rollNumber === editStudentId ? response.data : student
            )
          );
          Alert.alert('Success', 'Student updated successfully');
        } 
      } else {
        // Add new student
        const studentData = {
          id: newStudent.rollNumber,
          name: newStudent.name,
          email: newStudent.email,
          department: newStudent.department,
          year: newStudent.year,
        };

        const response = await api.post('/auth/signup?for=student', studentData);
        if (response.status === 200) {
          setStudentList((prev) => [response.data, ...prev]);
          Alert.alert('Success', 'Student added successfully');
        }
      }

      setIsAddModalVisible(false);
      setNewStudent({
        rollNumber: '',
        name: '',
        email: '',
        department: '',
        year: '',
      });
      setIsEditMode(false);
      setEditStudentId(null);
    } catch (error) {
      console.error('Error saving student:', error);
      let errorMessage = 'Failed to save student';

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Student already exists';
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteStudent = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/auth/delete/${id}`);
              setStudentList((prev) => prev.filter((student) => student.rollNumber !== id));
            } catch (error) {
              console.error('Error deleting student:', error);
              Alert.alert('Error', 'Failed to delete student');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Student Management" />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setIsAddModalVisible(true);
              setIsEditMode(false);
              setNewStudent({
                rollNumber: '',
                name: '',
                email: '',
                department: '',
                year: '',
              });
            }}
          >
            <Plus size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.rollNumber}
          renderItem={({ item }) => (
            <View style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentSubText}>Roll No: {item.rollNumber}</Text>
                  <Text style={styles.studentSubText}>Year: {item.year}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setNewStudent({
                        rollNumber: item.rollNumber,
                        name: item.name,
                        email: item.email,
                        department: item.department,
                        year: item.year,
                      });
                      setIsEditMode(true);
                      setEditStudentId(item.rollNumber);
                      setIsAddModalVisible(true);
                    }}
                  >
                    <Edit2 size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStudent(item.rollNumber)}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.studentDetails}>
                <View style={styles.detailItem}>
                  <Mail size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.email}</Text>
                </View>

                <View style={styles.detailItem}>
                  <GraduationCap size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.department}</Text>
                </View>

              </View>
            </View>
          )}
          contentContainerStyle={styles.studentList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students found</Text>
          }
        />

        <Modal
          visible={isAddModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Student' : 'Add New Student'}
              </Text>

              {['rollNumber', 'name', 'email', 'department', 'year'].map(
                (field) => (
                  <TextInput
                    key={field}
                    style={styles.input}
                    placeholder={
                      field === 'password' && isEditMode 
                        ? 'Leave blank to keep current password' 
                        : field.charAt(0).toUpperCase() + field.slice(1)
                    }
                    value={newStudent[field]}
                    onChangeText={(text) =>
                      setNewStudent((prev) => ({ ...prev, [field]: text }))
                    }
                    placeholderTextColor={COLORS.gray}
                    secureTextEntry={field === 'password'}
                    keyboardType={field === 'year' ? 'numeric' : 'default'}
                  />
                )
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButtonModal]}
                  onPress={handleSaveStudent}
                >
                  <Text style={styles.addButtonText}>
                    {isEditMode ? 'Save Changes' : 'Add Student'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    flex: 1, 
    padding: SPACING.md 
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  searchIcon: { 
    position: 'absolute', 
    left: SPACING.md, 
    zIndex: 1 
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    ...SHADOWS.small,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
    ...SHADOWS.small,
  },
  studentList: { 
    paddingBottom: 100 
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.lg,
    color: COLORS.gray,
    fontFamily: FONT.regular,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  studentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  studentSubText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  actionButtons: { 
    flexDirection: 'row', 
    gap: SPACING.sm 
  },
  editButton: { 
    padding: SPACING.xs 
  },
  deleteButton: { 
    padding: SPACING.xs 
  },
  studentDetails: { 
    marginTop: SPACING.sm 
  },
  detailItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.xs 
  },
  detailText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  cancelButton: { 
    backgroundColor: COLORS.background 
  },
  addButtonModal: { 
    backgroundColor: COLORS.primary 
  },
  cancelButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  addButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});