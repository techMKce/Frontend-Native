import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { Search, Plus, Trash } from 'lucide-react-native';
import { COLORS, FONT, SIZES } from '@/constants/theme';
import Header from '@/components/shared/Header';

const mockCourses = [
  { id: 'CS101', name: 'Intro to CS', faculty: 'Dr. Smith', enabled: true },
  { id: 'MATH201', name: 'Calculus II', faculty: 'Prof. Johnson', enabled: true },
  { id: 'PHYS101', name: 'Physics', faculty: 'Dr. Brown', enabled: false },
  { id: 'ENG102', name: 'English', faculty: 'Prof. Davis', enabled: true },
];

export default function CoursesManagementScreen() {
  const [courses, setCourses] = useState(mockCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Fields for new course
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');

  const toggleCourseStatus = (id: string) => {
    setCourses(prev =>
      prev.map(c => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleDeleteCourse = (id: string) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setCourses(prev => prev.filter(c => c.id !== id)),
        },
      ]
    );
  };

  const resetNewCourseFields = () => {
    setNewCourseId('');
    setNewCourseName('');
    setNewFacultyName('');
  };

  const addCourse = () => {
    // Validate inputs
    if (!newCourseId.trim() || !newCourseName.trim() || !newFacultyName.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Check if course ID already exists
    if (courses.find(c => c.id.toLowerCase() === newCourseId.trim().toLowerCase())) {
      Alert.alert('Error', 'Course ID already exists');
      return;
    }

    const newCourse = {
      id: newCourseId.trim(),
      name: newCourseName.trim(),
      faculty: newFacultyName.trim(),
      enabled: true,
    };

    setCourses(prev => [newCourse, ...prev]);
    resetNewCourseFields();
    setModalVisible(false);
  };

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.faculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCourseCard = ({ item }: { item: typeof mockCourses[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Course ID:</Text>
        <Text style={styles.cardValue}>{item.id}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Course Name:</Text>
        <Text style={styles.cardValue}>{item.name}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Faculty:</Text>
        <Text style={styles.cardValue}>{item.faculty}</Text>
      </View>
      <View style={[styles.cardRow, { justifyContent: 'space-between', marginTop: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.cardLabel}>Status:</Text>
          <Switch
            style={{ marginLeft: 8 }}
            value={item.enabled}
            onValueChange={() => toggleCourseStatus(item.id)}
            thumbColor={item.enabled ? COLORS.primary : COLORS.gray}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
          />
        </View>
        <TouchableOpacity onPress={() => handleDeleteCourse(item.id)}>
          <Trash size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Courses Management" />
      <View style={styles.content}>
        <Text style={styles.title}>All Courses</Text>
        <Text style={styles.subtitle}>List of all courses created by faculty</Text>

        <View style={styles.searchRow}>
          <Search size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Plus size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredCourses}
          keyExtractor={item => item.id}
          renderItem={renderCourseCard}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </View>

      {/* Add Course Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Course</Text>

            <TextInput
              placeholder="Course ID"
              value={newCourseId}
              onChangeText={setNewCourseId}
              style={styles.modalInput}
              autoCapitalize="characters"
              maxLength={10}
            />
            <TextInput
              placeholder="Course Name"
              value={newCourseName}
              onChangeText={setNewCourseName}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Faculty Name"
              value={newFacultyName}
              onChangeText={setNewFacultyName}
              style={styles.modalInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.gray }]}
                onPress={() => {
                  resetNewCourseFields();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                onPress={addCourse}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, flex: 1 },
  title: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONT.regular,
    color: COLORS.gray,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
    width: 100,
  },
  cardValue: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: SIZES.md,
    fontFamily: FONT.regular,
    marginBottom: 12,
    color: COLORS.darkGray,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
  },
});
