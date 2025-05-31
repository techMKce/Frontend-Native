import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Search, Plus, CreditCard as Edit2, Trash2, Download } from 'lucide-react-native';
import { router } from 'expo-router';

// Mock data for assignments
const mockAssignments = [
  {
    id: '1',
    title: 'Database Design Project',
    dueDate: '2024-04-15',
    submittedCount: 25,
    gradedCount: 15,
    totalStudents: 30,
  },
  {
    id: '2',
    title: 'Algorithm Analysis',
    dueDate: '2024-04-20',
    submittedCount: 18,
    gradedCount: 10,
    totalStudents: 30,
  },
];

export default function AssignmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateAssignment = () => {
    router.push('/assignments/create');
  };

  const handleEditAssignment = (id: string) => {
    router.push({ pathname: '/assignments/edit', params: { id } });
  };

  const handleDeleteAssignment = (id: string) => {
    // Implement delete logic
    console.log('Delete assignment:', id);
  };

  const handleGradeSubmissions = (id: string) => {
    router.push({ pathname: '/assignments/grade', params: { id } });
  };

  const filteredAssignments = mockAssignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header title="Assignments" />
      
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAssignment}
          >
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.assignmentsList}>
          {filteredAssignments.map((assignment) => (
            <View key={assignment.id} style={styles.assignmentCard}>
              <View style={styles.assignmentHeader}>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleEditAssignment(assignment.id)}
                  >
                    <Edit2 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Trash2 size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.assignmentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {assignment.submittedCount}/{assignment.totalStudents}
                    </Text>
                    <Text style={styles.statLabel}>Submitted</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {assignment.gradedCount}/{assignment.submittedCount}
                    </Text>
                    <Text style={styles.statLabel}>Graded</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.gradeButton}
                  onPress={() => handleGradeSubmissions(assignment.id)}
                >
                  <Text style={styles.gradeButtonText}>Grade Submissions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
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
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginLeft: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  createButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.white,
  },
  assignmentsList: {
    flex: 1,
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
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  assignmentTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.xs,
  },
  assignmentDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginRight: SPACING.xs,
  },
  detailValue: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.primary,
  },
  statLabel: {
    fontFamily: FONT.regular,
    fontSize: SIZES.xs,
    color: COLORS.gray,
  },
  gradeButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  gradeButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});