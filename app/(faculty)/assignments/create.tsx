import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Link } from 'lucide-react-native';
import { router } from 'expo-router';
import DatePicker from '@/components/DatePicker';
import FileUploader, { FileInfo } from '@/components/FileUploader';

export default function CreateAssignmentScreen() {
  const [assignment, setAssignment] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    description: '',
    resourceLink: '',
  });

  const [files, setFiles] = useState<FileInfo[]>([]);
  const [errors, setErrors] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    description: '',
    files: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      courseId: '',
      dueDate: '',
      description: '',
      files: '',
    };

    if (!assignment.title.trim()) {
      newErrors.title = 'Assignment title is required';
      isValid = false;
    }

    if (!assignment.courseId.trim()) {
      newErrors.courseId = 'Course ID is required';
      isValid = false;
    }

    if (!assignment.dueDate) {
      newErrors.dueDate = 'Due date is required';
      isValid = false;
    }

    if (!assignment.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (files.length === 0) {
      newErrors.files = 'At least one file is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateAssignment = () => {
    if (validateForm()) {
      console.log('Create assignment:', { ...assignment, files });
      Alert.alert('Success', 'Assignment created successfully', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Create Assignment" />

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          {/* Title Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assignment Title</Text>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              value={assignment.title}
              onChangeText={(text) => {
                setAssignment({ ...assignment, title: text });
                if (text.trim()) setErrors({ ...errors, title: '' });
              }}
              placeholder="Enter assignment title"
              placeholderTextColor={COLORS.gray}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
          </View>

          {/* Course ID Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course ID</Text>
            <TextInput
              style={[styles.input, errors.courseId ? styles.inputError : null]}
              value={assignment.courseId}
              onChangeText={(text) => {
                setAssignment({ ...assignment, courseId: text });
                if (text.trim()) setErrors({ ...errors, courseId: '' });
              }}
              placeholder="Eg: CSE001"
              placeholderTextColor={COLORS.gray}
            />
            {errors.courseId ? <Text style={styles.errorText}>{errors.courseId}</Text> : null}
          </View>

          {/* Due Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <DatePicker
              value={assignment.dueDate}
              onChange={(date) => {
                setAssignment({ ...assignment, dueDate: date });
                setErrors({ ...errors, dueDate: '' });
              }}
            />
            {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
              value={assignment.description}
              onChangeText={(text) => {
                setAssignment({ ...assignment, description: text });
                if (text.trim()) setErrors({ ...errors, description: '' });
              }}
              placeholder="Enter assignment description"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>

          {/* File Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Files</Text>
            <FileUploader files={files} onFilesSelected={setFiles} />
            {errors.files ? <Text style={styles.errorText}>{errors.files}</Text> : null}
          </View>

          {/* Resource Link */}
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

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={handleCreateAssignment}
              activeOpacity={0.8}
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
  // (Your styles remain unchanged)
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
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    marginTop: SPACING.xs,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
