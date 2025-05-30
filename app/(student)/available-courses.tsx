import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONT, SIZES, SPACING } from '@/constants/theme';
import Header from '@/components/shared/Header';
import CourseCard, { Course } from '@/components/student/CourseCard';
import { Search } from 'lucide-react-native';

let mockCourses: Course[] = [
  {
    id: '1',
    name: 'Introduction to Computer Science',
    description:
      'A foundational course covering the basics of computer science, algorithms, and programming concepts.',
    faculty: 'Dr. John Smith',
    credits: 4,
    duration: '16 weeks',
    image: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg',
    sections: [
      {
        title: 'Course Overview',
        description:
          'Get a comprehensive introduction to the world of computer science. Learn fundamental concepts and build a strong foundation for future studies.',
      },
      {
        title: 'What You Will Learn',
        description:
          'Understand algorithms, data structures, and programming paradigms. Develop problem-solving skills and learn to design efficient solutions.',
      },
        ],
  },
];

export default function AvailableCoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]); // course ids
  const [getAxiosValue, setAxiosValue] = useState<Course[]>([])

  useEffect(() => {
    axios.get('https://6835376fcd78db2058c098e8.mockapi.io/api/course')
      .then(res => {
        setAxiosValue(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []); 
  mockCourses = mockCourses.map(({ sections, ...rest }) => rest);
  const handleEnroll = (courseId: string) => {
    setEnrollingCourseId(courseId);
    setTimeout(() => {
      setEnrolledCourses((prev) => [...prev, courseId]);
      setEnrollingCourseId(null);
    }, 1000);
  };
  const filteredCourses = mockCourses.filter(
    (course) =>course
      // course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // course.faculty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header title="Available Courses" />
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
            <Text style={styles.emptyStateText}>No courses found matching your search.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CourseCard
                course={{ ...item, enrolled: enrolledCourses.includes(item.id) }}
                showEnrollButton={!enrolledCourses.includes(item.id)}
                onEnroll={() => handleEnroll(item.id)}
              />
            )}
            contentContainerStyle={styles.coursesList}
            showsVerticalScrollIndicator={false}
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
});