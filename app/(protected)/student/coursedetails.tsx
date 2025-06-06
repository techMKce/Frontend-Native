import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import api from '@/service/api';
import Header from '@/components/shared/Header';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import StudentProgressDisplay from './StudentprogressDisplay';

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

export default function Displaycourses() {
  const menu = ['Sections', 'Assignments'];
  const [activeIndex, setActiveIndex] = useState(0);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  const studentId = profile?.profile?.id;
  const { courseId } = useLocalSearchParams();
  const id = courseId as string;

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (id && activeIndex === 1) {
      fetchAssignments();
    }
    // eslint-disable-next-line
  }, [activeIndex, id]);

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
    setAssignmentsLoading(true);
    try {
      const response = await api.get(`/assignments/course?courseId=${id}`);
      setAssignments(response.data.assignments);
      console.log('Assignments API response:', response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Unable to load assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewSubmission = (assignmentId: string) => {
    router.push({ pathname: '/student/assignments/submit', params: { assignmentId } });
  };

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
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Course Card */}
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
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: course.isActive ? '#28a745' : '#dc3545',
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <Text style={styles.description}>{course.courseDescription}</Text>
            </View>
          </View>

          {/* Enroll Button */}
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={async () => {
              if (course?.course_id && profile?.profile?.id) {
                try {
                  const response = await api.post('/course-enrollment', {
                    courseId: course.course_id,
                    rollNum: profile.profile.id,
                  });
                  Alert.alert('Success', 'Course enrolled successfully!');
                } catch (error) {
                  Alert.alert('Error', 'Failed to enroll in course.');
                }
              } else {
                Alert.alert(
                  'Error',
                  'Course or profile information is missing.'
                );
              }
            }}
          >
            <Text style={styles.enrollButtonText}>Enroll</Text>
          </TouchableOpacity>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <StudentProgressDisplay courseId={id} studentId={studentId || ''} />
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            {menu.map((item, idx) => (
              <TouchableOpacity
                key={item}
                style={[styles.tab, activeIndex === idx && styles.activeTab]}
                onPress={() => setActiveIndex(idx)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeIndex === idx && styles.activeTabText,
                  ]}
                >
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
                  <View className="emptyIconContainer">
                    <Ionicons
                      name="library-outline"
                      size={60}
                      color="#007BFF"
                    />
                  </View>
                  <Text style={styles.emptyStateTitle}>No Sections Yet</Text>
                  <Text style={styles.emptyStateText}>
                    No sections available for this course yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.sectionList}>
                  {sections.map((section, index) => (
                    <View key={section.section_id} style={styles.sectionCard}>
                      <View style={styles.sectionHeader}>
                        <View style={styles.sectionNumber}>
                          <Text style={styles.sectionNumberText}>
                            {index + 1}
                          </Text>
                        </View>
                        <View style={styles.sectionContent}>
                          <Text style={styles.sectionTitle}>
                            {section.sectionTitle}
                          </Text>
                          <Text style={styles.sectionDesc}>
                            {section.sectionDesc}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Assignments Tab */}
          {activeIndex === 1 && (
            <View style={styles.tabContent}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#999"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search assignments..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {assignmentsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007BFF" />
                  <Text style={styles.loadingText}>Loading assignments...</Text>
                </View>
              ) : filteredAssignments.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={60}
                      color="#007BFF"
                    />
                  </View>
                  <Text style={styles.emptyStateTitle}>No Assignments Yet</Text>
                  <Text style={styles.emptyStateText}>
                    No assignments available for this course yet.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredAssignments}
                  keyExtractor={(item) => item.assignmentId}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.assignmentCard}
                      onPress={() =>
                        router.push({
                          pathname: '/student/assignments/submit',
                          params: { assignmentId: item.assignmentId },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.assignmentHeader}>
                        <View style={styles.assignmentInfo}>
                          <Text style={styles.assignmentTitle}>
                            {item.title}
                          </Text>
                          {item.description && (
                            <Text style={styles.assignmentDescription}>
                              {item.description}
                            </Text>
                          )}
                          {item.dueDate && (
                            <View style={styles.dueDateContainer}>
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color="#dc3545"
                              />
                              <Text style={styles.assignmentDueDate}>
                                Due:{' '}
                                {format(
                                  new Date(item.dueDate),
                                  'MMM dd, yyyy HH:mm'
                                )}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.actionButton}>
                          <FontAwesome
                            name="arrow-right"
                            size={20}
                            color="#007BFF"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}
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
  enrollButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginBottom: 10,
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
    marginBottom: 16,
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
});