
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Search, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { BASE_URL } from '@/service/api';

// Define interfaces (unchanged)
interface Assignment {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate: string;
  courseId: string;
  status: string;
  grade: string | null;
  fileNo: string | null;
  feedback: string | null;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentName: string;
  studentRollNumber: string;
  fileId: string;
  submittedAt: string;
}

interface Grading {
  id: string;
  assignmentId: string;
  studentRollNumber: string;
  grade: string;
  feedback: string;
  gradedAt: string;
}

export default function StudentAssignmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<{ [key: string]: Submission | null }>({});
  const [gradings, setGradings] = useState<{ [key: string]: Grading | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //const BASE_URL = 'https://assignmentservice-2a8o.onrender.com/api';
  const studentRollNumber = 'STU123';

  // Make fetchAssignmentsAndData reusable with useCallback
  const fetchAssignmentsAndData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all assignments
      const assignmentResponse = await fetch(`${BASE_URL}/assignments/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!assignmentResponse.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const assignmentData = await assignmentResponse.json();
      const fetchedAssignments: Assignment[] = assignmentData.assignments || [];
      setAssignments(fetchedAssignments);

      // Fetch submissions and gradings
      const submissionMap: { [key: string]: Submission | null } = {};
      const gradingMap: { [key: string]: Grading | null } = {};

      for (const assignment of fetchedAssignments) {
        // Fetch submissions
        const submissionResponse = await fetch(
          `${BASE_URL}/submissions?assignmentId=${assignment.assignmentId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          const studentSubmission = submissionData.submissions.find(
            (sub: Submission) => sub.studentRollNumber === studentRollNumber
          );
          submissionMap[assignment.assignmentId] = studentSubmission || null;
        } else {
          submissionMap[assignment.assignmentId] = null;
        }

        // Fetch gradings
        const gradingResponse = await fetch(
          `${BASE_URL}/gradings?assignmentId=${assignment.assignmentId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (gradingResponse.ok) {
          const gradingData = await gradingResponse.json();
          const studentGrading = gradingData.gradings.find(
            (grade: Grading) => grade.studentRollNumber === studentRollNumber
          );
          gradingMap[assignment.assignmentId] = studentGrading || null;
        } else {
          gradingMap[assignment.assignmentId] = null;
        }
      }

      setSubmissions(submissionMap);
      setGradings(gradingMap);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAssignmentsAndData();
  }, [fetchAssignmentsAndData]);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAssignmentsAndData();
    }, [fetchAssignmentsAndData])
  );

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.courseId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssignmentStatus = (assignment: Assignment) => {
    const grading = gradings[assignment.assignmentId];
    if (grading && grading.grade) {
      return 'graded';
    }
    const hasSubmission = submissions[assignment.assignmentId] !== null;
    return hasSubmission ? 'submitted' : 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return COLORS.darkGray;
      case 'submitted':
        return COLORS.success;
      case 'graded':
        return COLORS.primary;
      default:
        return COLORS.darkGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Submit';
      case 'submitted':
        return 'Resubmit';
      case 'graded':
        return 'Graded';
      default:
        return 'View';
    }
  };

  const handleAssignmentAction = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment);
    const isOverdue = new Date(assignment.dueDate) < new Date();

    if (status === 'submitted') {
      router.push({
        pathname: '/assignments/resubmit',
        params: { id: assignment.assignmentId },
      });
    } else if (status === 'pending') {
      if (isOverdue) {
        router.push({
          pathname: '/assignments/overdue',
          params: {
            id: assignment.assignmentId,
            title: assignment.title,
            courseId: assignment.courseId,
            dueDate: assignment.dueDate,
          },
        });
      } else {
        router.push({
          pathname: '/assignments/submit',
          params: { id: assignment.assignmentId },
        });
      }
    }
  };

  const renderAssignmentCard = ({ item }: { item: Assignment }) => {
    const status = getAssignmentStatus(item);
    const grading = gradings[item.assignmentId];
    const displayGrade = grading?.grade || item.grade;
    const displayFeedback = grading?.feedback || item.feedback;

    return (
      <View style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <View>
            <Text style={styles.assignmentName}>{item.title}</Text>
            <Text style={styles.courseName}>{item.courseId}</Text>
          </View>
          {displayGrade && (
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{displayGrade}</Text>
            </View>
          )}
        </View>

        <View style={styles.dueDateContainer}>
          <Calendar size={16} color={COLORS.gray} />
          <Text style={styles.dueDate}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
          {new Date(item.dueDate) < new Date() && status === 'pending' && (
            <View style={styles.overdueContainer}>
              <AlertCircle size={16} color={COLORS.error} />
              <Text style={styles.overdueText}>Overdue</Text>
            </View>
          )}
        </View>

        {item.fileNo && (
          <Text style={styles.metaInfo}>
            <Text style={styles.metaLabel}>File: </Text>
            {item.fileNo}
          </Text>
        )}

        {displayFeedback && (
          <Text style={styles.metaInfo}>
            <Text style={styles.metaLabel}>Feedback: </Text>
            {displayFeedback}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: getStatusColor(status) },
            status === 'graded' && styles.disabledButton,
          ]}
          onPress={() => handleAssignmentAction(item)}
          disabled={status === 'graded'}
        >
          <Text style={styles.actionButtonText}>
            {getStatusText(status)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Assignments" />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Assignments" />
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Assignments" />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assignments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentCard}
          keyExtractor={(item) => item.assignmentId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

// Styles remain unchanged
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
    ...SHADOWS.small,
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
  listContainer: {
    paddingBottom: 100,
  },
  assignmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  assignmentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  courseName: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  gradeBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  gradeText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.primary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dueDate: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  overdueText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  metaInfo: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  metaLabel: {
    fontFamily: FONT.semiBold,
    color: COLORS.darkGray,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    minHeight: 40,
  },
  actionButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  errorText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});