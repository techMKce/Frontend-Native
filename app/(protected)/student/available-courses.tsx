import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, FONT, SIZES, SPACING } from '@/constants/theme';
import Header from '@/components/shared/Header';
import CourseCard from '@/components/student/CourseCard';
import { Search } from 'lucide-react-native';
import api from '@/service/api';
import { useFocusEffect } from '@react-navigation/native';

interface BackendCourse {
  course_id: string; // Changed to string to match backend
  courseTitle: string;
  courseDescription: string;
  imageUrl?: string;
  credit: number;
  dept: string;
  duration: string;
  isActive: boolean;
  instructorName: string;
  isEnrolled?: boolean;
}

interface StudentProfile {
  rollNum: string;
  name: string;
  email: string;
}

export default function AvailableCoursesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // Fetch student profile
  const fetchStudentProfile = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/profile/student`);
      setStudentProfile({
        rollNum: response.data.rollNum,
        name: response.data.name,
        email: response.data.email
      });
    } catch (error) {
      // console.error('Error fetching student profile:', error);
      Alert.alert('Error', 'Failed to load student information');
    }
  }, []);

  // Fetch all available courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/course/details');
      const fetchedCourses = response.data;

      // If we have student profile, check enrollment status for each course
      if (studentProfile?.rollNum) {
        const coursesWithEnrollment = await Promise.all(
          fetchedCourses.map(async (course: BackendCourse) => {
            try {
              const enrollmentResponse = await api.get(
                `/api/v1/course-enrollment/check/${course.course_id}/${studentProfile.rollNum}`
              );
              return {
                ...course,
                isEnrolled: enrollmentResponse.data
              };
            } catch (error) {
              console.error('Error checking enrollment status:', error);
              return {
                ...course,
                isEnrolled: false
              };
            }
          })
        );
        setCourses(coursesWithEnrollment);
      } else {
        setCourses(fetchedCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentProfile]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await fetchStudentProfile();
        await fetchCourses();
      };
      loadData();
    }, [fetchStudentProfile, fetchCourses])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  // Handle course enrollment
  const handleEnroll = async (courseId: string) => {
    if (!studentProfile?.rollNum) {
      Alert.alert('Error', 'Student information not available');
      return;
    }

    try {
      setEnrollingCourseId(courseId);
      
      await api.post('/course-enrollment', { 
        courseId: courseId,
        rollNum: studentProfile.rollNum
      });
      
      // Update local state to reflect enrollment
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.course_id === courseId 
            ? { ...course, isEnrolled: true } 
            : course
        )
      );
      
      Alert.alert('Success', 'Successfully enrolled in the course');
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      
      let errorMessage = 'Failed to enroll in course';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request';
        } else if (error.response.status === 401) {
          errorMessage = 'Please login again';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      
      Alert.alert('Enrollment Failed', errorMessage);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const navigateToEnrolledCourses = () => {
    const enrolledCoursesData = courses.filter(course => course.isEnrolled);
    navigation.navigate('EnrolledCourses', { 
      enrolledCourses: enrolledCoursesData,
      studentName: studentProfile?.name 
    });
  };

  // Filter courses based on search query
  const filteredCourses = courses.filter((course) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      course.courseTitle.toLowerCase().includes(searchLower) ||
      course.courseDescription.toLowerCase().includes(searchLower) ||
      course.instructorName.toLowerCase().includes(searchLower) ||
      course.dept.toLowerCase().includes(searchLower)
    );
  });

  return (
    <View style={styles.container}>
      <Header 
        title="Available Courses" 
        rightAction={
          <TouchableOpacity onPress={navigateToEnrolledCourses}>
            <Text style={styles.enrolledLink}>My Courses</Text>
          </TouchableOpacity>
        }
      />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : filteredCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No courses match your search' : 'No courses available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.course_id}
            renderItem={({ item }) => (
              <CourseCard
                course={{
                  id: item.course_id,
                  name: item.courseTitle,
                  description: item.courseDescription,
                  faculty: item.instructorName,
                  credits: item.credit,
                  duration: item.duration,
                  image: item.imageUrl || 'https://images.pexels.com/photos/7095/people-coffee-notes-tea.jpg',
                  enrolled: item.isEnrolled || false
                }}
                showEnrollButton={!item.isEnrolled && item.isActive}
                onEnroll={() => handleEnroll(item.course_id)}
                enrolling={enrollingCourseId === item.course_id}
                disabled={!item.isActive}
              />
            )}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
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
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    paddingVertical: SPACING.md,
  },
  coursesList: {
    paddingBottom: 100,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyStateText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
  },
  enrolledLink: {
    fontFamily: FONT.medium,
    color: COLORS.primary,
    fontSize: SIZES.md,
    marginRight: SPACING.sm,
  },
});