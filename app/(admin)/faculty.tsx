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
  CreditCard as Edit2,
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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formFaculty, setFormFaculty] = useState<FormFaculty>({
    name: '',
    email: '',
    facultyId: '',
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

  const openEditModal = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setFormFaculty({ ...faculty });
    setIsEditModalVisible(true);
  };

  const validateFacultyForm = (form: FormFaculty): string | null => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.facultyId.trim()) return 'Faculty ID is required';
    if (!form.department.trim()) return 'Department is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email address';
    
    return null;
  };

  const handleAddFaculty = async () => {
    const validationError = validateFacultyForm(formFaculty);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    
    try {
      const facultyData = {
        id: formFaculty.facultyId,
        name: formFaculty.name,
        email: formFaculty.email,
        department: formFaculty.department,
      };

      const response = await api.post('/auth/signup?for=faculty', facultyData);

      if (response.status === 200) {
        const newEntry = {
          ...formFaculty,
          id: formFaculty.facultyId,
          courses: [],
        };

        setFacultyList((prev) => [newEntry, ...prev]);
        setIsAddModalVisible(false);
        resetForm();
        Alert.alert('Success', 'Faculty added successfully');
      }
    } catch (error: any) {
      console.error('Error adding faculty:', error);
      let errorMessage = 'Failed to add faculty';
      
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Faculty already exists';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedFaculty) return;

    const validationError = validateFacultyForm(formFaculty);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.put(`/auth/update/${selectedFaculty.id}`, {
        name: formFaculty.name,
        email: formFaculty.email,
        department: formFaculty.department,
      });

      if (response.status === 200) {
        setFacultyList(prev => 
          prev.map(faculty => 
            faculty.id === selectedFaculty.id ? {...formFaculty, courses: faculty.courses} : faculty
          )
        );
        setIsEditModalVisible(false);
        setSelectedFaculty(null);
        resetForm();
        Alert.alert('Success', 'Faculty updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating faculty:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update faculty');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFaculty = async (id: string, name: string) => {
    Alert.alert(
      'Delete Faculty',
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
              setFacultyList(prev => prev.filter(faculty => faculty.id !== id));
            } catch (error: any) {
              console.error('Error deleting faculty:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete faculty');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const resetForm = () => {
    setFormFaculty({
      name: '',
      email: '',
      facultyId: '',
      department: '',
    });
    setSelectedFaculty(null);
  };

  return (
    <View style={styles.container}>
      <Header title="Faculty Management" />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
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
              resetForm();
              setIsAddModalVisible(true);
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
                    <Text style={styles.facultyId}>ID: {item.facultyId}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(item)}
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

                <View style={styles.coursesContainer}>
                  <Text style={styles.coursesLabel}>Assigned Courses:</Text>
                  <View style={styles.coursesList}>
                    {(item.courses || []).map((course, index) => (
                      <View key={index} style={styles.courseBadge}>
                        <Text style={styles.courseBadgeText}>{course}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.facultyList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No faculty members found</Text>
              </View>
            }
          />
        )}

        {/* Add Faculty Modal */}
        <Modal
          visible={isAddModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => !isLoading && setIsAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Faculty</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formFaculty.name}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, name: text })
                }
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formFaculty.email}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, email: text })
                }
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Faculty ID"
                value={formFaculty.facultyId}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, facultyId: text })
                }
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Department"
                value={formFaculty.department}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, department: text })
                }
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
              />

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
                  onPress={handleAddFaculty}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.addButtonText}>Add Faculty</Text>
                  )}
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
          onRequestClose={() => !isLoading && setIsEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Faculty</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formFaculty.name}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, name: text })
                }
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formFaculty.email}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, email: text })
                }
                placeholderTextColor={COLORS.gray}
                keyboardType="email-address"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Faculty ID"
                value={formFaculty.facultyId}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, facultyId: text })
                }
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Department"
                value={formFaculty.department}
                onChangeText={(text) =>
                  setFormFaculty({ ...formFaculty, department: text })
                }
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => !isLoading && setIsEditModalVisible(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.addButtonModal, isLoading && styles.disabledButton]}
                  onPress={handleSaveEdit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.addButtonText}>Save Changes</Text>
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
    ...SHADOWS.small,
  },
  facultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facultyName: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
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
    ...SHADOWS.small,
  },
  deleteButton: {
    padding: SPACING.xs,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
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
    color: COLORS.darkGray,
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
    color: COLORS.darkGray,
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
    backgroundColor: COLORS.lightGray,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  disabledButton: {
    opacity: 0.6,
  },
});