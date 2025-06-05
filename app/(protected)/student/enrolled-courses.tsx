import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { COLORS, FONT, SIZES, SPACING } from '@/constants/theme';
import Header from '@/components/shared/Header';
import CourseCard from '@/components/student/CourseCard';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import api from '@/service/api';
import { useFocusEffect } from '@react-navigation/native';

interface Course {
  id: string;
  name: string;
  description: string;
  faculty: string;
  credits: number;
  duration: string;
  image: string;
  enrolled: boolean;
}

interface StudentCourseInfoDto {
  courseId: string;
  courseName?: string;
  courseDescription?: string;
  instructorName?: string;
  credits?: number;
  duration?: string;
  imageUrl?: string;
}

export default function EnrolledCoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dropModalVisible, setDropModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [droppingCourseId, setDroppingCourseId] = useState<string | null>(null);
  const [rollNum, setRollNum] = useState<string>('');

  
  // First fetch the student's roll number
  const fetchStudentRollNum = async () => {
    try {
      const response = await api.get('/student/profile/${rollnum}'); // Adjust this endpoint to your actual API
      setRollNum(response.data.rollNum);
      return response.data.rollNum;
    } catch (error) {
      console.error('Error fetching student roll number:', error);
      throw error;
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
  setLoading(true);
  const rollNum = await fetchStudentRollNum();
  
  const response = await api.get(`/course-enrollment/by-student/${rollNum}`);
  
  const courses = response.data.map((item: StudentCourseInfoDto) => ({
    id: item.courseId,
    name: item.courseName || 'Unnamed Course',
    description: item.courseDescription || 'No description available',
    faculty: item.instructorName || 'Staff',
    credits: item.credits || 0,
    duration: item.duration || '1 semester',
    image: item.imageUrl || 'https://images.pexels.com/photos/7095/people-coffee-notes-tea.jpg',
    enrolled: true
  }));
  
  setEnrolledCourses(courses);
} catch (error) {
  console.error('Error fetching enrolled courses:', error);
} finally {
  setLoading(false);
}
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEnrolledCourses();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEnrolledCourses();
  };

  const handleDropCourse = (course: Course) => {
    setSelectedCourse(course);
    setDropModalVisible(true);
  };

  const confirmDropCourse = async () => {
    if (!selectedCourse || !rollNum) return;
    
    try {
      setDroppingCourseId(selectedCourse.id);
      // Call API to drop the course
      await api.delete(`/course-enrollment`, {
        data: {
          courseId: selectedCourse.id,
          rollNum: rollNum
        }
      });
      
      // Update local state
      setEnrolledCourses(prev => prev.filter(c => c.id !== selectedCourse.id));
    } catch (error) {
      console.error('Error dropping course:', error);
    } finally {
      setDropModalVisible(false);
      setDroppingCourseId(null);
      setSelectedCourse(null);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Courses" />
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Enrolled Courses</Text>
            {enrolledCourses.length === 0 ? (
              <Text style={styles.emptyStateText}>You have not enrolled in any courses yet.</Text>
            ) : (
              <FlatList
                data={enrolledCourses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <CourseCard
                    course={item}
                    showDropButton
                    onDrop={() => handleDropCourse(item)}
                    dropping={droppingCourseId === item.id}
                  />
                )}
                scrollEnabled={false}
                contentContainerStyle={styles.coursesList}
              />
            )}
          </>
        )}

        {/* Drop Confirmation Modal */}
        <Modal
          visible={dropModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AlertTriangle size={48} color={COLORS.warning} style={styles.warningIcon} />
              <Text style={styles.modalTitle}>Drop Course</Text>
              <Text style={styles.modalText}>
                Are you sure you want to drop {selectedCourse?.name}? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setDropModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.dropButton]}
                  onPress={confirmDropCourse}
                  disabled={droppingCourseId !== null}
                >
                  {droppingCourseId ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.dropButtonText}>Drop Course</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 100 },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  coursesList: { gap: SPACING.md },
  loader: { marginTop: SPACING.xl },
  emptyStateText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  warningIcon: { marginBottom: SPACING.md },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  modalText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: COLORS.background },
  dropButton: { backgroundColor: COLORS.error },
  cancelButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  dropButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});