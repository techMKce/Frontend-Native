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
import api from '@/service/api'; // Your configured Axios instance
import { COLORS, SPACING, FONT, SIZES, SHADOWS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import Header from '@/components/shared/Header';
import { useAuth } from '@/hooks/useAuth';


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
  const { profile } = useAuth();
  const studentId = profile?.profile?.id;
  const navigation = useNavigation<any>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);



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
  const fetchEnrolledCourses = async () => {
    if (!studentId) return;
    try {
      const response = await api.get(`course-enrollment/by-student/${studentId}`);
      const data: Course[] = response.data;
      setEnrolledCourses(data);
      console.log(enrolledCourses)
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, [studentId]);

  useEffect(() => {
    fetchCourses();
  }, []);

  
  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = courses.filter(course =>
      course.courseTitle.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCourses(filtered);
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



  const renderCourse = ({ item }: { item: Course }) => (
    console.log(`Rendering course: ${item.course_id}`),
  <TouchableOpacity 
    style={styles.courseCard}
    onPress={() => router.push(`/student/coursedetails?courseId=${item.course_id}`)}
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
  </TouchableOpacity>
);
console.log(enrolledCourses[0])
// console.log(filteredCourses)

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
        </View>

        <FlatList
          data={filteredCourses.filter(course => 
  enrolledCourses.some(enrolledId => course.course_id == String(enrolledId))
)}

            // data={
            // enrolledCourses.map(course => ({
            //   ...course,

            //   course_id: enrolledCourses.includes()
            // }))
            // }
            renderItem={renderCourse}
            keyExtractor={(item) => item.course_id}
            style={styles.coursesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              No enrolled courses found
            </Text>
          )}
        />
      </View>

      
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