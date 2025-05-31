import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, FONT, SIZES, SPACING } from '@/constants/theme';
import Header from '@/components/shared/Header';
import CourseCard, { Course } from '@/components/student/CourseCard';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';

// Initial mock data
const mockEnrolledCourses: Course[] = [];
const mockAvailableCourses: Course[] = [
  {
    id: '1',
    name: 'Introduction to Computer Science',
    description: 'Basics of computer science, algorithms, and programming.',
    faculty: 'Dr. John Smith',
    credits: 4,
    duration: '16 weeks',
    image: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg',
    enrolled: false,
  },
  {
    id: '2',
    name: 'Artificial Intelligence',
    description: 'AI concepts, machine learning, and neural networks.',
    faculty: 'Prof. Michael Lee',
    credits: 4,
    duration: '16 weeks',
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
    enrolled: false,
  },
  {
    id: '3',
    name: 'Data Structures',
    description: 'Arrays, stacks, queues, linked lists, and trees.',
    faculty: 'Prof. Jane Doe',
    credits: 3,
    duration: '12 weeks',
    image: 'https://images.pexels.com/photos/2566581/pexels-photo-2566581.jpeg',
    enrolled: false,
  },
];

export default function CoursesScreen() {
  const [loading, setLoading] = useState(false);
  const [dropModalVisible, setDropModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState(mockEnrolledCourses);
  const [availableCourses, setAvailableCourses] = useState(mockAvailableCourses);

  const handleEnrollCourse = (course: Course) => {
    setAvailableCourses(prev => prev.filter(c => c.id !== course.id));
    setEnrolledCourses(prev => [...prev, { ...course, enrolled: true }]);
  };

  const handleDropCourse = (course: Course) => {
    setSelectedCourse(course);
    setDropModalVisible(true);
  };

  const confirmDropCourse = () => {
    if (selectedCourse) {
      setEnrolledCourses(prev => prev.filter(c => c.id !== selectedCourse.id));
      setAvailableCourses(prev => [...prev, { ...selectedCourse, enrolled: false }]);
    }
    setDropModalVisible(false);
    setSelectedCourse(null);
  };

  return (
    <View style={styles.container}>
      <Header title="My Courses" />
      <ScrollView contentContainerStyle={styles.content}>
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
                  />
                )}
                scrollEnabled={false}
                contentContainerStyle={styles.coursesList}
              />
            )}

            <Text style={styles.sectionTitle}>Available Courses</Text>
            {availableCourses.length === 0 ? (
              <Text style={styles.emptyStateText}>No more courses available to enroll.</Text>
            ) : (
              <FlatList
                data={availableCourses}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <CourseCard
                    course={item}
                    showEnrollButton
                    onEnroll={() => handleEnrollCourse(item)}
                  />
                )}
                scrollEnabled={false}
                contentContainerStyle={styles.coursesList}
              />
            )}
          </>
        )}

        {/* Drop Modal */}
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
                >
                  <Text style={styles.dropButtonText}>Drop Course</Text>
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
