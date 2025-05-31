import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Search, Mail, Phone, GraduationCap } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/service/api';

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  phoneNum: string;
  department: string;
  year: string;
  courses: string[];
}

interface AssignedStudentResponse {
  id: {
    staffId: string;
    courseId: string;
  };
  assignedRollNums: string[];
  courseId: string;
  staffId: string;
}

export default function FacultyStudentsScreen() {
  const { authProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!authProfile?.profile?.id) {
        throw new Error('Faculty ID not available');
      }

      // Step 1: Fetch assigned roll numbers
      const response = await api.get<AssignedStudentResponse[]>(
        `/faculty-student-assigning/admin/faculty/${authProfile.profile.id}`
      );

      const rollNumbers = response.data.flatMap((item) => item.assignedRollNums);

      if (rollNumbers.length === 0) {
        setStudents([]);
        return;
      }

      // Step 2: Fetch student info in parallel
      const studentPromises = rollNumbers.map(async (rollNum) => {
        try {
          const res = await api.get(`/profile/student/${rollNum}`);
          return {
            id: rollNum,
            rollNumber: rollNum,
            name: res.data.name || 'N/A',
            email: res.data.email || 'N/A',
            phoneNum: res.data.phoneNum || 'N/A',
            department: res.data.department || 'N/A',
            year: res.data.year ? `${res.data.year} Year` : 'N/A',
            courses: res.data.courses || []
          };
        } catch (error) {
          console.error(`Error fetching student ${rollNum}`, error);
          return null;
        }
      });

      const studentData = await Promise.all(studentPromises);
      const validStudents = studentData.filter((student): student is Student => student !== null);

      setStudents(validStudents);
    } catch (err) {
      console.error('Error loading assigned students', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedStudents();
  }, [authProfile]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: SPACING.md }}>Loading students...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: COLORS.red, marginBottom: SPACING.md }}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAssignedStudents}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Students" />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {filteredStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <GraduationCap size={48} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>No students found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Students will appear here when assigned'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearText}>{item.year}</Text>
                  </View>
                </View>
                
                <View style={styles.studentDetails}>
                  <View style={styles.detailItem}>
                    <Mail size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{item.email}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Phone size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{item.phoneNum}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <GraduationCap size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{item.department}</Text>
                  </View>
                </View>
                
                {item.courses.length > 0 && (
                  <View style={styles.coursesContainer}>
                    <Text style={styles.coursesLabel}>Enrolled Courses:</Text>
                    <View style={styles.coursesList}>
                      {item.courses.map((course, index) => (
                        <View key={index} style={styles.courseBadge}>
                          <Text style={styles.courseBadgeText}>{course}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.studentsList}
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
  studentsList: {
    paddingBottom: 100,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  studentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
  },
  yearBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
  },
  yearText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    color: COLORS.primary,
  },
  studentDetails: {
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  coursesContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.sm,
  },
  coursesLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  coursesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  courseBadge: {
    backgroundColor: `${COLORS.secondary}20`,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
  },
  courseBadgeText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.xs,
    color: COLORS.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
  },
});