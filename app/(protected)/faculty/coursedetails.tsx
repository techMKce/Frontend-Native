import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '@/service/api';
import SectionCard from './courses/section_card';
import * as Haptics from 'expo-haptics';
import { ToastAndroid } from 'react-native';
import Header from '@/components/shared/Header';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FileUploader, { FileInfo } from '@/components/FileUploader';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

// Elegant Popup Component
const ElegantPopup = ({
  visible,
  onClose,
  title,
  children,
  animationType = 'slide',
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade';
}) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [visible, animationType]);

  if (!visible) return null;

  const handleBackdropPress = () => {
    Haptics.selectionAsync();
    onClose();
  };

  return (
    <View style={styles.popupOverlay}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.popupBackdrop,
            { opacity: fadeAnim }
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.popupContainer,
          animationType === 'slide'
            ? { transform: [{ translateY: slideAnim }] }
            : {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
        ]}
      >
        <View style={styles.popupHeader}>
          <View style={styles.popupHandle} />
          <View style={styles.popupTitleContainer}>
            <Text style={styles.popupTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.popupContent}
        >
          {children}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

// Custom Input Component
const CustomInput = ({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  icon,
  ...props
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  icon?: string;
  [key: string]: any;
}) => (
  <View style={styles.inputContainer}>
    {icon && (
      <Ionicons
        name={icon as any}
        size={20}
        color="#007BFF"
        style={styles.inputIcon}
      />
    )}
    <TextInput
      style={[
        styles.customInput,
        multiline && styles.multilineInput,
        icon && styles.inputWithIcon
      ]}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  </View>
);

// Custom Button Component
const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: string;
}) => {
  const buttonStyle = [
    styles.customButton,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'danger' && styles.dangerButton,
    disabled && styles.disabledButton,
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'secondary' && styles.secondaryButtonText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={18}
          color={variant === 'secondary' ? '#007BFF' : '#fff'}
          style={styles.buttonIcon}
        />
      )}
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default function Displaycourses() {
  const menu = ['Sections', 'Assignments', 'Report'];
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSectionPopup, setShowSectionPopup] = useState(false);
  const [showAssignmentPopup, setShowAssignmentPopup] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: null as Date | null,
    link: '',
  });

  const { courseId } = useLocalSearchParams();
  const id = courseId as string;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
      if (activeIndex === 1) fetchAssignments();
    }
  }, [id, activeIndex]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const courseResponse = await api.get(`/course/detailsbyId?id=${id}`);
      setCourse(courseResponse.data[0]);
      const sectionsResponse = await api.get(`/course/section/details?id=${id}`);
      setSections(sectionsResponse.data);
    } catch (error) {
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/assignments/course?courseId=${id}`);
      setAssignments(response.data.assignments);
    } catch (error: any) {
      Alert.alert('Error', 'Unable to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = async () => {
    if (!assignmentForm.title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Error', 'Title is required');
    }

    if (!assignmentForm.dueDate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Error', 'Due date is required');
    }

    try {
      setLoading(true);
      const formData = new FormData();

      formData.append('courseId', id);
      formData.append('title', assignmentForm.title);
      formData.append('description', assignmentForm.description || '');
      formData.append('dueDate', format(assignmentForm.dueDate, "yyyy-MM-dd'T'HH:mm:ss"));
      formData.append('resourceLink', assignmentForm.link || '');

      if (files.length > 0) {
        const file = files[0];
        formData.append('file', {
          uri: file.uri,
          name: file.name || 'assignment_file.pdf',
          type: file.type || 'application/pdf',
        } as any);
      }

      const response = await api.post('/assignments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchAssignments();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      ToastAndroid.show('Assignment created!', ToastAndroid.SHORT);

      setShowAssignmentPopup(false);
      setAssignmentForm({
        title: '',
        description: '',
        dueDate: null,
        link: ''
      });
      setFiles([]);
    } catch (error: any) {
      console.error('Assignment error:', error.response?.data || error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create assignment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAssignmentForm({ ...assignmentForm, dueDate: selectedDate });
    }
  };

  const handleTabPress = (index: number) => {
    Haptics.selectionAsync();
    setActiveIndex(index);
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeIndex === 0) {
      setShowSectionPopup(true);
    } else {
      setShowAssignmentPopup(true);
    }
  };

  // Add Section Handler
  const addSection = async () => {
    if (!sectionTitle.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert('Error', 'Section title is required');
    }
    try {
      setLoading(true);
      await api.post('/course/section', {
        courseId: id,
        sectionTitle,
        sectionDesc,
      });
      await fetchCourseDetails();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      ToastAndroid.show('Section created!', ToastAndroid.SHORT);
      setShowSectionPopup(false);
      setSectionTitle('');
      setSectionDesc('');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create section. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <Header title="Course Details" />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {!loading && course && (
        <>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.courseCard}>
              <Image style={styles.image} source={{ uri: course.imageUrl }} />
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>{course.courseTitle}</Text>
                <Text style={styles.instructor}>
                  👨‍🏫 {course.instructorName} • {course.dept}
                </Text>
                <View style={styles.courseMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color="#007BFF" />
                    <Text style={styles.metaText}>{course.duration} Weeks</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="school-outline" size={16} color="#007BFF" />
                    <Text style={styles.metaText}>{course.credit} Credits</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: course.isActive ? '#28a745' : '#dc3545' }
                  ]}>
                    <Text style={styles.statusText}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.description}>{course.courseDescription}</Text>
              </View>
            </View>

            {/* Enhanced Tab Bar */}
            <View style={styles.tabBar}>
              {menu.map((item, idx) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.tab, activeIndex === idx && styles.activeTab]}
                  onPress={() => handleTabPress(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tabText,
                    activeIndex === idx && styles.activeTabText
                  ]}>
                    {item}
                  </Text>
                  {activeIndex === idx && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Sections Tab */}
            {activeIndex === 0 && (
              <View style={styles.tabContent}>
                {sections.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="library-outline" size={60} color="#007BFF" />
                    </View>
                    <Text style={styles.emptyStateTitle}>No Sections Yet</Text>
                    <Text style={styles.emptyStateText}>
                      Create your first section to organize course content and get started.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.sectionList}>
                    {sections.map((section, index) => (
                      <Animated.View
                        key={section.section_id}
                        style={[
                          styles.sectionCard,
                          {
                            opacity: 1,
                            transform: [{ translateY: 0 }]
                          }
                        ]}
                      >
                        <View style={styles.sectionHeader}>
                          <View style={styles.sectionNumber}>
                            <Text style={styles.sectionNumberText}>{index + 1}</Text>
                          </View>
                          <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{section.sectionTitle}</Text>
                            <Text style={styles.sectionDesc}>{section.sectionDesc}</Text>
                          </View>
                        </View>
                        <SectionCard
                          id={Number(section.section_id)}
                          title={section.sectionTitle}
                          desc={section.sectionDesc}
                          courseId={course?.course_id ? Number(course.course_id) : 0}
                          onrefresh={fetchCourseDetails}
                        />
                      </Animated.View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Assignments Tab */}
            {activeIndex === 1 && (
              <View style={styles.tabContent}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search assignments..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {assignments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="document-text-outline" size={60} color="#007BFF" />
                    </View>
                    <Text style={styles.emptyStateTitle}>No Assignments Yet</Text>
                    <Text style={styles.emptyStateText}>
                      Create your first assignment to engage students with coursework.
                    </Text>
                  </View>
                ) : (
                  <View>
                    {assignments
                      .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item, index) => (
                        <TouchableOpacity
                          key={item.assignmentId}
                          style={styles.assignmentCard}
                          activeOpacity={0.85}
                          onPress={() => router.push(`/faculty/assignments/grade?id=${item.assignmentId}`)}
                        >
                          <View style={styles.assignmentHeader}>
                            <View style={styles.assignmentInfo}>
                              <Text style={styles.assignmentTitle}>{item.title}</Text>
                              {item.description && (
                                <Text style={styles.assignmentDescription}>
                                  {item.description}
                                </Text>
                              )}
                              {item.dueDate && (
                                <View style={styles.dueDateContainer}>
                                  <Ionicons name="calendar-outline" size={14} color="#dc3545" />
                                  <Text style={styles.assignmentDueDate}>
                                    Due: {format(new Date(item.dueDate), 'MMM dd, yyyy HH:mm')}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.assignmentActions}>
                              <TouchableOpacity style={styles.actionButton}>
                                <MaterialIcons name="edit" size={20} color="#007BFF" />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.actionButton}>
                                <MaterialIcons name="delete" size={20} color="#dc3545" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    }
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Enhanced Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.8}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Section Popup */}
      <ElegantPopup
        visible={showSectionPopup}
        onClose={() => setShowSectionPopup(false)}
        title="Create New Section"
        animationType="slide"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <CustomInput
            placeholder="Enter section title"
            value={sectionTitle}
            onChangeText={setSectionTitle}
            icon="library-outline"
          />

          <CustomInput
            placeholder="Enter section description (optional)"
            value={sectionDesc}
            onChangeText={setSectionDesc}
            multiline={true}
            icon="document-text-outline"
          />

          <View style={styles.popupActions}>
            <CustomButton
              title="Cancel"
              onPress={() => setShowSectionPopup(false)}
              variant="secondary"
              icon="close-outline"
            />
            <CustomButton
              title="Create Section"
              onPress={addSection}
              variant="primary"
              disabled={loading}
              icon="add-outline"
            />
          </View>
        </ScrollView>
      </ElegantPopup>

      {/* Add Assignment Popup */}
      <ElegantPopup
        visible={showAssignmentPopup}
        onClose={() => setShowAssignmentPopup(false)}
        title="Create New Assignment"
        animationType="slide"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <CustomInput
            placeholder="Enter assignment title"
            value={assignmentForm.title}
            onChangeText={text => setAssignmentForm({ ...assignmentForm, title: text })}
            icon="clipboard-outline"
          />

          <CustomInput
            placeholder="Enter assignment description (optional)"
            value={assignmentForm.description}
            onChangeText={text => setAssignmentForm({ ...assignmentForm, description: text })}
            multiline={true}
            icon="document-text-outline"
          />

          <CustomInput
            placeholder="Resource link (optional)"
            value={assignmentForm.link}
            onChangeText={text => setAssignmentForm({ ...assignmentForm, link: text })}
            icon="link-outline"
          />

          {/* Due Date Picker */}
          <TouchableOpacity
            style={[styles.customInput, { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={20} color="#007BFF" style={{ marginRight: 10 }} />
            <Text style={{ color: assignmentForm.dueDate ? '#1a1a1a' : '#999', fontSize: 16 }}>
              {assignmentForm.dueDate
                ? format(assignmentForm.dueDate, 'MMM dd, yyyy HH:mm')
                : 'Select due date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={assignmentForm.dueDate || new Date()}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.fileUploaderContainer}>
            <Text style={styles.sectionLabel}>Attach Files</Text>
            <FileUploader files={files} onFilesSelected={setFiles} />
          </View>

          <View style={styles.popupActions}>
            <CustomButton
              title="Cancel"
              onPress={() => setShowAssignmentPopup(false)}
              variant="secondary"
              icon="close-outline"
            />
            <CustomButton
              title="Create Assignment"
              onPress={addAssignment}
              variant="primary"
              disabled={loading}
              icon="add-outline"
            />
          </View>
        </ScrollView>
      </ElegantPopup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  courseCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  image: {
    height: 200,
    width: '100%',
  },
  courseInfo: {
    padding: 20,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  instructor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 4,
    height: 3,
    width: 30,
    backgroundColor: '#007BFF',
    borderRadius: 2,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  sectionList: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  sectionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 16,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignmentDueDate: {
    fontSize: 13,
    color: '#dc3545',
    fontWeight: '500',
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Popup Styles
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.85,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  popupHeader: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  popupHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  popupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupContent: {
    padding: 24,
    maxHeight: screenHeight * 0.6,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  customInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  fileUploaderContainer: {
    marginBottom: 20,
  },

  // Button Styles
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#007BFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007BFF',
    elevation: 1,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007BFF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  popupActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
});