import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '@/service/api';

type Course = {
  id: string;
  name: string;
  description: string;
  duration: string;
  instructor: string;
  category: string;
  credits: string;
  students?: number;
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
    id: '',
    name: '',
    description: '',
    duration: '',
    instructor: '',
    category: '',
    credits: '',
    students: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('course/details');
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredCourses(courses);
      return;
    }
    try {
      const response = await api.get(`/courses/filtercourse?courseTitle=${text}`);
      setFilteredCourses(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const openModal = () => {
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
    setIsModalVisible(true);
  };

  const handleAddOrEditCourse = async () => {
  const preparedCourse = {
    ...newCourse,
    credits: Number(newCourse.credits || 0),
    duration: Number(newCourse.duration || 0),
    students: newCourse.students || 0,
  };

  try {
    if (isEditing) {
      await api.put('/course/update', preparedCourse);
    } else {
      await api.post('/courses', preparedCourse);
    }

    await fetchCourses();

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
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleEdit = (course: Course) => {
    setIsModalVisible(true);
    setIsEditing(true);
    setNewCourse(course);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`course/details?ids=${id}`);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <View style={styles.courseCard}>
      <Text style={styles.courseTitle}>{item.name}</Text>
      <Text>{item.description}</Text>
      <Text>Instructor: {item.instructor}</Text>
      <Text>Duration: {item.duration} weeks</Text>
      <Text>Credits: {item.credits}</Text>
      <Text>Category: {item.category}</Text>
      <View style={styles.buttonRow}>
        <Button title="View" onPress={() => navigation.navigate('CourseDetail', { course: item })} />
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Course Management</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search courses..."
        value={search}
        onChangeText={handleSearch}
      />
      <Button title="Add New Course" onPress={openModal} />
      <FlatList
        data={search ? filteredCourses : courses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No courses found.</Text>}
        refreshing={loading}
        onRefresh={fetchCourses}
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Course' : 'Add New Course'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newCourse.name}
              onChangeText={(text) => setNewCourse({ ...newCourse, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newCourse.description}
              onChangeText={(text) => setNewCourse({ ...newCourse, description: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Instructor"
              value={newCourse.instructor}
              onChangeText={(text) => setNewCourse({ ...newCourse, instructor: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={newCourse.category}
              onChangeText={(text) => setNewCourse({ ...newCourse, category: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (weeks)"
              value={newCourse.duration}
              keyboardType="numeric"
              onChangeText={(text) => setNewCourse({ ...newCourse, duration: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Credits"
              keyboardType="numeric"
              value={newCourse.credits}
              onChangeText={(text) => setNewCourse({ ...newCourse, credits: text })}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.button} onPress={handleAddOrEditCourse}>
                <Text style={styles.buttonText}>
                  {isEditing ? 'Update Course' : 'Add Course'}
                </Text>
              </Pressable>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
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
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 16,
    borderRadius: 5,
  },
  courseCard: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
  },
  modalContent: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
