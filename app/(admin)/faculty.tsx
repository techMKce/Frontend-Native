import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '@/service/api';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import {
  Search,
  Plus,
  Mail,
  GraduationCap,
  Trash2,
  Edit2,
} from 'lucide-react-native';

interface Faculty {
  id: string;
  name: string;
  email: string;
  facultyId: string;
  department: string;
  courses: string[];
}

interface FormFaculty {
  name: string;
  email: string;
  facultyId: string;
  department: string;
  id?: string;
  courses?: string[];
}

export default function FacultyManagementScreen() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFacultyId, setEditFacultyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    facultyId: '',
    name: '',
    email: '',
    department: '',
  });

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/auth/faculty/all');
        const facultyData = response.data.map((faculty: any) => ({
          id: faculty.id || faculty.facultyId,
          name: faculty.name,
          email: faculty.email,
          facultyId: faculty.facultyId,
          department: faculty.department,
          courses: faculty.courses || [],
        }));
        setFacultyList(facultyData);
      } catch (error) {
        console.error('Error fetching faculty:', error);
        Alert.alert('Error', 'Failed to load faculty data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  const filteredFaculty = facultyList.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateFacultyForm = (form: FormFaculty): string | null => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.facultyId.trim()) return 'Faculty ID is required';
    if (!form.department.trim()) return 'Department is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address';
    
    return null;
  };

  const handleSaveFaculty = async () => {
    const validationError = validateFacultyForm(newFaculty);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditMode) {
        // Update existing faculty
        const facultyData = {
          name: newFaculty.name,
          email: newFaculty.email,
          department: newFaculty.department,
        };

        const response = await api.put(`/auth/update/${editFacultyId}`, facultyData);
        if (response.status === 200) {
          setFacultyList((prev) =>
            prev.map((faculty) =>
              faculty.id === editFacultyId ? { ...faculty, ...facultyData } : faculty
            )
          );
          Alert.alert('Success', 'Faculty updated successfully');
        }
      } else {
        // Add new faculty
        const facultyData = {
          id: newFaculty.facultyId,
          name: newFaculty.name,
          email: newFaculty.email,
          department: newFaculty.department,
        };

        const response = await api.post('/auth/signup?for=faculty', facultyData);
        if (response.status === 200) {
          setFacultyList((prev) => [{ ...facultyData, courses: [] }, ...prev]);
          Alert.alert('Success', 'Faculty added successfully');
        }
      }

      setIsAddModalVisible(false);
      setNewFaculty({
        facultyId: '',
        name: '',
        email: '',
        department: '',
      });
      setIsEditMode(false);
      setEditFacultyId(null);
    } catch (error: any) {
      console.error('Error saving faculty:', error);
      let errorMessage = 'Failed to save faculty';

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Faculty already exists';
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFaculty = async (id: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.delete(`/auth/delete/${id}`);
              setFacultyList((prev) => prev.filter((faculty) => faculty.id !== id));
            } catch (error) {
              console.error('Error deleting faculty:', error);
              Alert.alert('Error', 'Failed to delete faculty');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Faculty Management" />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIconContainer}>
            <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search faculty..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setIsAddModalVisible(true);
              setIsEditMode(false);
              setNewFaculty({
                facultyId: '',
                name: '',
                email: '',
                department: '',
              });
            }}
            disabled={isLoading}
          >
            <Plus size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {isLoading && facultyList.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredFaculty}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.facultyCard}>
                <View style={styles.facultyHeader}>
                  <View>
                    <Text style={styles.facultyName}>{item.name}</Text>
                    <View style={styles.idContainer}>
                      <Text style={styles.idLabel}>ID: </Text>
                      <Text style={styles.facultyId}>{item.id}</Text>
                    </View>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setNewFaculty({
                          facultyId: item.facultyId,
                          name: item.name,
                          email: item.email,
                          department: item.department,
                        });
                        setIsEditMode(true);
                        setEditFacultyId(item.id);
                        setIsAddModalVisible(true);
                      }}
                      disabled={isLoading}
                    >
                      <Edit2 size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFaculty(item.id, item.name)}
                      disabled={isLoading}
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
              </View>
            )}
            contentContainerStyle={styles.facultyList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No faculty members found</Text>
            }
          />
        )}

        <Modal
          visible={isAddModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => !isLoading && setIsAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Faculty' : 'Add New Faculty'}
              </Text>

              {['facultyId', 'name', 'email', 'department'].map(
                (field) => (
                  <TextInput
                    key={field}
                    style={styles.input}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={newFaculty[field]}
                    onChangeText={(text) =>
                      setNewFaculty((prev) => ({ ...prev, [field]: text }))
                    }
                    placeholderTextColor={COLORS.gray}
                    editable={!isLoading}
                    keyboardType={field === 'email' ? 'email-address' : 'default'}
                  />
                )
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => !isLoading && setIsAddModalVisible(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButtonModal, isLoading && styles.disabledButton]}
                  onPress={handleSaveFaculty}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.addButtonText}>
                      {isEditMode ? 'Save Changes' : 'Add Faculty'}
                    </Text>
                  )}
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
  searchIconContainer: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 1,
    padding: SPACING.xs,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingLeft: SPACING.xxl,
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
  facultyList: { 
    paddingBottom: 100 
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.lg,
    color: COLORS.gray,
    fontFamily: FONT.regular,
  },
  facultyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  facultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  facultyName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idLabel: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  facultyId: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
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
  facultyDetails: { 
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});