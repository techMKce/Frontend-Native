import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Calendar, Link, Upload } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CreateAssignmentScreen() {
  const [assignment, setAssignment] = useState({
    title: '',
    dueDate: '',
    description: '',
    resourceLink: '',
  });

  const handleCreateAssignment = () => {
    // Implement create logic
    console.log('Create assignment:', assignment);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Create Assignment" />
      
      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assignment Title</Text>
            <TextInput
              style={styles.input}
              value={assignment.title}
              onChangeText={(text) => setAssignment({ ...assignment, title: text })}
              placeholder="Enter assignment title"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <View style={styles.dateInput}>
              <Calendar size={20} color={COLORS.gray} />
              <TextInput
                style={styles.dateTextInput}
                value={assignment.dueDate}
                onChangeText={(text) => setAssignment({ ...assignment, dueDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={assignment.description}
              onChangeText={(text) => setAssignment({ ...assignment, description: text })}
              placeholder="Enter assignment description"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Files</Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Upload size={24} color={COLORS.primary} />
              <Text style={styles.uploadText}>Upload Assignment Files</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Resource Link (Optional)</Text>
            <View style={styles.linkInput}>
              <Link size={20} color={COLORS.gray} />
              <TextInput
                style={styles.linkTextInput}
                value={assignment.resourceLink}
                onChangeText={(text) => setAssignment({ ...assignment, resourceLink: text })}
                placeholder="Enter resource link"
                placeholderTextColor={COLORS.gray}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateAssignment}
            >
              <Text style={styles.createButtonText}>Create Assignment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
  },
  dateTextInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  uploadText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
  },
  linkInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
  },
  linkTextInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  createButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});