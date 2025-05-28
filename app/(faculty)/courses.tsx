import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import {
  Plus,
  Search,
  Users,
  Clock,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const initialCourses = [
  {
    id: '1',
    name: 'Advanced Database Systems',
    description: 'Advanced concepts in database management and design',
    students: 30,
    duration: '16 weeks',
    instructor: 'Mr.Ram',
    category: 'CS',
    credits: 4,
  },
  {
    id: '2',
    name: 'Web Development',
    description: 'Modern web development techniques and frameworks',
    students: 25,
    duration: '12 weeks',
    instructor: 'Mr.Kumar',
    category: 'CT',
    credits: 3,
  },
];

export default function FacultyCoursesScreen() {
  const router = useRouter();

  const [courses, setCourses] = useState(initialCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCourse, setNewCourse] = useState({
    id: '',
    name: '',
    description: '',
    duration: '',
    instructor: '',
    category: '',
    credits: '',
    students: 0,
  });

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddOrEditCourse = () => {
    const preparedCourse = {
      ...newCourse,
      credits: Number(newCourse.credits),
      students: newCourse.students || 0,
    };

    if (isEditing) {
      // Update existing course
      setCourses((prev) =>
        prev.map((course) =>
          course.id === preparedCourse.id ? preparedCourse : course
        )
      );
    } else {
      // Add new course
      const newId = (Math.random() * 100000).toFixed(0);
      setCourses((prev) => [...prev, { ...preparedCourse, id: newId }]);
    }
    setIsModalVisible(false);
    setIsEditing(false);
    setNewCourse({
      id: '',
      name: '',
      description: '',
      duration: '',
      instructor: '',
      category: '',
      credits: '',
      students: 0,
    });
  };
  interface Course {
    id: string;
    name: string;
    description: string;
    students: number;
    duration: string;
    instructor: string;
    category: string;
    credits: number;
  }

  const handleEdit = (course: Course) => {
    setNewCourse({
      ...course,
      credits: course.credits.toString(),
    });
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setCourses((prev) => prev.filter((course) => course.id !== id));
  };

  return (
    <View style={styles.container}>
        <Header title="My Courses" />

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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setIsModalVisible(true);
                setIsEditing(false);
                setNewCourse({
                  id: '',
                  name: '',
                  description: '',
                  duration: '',
                  instructor: '',
                  category: '',
                  credits: '',
                  students: 0,
                });
              }}
            >
              <Plus size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.courseCard}>
                <TouchableOpacity
                  onPress={() => router.push('/(faculty)/coursedetails')}
                >
                  <Text style={styles.courseName}>{item.name}</Text>
                  <Text style={styles.courseDescription}>
                    {item.description}
                  </Text>

                  <View style={styles.courseStats}>
                    <View style={styles.statItem}>
                      <Users size={16} color={COLORS.gray} />
                      <Text style={styles.statText}>
                        {item.students} Students
                      </Text>
                    </View>

                    <View style={styles.statItem}>
                      <Clock size={16} color={COLORS.gray} />
                      <Text style={styles.statText}>{item.duration}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <FileText size={16} color={COLORS.gray} />
                      <Text style={styles.statText}>
                        {item.credits} Credits
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View style={styles.cardButtons}>
                  <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={styles.editButton}
                  >
                    <Edit size={20} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.coursesList}
          />

          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Course' : 'Add New Course'}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Course Name"
                  value={newCourse.name}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, name: text })
                  }
                  placeholderTextColor={COLORS.gray}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  value={newCourse.description}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, description: text })
                  }
                  placeholderTextColor={COLORS.gray}
                  multiline
                />

                <TextInput
                  style={styles.input}
                  placeholder="Duration (e.g., 16 weeks)"
                  value={newCourse.duration}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, duration: text })
                  }
                  placeholderTextColor={COLORS.gray}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Instructor Name"
                  value={newCourse.instructor}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, instructor: text })
                  }
                  placeholderTextColor={COLORS.gray}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Category"
                  value={newCourse.category}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, category: text })
                  }
                  placeholderTextColor={COLORS.gray}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Credits"
                  value={newCourse.credits}
                  onChangeText={(text) =>
                    setNewCourse({ ...newCourse, credits: text })
                  }
                  placeholderTextColor={COLORS.gray}
                  keyboardType="numeric"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.addButtonModal]}
                    onPress={handleAddOrEditCourse}
                  >
                    <Text style={styles.addButtonText}>
                      {isEditing ? 'Save Changes' : 'Add Course'}
                    </Text>
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
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  courseDescription: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: 6,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
  },
  editButton: {
    marginRight: SPACING.md,
  },
  deleteButton: {},

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.xl,
    marginBottom: SPACING.md,
    color: COLORS.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    marginRight: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
  addButtonModal: {
    backgroundColor: COLORS.primary,
  },
  addButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
});
