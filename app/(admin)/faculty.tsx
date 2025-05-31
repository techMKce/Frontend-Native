import React, { useState } from 'react';
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
import axios from 'axios';
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
  CreditCard as Edit2,
} from 'lucide-react-native';

// Base URL for your API
// const API_BASE_URL = 'http://localhost:8084/api/v1/auth'; // Replace with your actual backend URL

// const mockFaculty = [
//   {
//     id: '1',
//     name: 'Dr. John Smith',
//     email: 'john.smith@university.edu',
//     facultyId: 'F001',
//     department: 'Computer Science',
//     designation: 'Professor',
//     courses: ['Advanced Database Systems', 'Web Development'],
//   },
//   {
//     id: '2',
//     name: 'Dr. Sarah Wilson',
//     email: 'sarah.wilson@university.edu',
//     facultyId: 'F002',
//     department: 'Computer Science',
//     designation: 'Associate Professor',
//     courses: ['Machine Learning', 'Artificial Intelligence'],
//   },
// ];

export default function FacultyManagementScreen() {
  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formFaculty, setFormFaculty] = useState({
    //id: '',
    name: '',
    email: '',
    facultyId: '',
    department: '',
  });

  const filteredFaculty = facultyList.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open Edit Modal and populate form with selected faculty data
  const openEditModal = (faculty) => {
    setSelectedFaculty(faculty);
    setFormFaculty({ ...faculty });
    setIsEditModalVisible(true);
  };

  // Handle Add new faculty - Now connected to backend
  const handleAddFaculty = async () => {

    console.log('Starting faculty addition...'); // Debug log
    console.log('Form data:', formFaculty);

    if (
      !formFaculty.name.trim() ||
      !formFaculty.email.trim() ||
    //  !formFaculty.id.trim() ||
      !formFaculty.facultyId.trim() ||
      !formFaculty.department.trim() 
    ) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const facultyData = {
        facultyId: formFaculty.id,
        name: formFaculty.name,
        email: formFaculty.email,
        department: formFaculty.department,
        
        // Your backend might not need designation, or it might be handled differently
      };
      console.log('Data being sent to backend:', facultyData);

      const response = await api.post(`/auth/signup?for=faculty`,
  facultyData
);


      if (response.status === 200) {
        // If successful, add to local state
        const newEntry = {
          ...formFaculty,
          id: formFaculty.id, // Using facultyId as the ID
          courses: [],
        };

        setFacultyList((prev) => [newEntry, ...prev]);
        setIsAddModalVisible(false);
        resetForm();
        Alert.alert('Success', 'Faculty added successfully');
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      let errorMessage = 'Failed to add faculty';
      
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Faculty already exists';
        } else {
          errorMessage = error.response.data || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Edit faculty save
  const handleSaveEdit = () => {
    if (
      !formFaculty.name.trim() ||
      !formFaculty.email.trim() ||
      !formFaculty.id.trim() ||
      !formFaculty.department.trim() 
    ) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }

    setFacultyList((prev) =>
      prev.map((faculty) =>
        faculty.id === selectedFaculty.id ? formFaculty : faculty
      )
    );
    setIsEditModalVisible(false);
    setSelectedFaculty(null);
    resetForm();
  };

  // Delete faculty
  const handleDeleteFaculty = (id, name) => {
    Alert.alert(
      'Delete Faculty',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setFacultyList((prev) => prev.filter((faculty) => faculty.id !== id));
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Reset form
  const resetForm = () => {
    setFormFaculty({
      id: '',
      name: '',
      email: '',
      // facultyId: '',
      department: '',
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Faculty Management" />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="  Search faculty..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setIsAddModalVisible(true);
            }}
          >
            <Plus size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredFaculty}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.facultyCard}>
              <View style={styles.facultyHeader}>
                <View>
                  <Text style={styles.facultyName}>{item.name}</Text>
                  <Text style={styles.facultyId}>ID: {item.facultyId}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Edit2 size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteFaculty(item.id, item.name)}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.facultyDetails}>
                <View style={styles.detailItem}>
                  <Mail size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.email}</Text>
                </View>

                <View style={styles.detailItem}>
                  <GraduationCap size={16} color={COLORS.gray} />
                  <Text style={styles.detailText}>{item.department}</Text>
                </View>
              </View>

              <View style={styles.coursesContainer}>
                <Text style={styles.coursesLabel}>Assigned Courses:</Text>
                <View style={styles.coursesList}>
                  {item.courses.map((course, index) => (
                    <View key={index} style={styles.courseBadge}>
                      <Text style={styles.courseBadgeText}>{course}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.facultyList}
        />

        {/* Add Faculty Modal */}
        <Modal
          visible={isAddModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Faculty</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formFaculty.name}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, name: text })}
                placeholderTextColor={COLORS.gray}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formFaculty.email}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, email: text })}
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                placeholder="Faculty ID"
                value={formFaculty.facultyId}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, facultyId: text })}
                placeholderTextColor={COLORS.gray}
              />

              <TextInput
                style={styles.input}
                placeholder="Department"
                value={formFaculty.department}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, department: text })}
                placeholderTextColor={COLORS.gray}
              />

              {/* <TextInput
                style={styles.input}
                placeholder="Designation"
                value={formFaculty.designation}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, designation: text })}
                placeholderTextColor={COLORS.gray}
              /> */}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButtonModal]}
                  onPress={handleAddFaculty}
                >
                  <Text style={styles.addButtonText}>Add Faculty</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Faculty Modal */}
        <Modal
          visible={isEditModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Faculty</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formFaculty.name}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, name: text })}
                placeholderTextColor={COLORS.gray}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formFaculty.email}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, email: text })}
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                placeholder="Faculty ID"
                value={formFaculty.facultyId}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, facultyId: text })}
                placeholderTextColor={COLORS.gray}
              />

              <TextInput
                style={styles.input}
                placeholder="Department"
                value={formFaculty.department}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, department: text })}
                placeholderTextColor={COLORS.gray}
              />

              <TextInput
                style={styles.input}
                placeholder="Designation"
                value={formFaculty.designation}
                onChangeText={(text) => setFormFaculty({ ...formFaculty, designation: text })}
                placeholderTextColor={COLORS.gray}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditModalVisible(false);
                    setSelectedFaculty(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButtonModal]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.addButtonText}>Save Changes</Text>
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
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  searchIcon: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 1,
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
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  facultyList: {
    paddingBottom: SPACING.lg,
  },
  facultyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  facultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facultyName: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.text,
  },
  designation: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
    marginTop: 2,
  },
  facultyId: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  editButton: {
    padding: SPACING.xs,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  deleteButton: {
    padding: SPACING.xs,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    ...SHADOWS.light,
  },
  facultyDetails: {
    marginTop: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  detailText: {
    marginLeft: SPACING.xs,
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  coursesContainer: {
    marginTop: SPACING.md,
  },
  coursesLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  coursesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  courseBadge: {
    backgroundColor: `${COLORS.secondary}20`,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
  },
  courseBadgeText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.secondary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    marginBottom: SPACING.md,
    color: COLORS.text,
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
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.grayLight,
    marginRight: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
  },
  addButtonModal: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
  },
});
