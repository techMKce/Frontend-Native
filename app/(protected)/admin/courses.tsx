import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, Trash, X } from 'lucide-react-native';
import { COLORS, FONT, SIZES } from '@/constants/theme';
import Header from '@/components/shared/Header';
import api from '@/service/api';

interface Course {
  id: number;
  code: string | null;
  title: string;
  description: string;
  instructor: string;
  department: string;
  isActive: boolean;
  credit?: number;
  duration?: string;
  imageUrl?: string;
}

export default function CoursesManagementScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/course/details');
      const validatedCourses = response.data.map((course: any) => ({
        id: course.course_id,
        code: course.courseCode,
        title: course.courseTitle || 'No title',
        description: course.courseDescription || 'No description',
        instructor: course.instructorName || 'Unknown instructor',
        department: course.dept || 'No department',
        isActive: course.isActive || false,
        credit: course.credit,
        duration: course.duration,
        imageUrl: course.imageUrl,
      }));
      setCourses(validatedCourses);
    } catch (err: any) {
      console.error('Failed to fetch courses:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load courses. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseStatus = async (id: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessingId(id);
    const originalCourses = [...courses];

    try {
      // Find the current course
      const courseToUpdate = courses.find((c) => c.id === id);
      if (!courseToUpdate) return;

      // Optimistic UI update
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
      );

      // Make API call to update status - using the backend's /toggle endpoint
      await api.put(`/course/toggle/${id}`);

      // Refresh the list to ensure consistency
      await fetchCourses();
    } catch (err: any) {
      console.error('Failed to update course status:', err);
      // Revert UI on error
      setCourses(originalCourses);

      let errorMessage = 'Failed to update course status. Please try again.';
      if (err.response) {
        if (err.response.status === 500) {
          errorMessage = 'Server error occurred while updating status.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingId(null);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/course/delete?course_id=${id}`);
              setCourses((prev) => prev.filter((c) => c.id !== id));
              Alert.alert('Success', 'Course deleted successfully');
            } catch (err: any) {
              console.error('Failed to delete course:', err);
              Alert.alert(
                'Error',
                err.response?.data?.message ||
                  'Failed to delete course. Please try again.'
              );
              fetchCourses();
            }
          },
        },
      ]
    );
  };

  const filteredCourses = courses.filter((c) => {
    const search = searchQuery.toLowerCase();
    return (
      (c.title || '').toLowerCase().includes(search) ||
      (c.instructor || '').toLowerCase().includes(search) ||
      (c.department || '').toLowerCase().includes(search) ||
      (c.code || '').toLowerCase().includes(search) ||
      (c.id.toString() || '').includes(search)
    );
  });

  const renderCourseCard = ({ item }: { item: Course }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Course ID:</Text>
        <Text style={styles.cardValue}>{item.id}</Text>
      </View>
      {item.code && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Course Code:</Text>
          <Text style={styles.cardValue}>{item.code}</Text>
        </View>
      )}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Title:</Text>
        <Text style={styles.cardValue}>{item.title}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Description:</Text>
        <Text style={styles.cardValue}>{item.description}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Instructor:</Text>
        <Text style={styles.cardValue}>{item.instructor}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Department:</Text>
        <Text style={styles.cardValue}>{item.department}</Text>
      </View>
      <View
        style={[
          styles.cardRow,
          { justifyContent: 'space-between', marginTop: 12 },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.cardLabel}>Status:</Text>
          <Switch
            style={{ marginLeft: 8 }}
            value={item.isActive}
            onValueChange={() => toggleCourseStatus(item.id)}
            disabled={isProcessing && processingId === item.id}
            thumbColor={item.isActive ? COLORS.primary : COLORS.gray}
            trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
          />
          {isProcessing && processingId === item.id && (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteCourse(item.id)}
          disabled={isProcessing}
        >
          <Trash size={24} color={isProcessing ? COLORS.lightGray : COLORS.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Courses Management" />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Courses Management" />
        <View
          style={[
            styles.content,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text
            style={{
              color: COLORS.error,
              fontFamily: FONT.medium,
              fontSize: SIZES.md,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Courses Management" />
      <View style={styles.content}>
        <Text style={styles.title}>All Courses</Text>
        {/* <Text style={styles.subtitle}>List of all available courses</Text> */}

        <View style={styles.searchRow}>
          <Search size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {filteredCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No courses found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCourseCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
          />
        )}
      </View>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  cardLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
    width: 110,
  },
  cardValue: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONT.medium,
    color: COLORS.gray,
    fontSize: SIZES.md,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
  },
});