import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '@/service/api';
import SectionCard from './courses/section_card';
import * as Haptics from 'expo-haptics';
import { ToastAndroid } from 'react-native';
import Header from '@/components/shared/Header'; 
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import DateTimePickerModal from "react-native-modal-datetime-picker";


const { height: screenHeight } = Dimensions.get('window');

type CourseDetails = {
  course_id: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  dept: string;
  isActive: boolean;
  duration: string;
  credit: string;
  imageUrl: string;
};

type Section = {
  section_id: string;
  sectionTitle: string;
  sectionDesc: string;
};

type Assignment = {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate?: string;
  file?: string;
  link?: string;
  courseId?: string;
};

type FacultyStackParamList = {
  Assignments: undefined;
  CourseDetails: { id: number };
};

type DisplayCoursesNavigationProp = StackNavigationProp<FacultyStackParamList>;

export default function Displaycourses() {
  const menu = ['Section', 'Assignment', 'Report'];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: null as Date | null,
    link: '',
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
  });
  const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);
  const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(null);

  
  
  const { courseId } = useLocalSearchParams();
  const id = courseId as string; 


  useEffect(() => {
    if (id) {
      fetchCourseDetails();
      if (activeIndex === 1) {
        fetchAssignments();
      }
    }
  }, [id, activeIndex]);

  const fetchCourseDetails = async () => {
  try {
    console.log('Fetching course details for ID:', id);
    setLoading(true);
    
    // Fetch course details
    const courseResponse = await api.get(`/course/detailsbyId?id=${id}`);
    setCourse(courseResponse.data[0]);
    
    // Fetch sections for the course
    const sectionsResponse = await api.get(`/course/section/details?id=${id}`);
    setSections(sectionsResponse.data);
    
  } catch (error) {
    console.log('Error fetching course details:', error);
    setError('Failed to load course details');
  } finally {
    setLoading(false);
  }
};

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assignments/course/${id}`);
      setAssignments(response.data.assignments);
    } catch (error: any) {
      Alert.alert('Error', 'Unable to load assignments: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = (index: React.SetStateAction<number>, item: any) => {
    setActiveIndex(index);
  };

  const renderMenuItem = ({ item, index }: { item: string; index: number }) => {
    const isActive = activeIndex === index;
    return (
      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor: isActive ? '#007BFF' : '#fff',
            borderWidth: 1,
            borderColor: isActive ? '#007BFF' : '#000',
            flex: 1,
            marginLeft: index > 0 ? 10 : 0,
          },
        ]}
        onPress={() => handleMenuPress(index, item)}
      >
        <Text
          style={[
            styles.submitButtonText,
            { color: isActive ? '#fff' : '#000' },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const showBottomSheet = () => {
    if (activeIndex === 0) {
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else if (activeIndex === 1) {
      setAssignmentForm({
        title: '',
        description: '',
        dueDate: null,
        link: '',
      });
      setErrors({
        title: '',
        description: '',
      });
      setModalType('create');
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const hideBottomSheet = () => {
    Animated.spring(slideAnim, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const addSection = async (title: string, description: string, idc: number) => {
    try {
      console.log('Adding section with ID:', course?.course_id);
      setLoading(true);
      const requestBody = {
        sectionTitle: title,
        sectionDesc: description,
        course: { course_id: course?.course_id },
      };

      const response = await api.post('/course/section/add', requestBody);

      if (response.status === 200 || response.status === 201) {
        await fetchCourseDetails();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (Platform.OS === 'android') {
          ToastAndroid.show(
            '✅ Content added successfully!',
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert('Success', 'Content added successfully!');
        }
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log(error);
    } finally {
      setLoading(false);
      setSectionTitle('');
      setSectionDesc('');
      hideBottomSheet();
    }
  };

  const validateAssignmentForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      description: '',
    };

    if (!assignmentForm.title.trim()) {
      newErrors.title = 'Title cannot be empty.';
      isValid = false;
    }
    if (!assignmentForm.description.trim()) {
      newErrors.description = 'Description cannot be empty.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setAssignmentForm({ ...assignmentForm, dueDate: selectedDate });
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDateTime = (date: Date | null): string => {
    if (!date) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
  };

  const createAssignment = async () => {
    if (!validateAssignmentForm()) {
      return;
    }

    try {
      const formData = {
        courseId: id,
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate ? formatDateTime(assignmentForm.dueDate) : undefined,
        resourceLink: assignmentForm.link || '',
      };

      const response = await api.post('/assignments', formData);
      await fetchAssignments();
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Assignment created successfully!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Assignment created successfully!');
      }
      
      hideBottomSheet();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create assignment: ' + (error.response?.data?.message || error.message));
    }
  };

  const editAssignment = async (assignmentId: string) => {
    if (!validateAssignmentForm()) {
      return;
    }

    try {
      const formData = {
        assignmentId,
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate ? formatDateTime(assignmentForm.dueDate) : undefined,
        resourceLink: assignmentForm.link || '',
      };

      const response = await api.put('/assignments', formData);
      await fetchAssignments();
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Assignment updated successfully!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Assignment updated successfully!');
      }
      
      hideBottomSheet();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update assignment: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      setDeletingId(assignmentId);
      await api.delete('/assignments', { params: { assignmentId } });
      setAssignments(prev => prev.filter(a => a.assignmentId !== assignmentId));
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Assignment deleted successfully!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Assignment deleted successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to delete assignment: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
      link: assignment.link || '',
    });
    setModalAssignmentId(assignment.assignmentId);
    setModalType('edit');
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleGradeSubmissions = (assignmentId: string) => {
    router.push({ pathname: '/faculty/assignments/grade', params: { id: assignmentId } });
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header title="Courses Details"/>
      <Text style={styles.courseTitle}>{course?.courseTitle}</Text>
      
      {/* Bottom Sheet Modal */}
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="none"
        onRequestClose={hideBottomSheet}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={hideBottomSheet}
          />

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              {activeIndex === 0 ? (
                <>
                  <View style={styles.bottomSheetHeader}>
                    <View style={styles.dragHandle} />
                    <Text style={styles.bottomSheetTitle}>Add New Section</Text>
                  </View>
                  <ScrollView
                    style={styles.formContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.formGroup}>
                      <Text>Title</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Section Title"
                        value={sectionTitle}
                        onChangeText={setSectionTitle}
                      />
                      <Text>Description</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Section Description"
                        value={sectionDesc}
                        onChangeText={setSectionDesc}
                        multiline
                      />
                      <View style={styles.buttonGroup}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={hideBottomSheet}
                        >
                          <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={() => addSection(sectionTitle, sectionDesc, id)}
                        >
                          <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </>
              ) : (
                <>
                  <View style={styles.bottomSheetHeader}>
                    <View style={styles.dragHandle} />
                    <Text style={styles.bottomSheetTitle}>
                      {modalType === 'create' ? 'Create Assignment' : 'Edit Assignment'}
                    </Text>
                  </View>
                  <ScrollView
                    style={styles.formContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Title *</Text>
                      <TextInput
                        style={[styles.input, errors.title ? styles.inputError : null]}
                        placeholder="Assignment Title"
                        value={assignmentForm.title}
                        onChangeText={(text) => {
                          setAssignmentForm({ ...assignmentForm, title: text });
                          if (text.trim()) setErrors({ ...errors, title: '' });
                        }}
                      />
                      {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
                      
                      <Text style={styles.label}>Description *</Text>
                      <TextInput
                        style={[styles.input, styles.multilineInput, errors.description ? styles.inputError : null]}
                        placeholder="Assignment Description"
                        value={assignmentForm.description}
                        onChangeText={(text) => {
                          setAssignmentForm({ ...assignmentForm, description: text });
                          if (text.trim()) setErrors({ ...errors, description: '' });
                        }}
                        multiline
                      />
                      {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
                      
                      <Text style={styles.label}>Due Date</Text>
                      <TouchableOpacity 
                        style={styles.dateButton}
                        onPress={showDatePickerModal}
                      >
                        <Text>
                          {assignmentForm.dueDate ? 
                            format(assignmentForm.dueDate, 'MMM dd, yyyy HH:mm') : 
                            'Select due date'}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={assignmentForm.dueDate || new Date()}
                          mode="datetime"
                          display="default"
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                        />
                      )}
                      
                      <Text style={styles.label}>Resource Link</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Optional link (https://...)"
                        value={assignmentForm.link}
                        onChangeText={(text) => setAssignmentForm({ ...assignmentForm, link: text })}
                        keyboardType="url"
                      />
                      
                      <View style={styles.buttonGroup}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={hideBottomSheet}
                        >
                          <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveButton}
                          onPress={() => modalType === 'create' ? createAssignment() : 
                                    modalAssignmentId ? editAssignment(modalAssignmentId) : null}
                        >
                          <Text style={styles.buttonText}>
                            {modalType === 'create' ? 'Create' : 'Save'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Banner */}
      <View style={{ position: 'relative' }}>
        <Image style={styles.image} source={{ uri: course?.imageUrl }} />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 10,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', flex: 1 }}>
            {course?.instructorName} ({course?.dept})
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 10,
            }}
          >
            <Text style={{ color: '#fff', marginRight: 3 }}>🕒</Text>
            <Text style={{ color: '#fff', marginRight: 10 }}>
              {course?.duration} Weeks
            </Text>
            <Text style={{ color: '#fff', marginRight: 3 }}>📄</Text>
            <Text style={{ color: '#fff' }}>{course?.credit} credits</Text>
          </View>
        </View>
      </View>
      
      {/* Active Status Button */}
      <TouchableOpacity
        style={{
          alignSelf: 'flex-start',
          backgroundColor: course?.isActive ? '#28a745' : '#dc3545',
          paddingVertical: 4,
          paddingHorizontal: 16,
          borderRadius: 16,
          marginTop: 5,
        }}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          {course?.isActive ? 'Active' : 'Inactive'}
        </Text>
      </TouchableOpacity>
      
      {/* Description */}
      <Text style={styles.description}>{course?.courseDescription}</Text>
      
      {/* Tab Bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <FlatList
          data={menu}
          renderItem={renderMenuItem}
          keyExtractor={(item, index) => String(index)}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          onPress={showBottomSheet}
          style={{
            borderWidth: 2,
            borderColor: '#007BFF',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 15,
            paddingRight: 15,
            borderRadius: 4,
          }}
        >
          <FontAwesome name="plus" color="#007BFF" />
        </TouchableOpacity>
      </View>
      
      {/* Search for Assignments */}
      {activeIndex === 1 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search assignments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}
      
      {/* Content based on active tab */}
      {activeIndex === 0 ? (
        sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-circle-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Sections Found</Text>
            <Text style={styles.emptyStateText}>
              You don't have any sections yet. Create your first section or check back later.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item) => String(item.section_id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <SectionCard
                id={Number(item.section_id)}
                title={item.sectionTitle}
                desc={item.sectionDesc}
                courseId={course?.course_id ? Number(course.course_id):9}
                onrefresh={fetchCourseDetails}
              />
            )}
          />
        )
      ) : activeIndex === 1 ? (
        filteredAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Assignments Found</Text>
            <Text style={styles.emptyStateText}>
              You don't have any assignments yet. Create your first assignment or check back later.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredAssignments}
            keyExtractor={(item) => item.assignmentId}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <Text style={styles.assignmentTitle}>{item.title}</Text>
                  <View style={styles.assignmentActions}>
                    <TouchableOpacity 
                      onPress={() => handleEditAssignment(item)}
                      disabled={deletingId === item.assignmentId}
                    >
                      <MaterialIcons name="edit" size={24} color="#007BFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => deleteAssignment(item.assignmentId)}
                      disabled={deletingId === item.assignmentId}
                    >
                      <MaterialIcons name="delete" size={24} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.assignmentDescription}>
                  {item.description || 'No description provided'}
                </Text>
                {item.dueDate && (
                  <Text style={styles.assignmentDueDate}>
                    Due: {format(new Date(item.dueDate), 'MMM dd, yyyy HH:mm')}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.gradeButton}
                  onPress={() => handleGradeSubmissions(item.assignmentId)}
                >
                  <Text style={styles.gradeButtonText}>Grade Submissions</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyStateTitle}>No Reports Found</Text>
          <Text style={styles.emptyStateText}>
            You don't have any reports yet. Generate your first report or check back later.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
    backgroundColor: '#fff',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
  },
  image: {
    height: 130,
    width: '100%',
    borderRadius: 6,
    marginTop: 8,
  },
  description: {
    marginTop: 8,
    marginLeft: 5,
    marginRight: 5,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 8,
    paddingTop: 8,
    alignItems: 'center',
    marginRight: 2,
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8F9FA',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: 15,
  },
  assignmentDescription: {
    color: '#666',
    marginBottom: 10,
  },
  assignmentDueDate: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  gradeButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  gradeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});