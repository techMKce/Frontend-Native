import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // <-- Import Picker
import api from '@/service/api'; // Your configured Axios instance
import { COLORS, SPACING, FONT, SIZES, SHADOWS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import Header from '@/components/shared/Header';

type Course = {
  course_id: string;
  courseTitle: string;
  courseDescription: string;
  duration: string;
  instructorName: string;
  dept: string;
  credit: string;
  students: number;
  imgurl: string;
  status: 'Active' | 'Inactive';
};

const Courses = () => {
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCourse, setNewCourse] = useState<Course>({
    course_id: '',
    courseTitle: '',
    courseDescription: '',
    duration: '',
    instructorName: '',
    dept: '',
    credit: '',
    students: 0,
    imgurl: '',
    status: 'Active',
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/course/details'); // Backend endpoint
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, []);

  const openModal = () => {
    setIsEditing(false);
    setNewCourse({
      course_id: '',
      courseTitle: '',
      courseDescription: '',
      duration: '',
      instructorName: '',
      dept: '',
      credit: '',
      students: 0,
      imgurl: '',
      status: 'Active',
    });
    setIsModalVisible(true);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = courses.filter(course =>
      course.courseTitle.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const handleAddOrEditCourse = async () => {
    const preparedCourse = {
      ...newCourse,
      credit: Number(newCourse.credit || 0),
      duration: Number(newCourse.duration || 0),
      students: newCourse.students || 0,
    };

    try {
      if (isEditing) {
        await api.put('/course/update', preparedCourse);
      } else {
        await api.post('/course/add', preparedCourse);
      }
      await fetchCourses();
      setIsModalVisible(false);
      setIsEditing(false);
      setNewCourse({
        course_id: '',
        courseTitle: '',
        courseDescription: '',
        duration: '',
        instructorName: '',
        dept: '',
        credit: '',
        students: 0,
        imgurl: '',
        status: 'Active',
      });
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleEdit = (course: Course) => {
    setIsModalVisible(true);
    setIsEditing(true);
    setNewCourse(course);
  };

  const fetchActiveCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/course/active'); // Active courses endpoint
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch active courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCourses();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/course/delete?course_id=${id}`);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const disableCourse = async (course_id: string) => {
    try {
      await api.put('/course/disable', { course_id });
      alert('Course disabled successfully');
      fetchCourses(); // Refresh the course list after disabling
    } catch (error) {
      console.error('Failed to disable course:', error);
    }
  };

  const renderCourse = ({ item }: { item: Course }) => (
    console.log(`Rendering course: ${item.course_id}`),
  <TouchableOpacity 
    style={styles.courseCard}
    onPress={() => router.push(`/faculty/coursedetails?courseId=${item.course_id}`)}
  >
    <Text style={styles.courseName}>{item.courseTitle}</Text>
    <Text style={styles.courseDescription}>{item.courseDescription}</Text>
    <Text style={styles.courseDescription}>Instructor: {item.instructorName}</Text>
    <View style={styles.courseStats}>
      <View style={styles.statItem}>
        <Ionicons name="time-outline" size={16} color={COLORS.gray} />
        <Text style={styles.statText}>{item.duration} weeks</Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="book-outline" size={16} color={COLORS.gray} />
        <Text style={styles.statText}>{item.credit} credits</Text>
      </View>
    </View>
    <View style={styles.cardButtons}>
      <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
        <Text style={{ color: COLORS.primary }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.course_id)}>
        <Text style={{ color: 'red' }}>Delete</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

  return (
    <View style={styles.container}>
      <Header title="Courses" />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} style={styles.searchIcon} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={search}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.addButton} onPress={openModal}>
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={search ? filteredCourses : courses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.course_id}
          refreshing={loading}
          onRefresh={fetchCourses}
          contentContainerStyle={styles.coursesList}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No courses found.</Text>}
        />
      </View>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Course' : 'Add New Course'}</Text>

            {/* Render text inputs for all fields except 'status' */}
            {['courseTitle', 'courseDescription', 'instructorName', 'dept', 'duration', 'credit', 'imgurl'].map((field) => (
              <TextInput
                key={field}
                style={styles.input}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                keyboardType={field === 'duration' || field === 'credit' ? 'numeric' : 'default'}
                value={newCourse[field as keyof Course]?.toString() || ''}
                onChangeText={(text) => setNewCourse({ ...newCourse, [field]: text })}
              />
            ))}

            {/* Dropdown for status */}
            <Text style={{ marginBottom: 4, fontFamily: FONT.medium }}>Status</Text>
            <Picker
              selectedValue={newCourse.status}
              onValueChange={(itemValue) => setNewCourse({ ...newCourse, status: itemValue })}
              style={styles.input}
            >
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Inactive" value="Inactive" />
            </Picker>

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.addButtonModal]} onPress={handleAddOrEditCourse}>
                <Text style={styles.addButtonText}>
                  {isEditing ? 'Update Course' : 'Add Course'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Courses;

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
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
    ...SHADOWS.small,
  },
  coursesList: {
    paddingBottom: 100,
  },
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  courseName: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    marginBottom: SPACING.xs,
  },
  courseDescription: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    marginLeft: 4,
    color: COLORS.gray,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  editButton: {
    marginHorizontal: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: COLORS.gray,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
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
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
    marginRight: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontFamily: FONT.medium,
  },
  addButtonModal: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
  },
});