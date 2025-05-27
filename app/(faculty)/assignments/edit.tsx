import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Link } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DatePicker from '@/components/DatePicker';
import FileUploader, { FileInfo } from '@/components/FileUploader';

export default function EditAssignmentScreen() {
  const { id } = useLocalSearchParams();
  const [assignment, setAssignment] = useState({
    title: '',
    dueDate: '',
    description: '',
    resourceLink: '',
  });
  
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [errors, setErrors] = useState({
    title: '',
    dueDate: '',
    description: '',
    files: ''
  });

  useEffect(() => {
    // Fetch assignment data based on id
    // This is mock data - replace with actual API call
    const mockAssignment = {
      id: '1',
      title: 'Database Design Project',
      dueDate: '2024-04-15 12:00',
      description: 'Design and implement a database schema',
      resourceLink: 'https://example.com/resources',
      files: [
        {
          uri: 'https://example.com/file1.pdf',
          name: 'Assignment Guidelines.pdf',
          size: 1024000,
          type: 'application/pdf',
          id: '1'
        }
      ]
    };

    setAssignment({
      title: mockAssignment.title,
      dueDate: mockAssignment.dueDate,
      description: mockAssignment.description,
      resourceLink: mockAssignment.resourceLink,
    });
    setFiles(mockAssignment.files);
  }, [id]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      dueDate: '',
      description: '',
      files: ''
    };
    
    if (!assignment.title.trim()) {
      newErrors.title = 'Assignment title is required';
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

  const handleUpdateAssignment = () => {
    if (validateForm()) {
      // Implement update logic
      console.log('Update assignment:', { ...assignment, files });
      
      Alert.alert(
        "Success", 
        "Assignment updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Edit Assignment" />
      
      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assignment Title</Text>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              value={assignment.title}
              onChangeText={(text) => {
                setAssignment({ ...assignment, title: text });
                if (text.trim()) setErrors({...errors, title: ''});
              }}
              placeholder="Enter assignment title"
              placeholderTextColor={COLORS.gray}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
          </View>

         <View style={styles.inputGroup}>
  <Text style={styles.label}>Due Date</Text>
  <DatePicker
    value={assignment.dueDate}
    onChange={(dateTime) => {
      setAssignment({ ...assignment, dueDate: dateTime });
      setErrors({...errors, dueDate: ''});
    }}
  />
  {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}
</View>


          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
              value={assignment.description}
              onChangeText={(text) => {
                setAssignment({ ...assignment, description: text });
                if (text.trim()) setErrors({...errors, description: ''});
              }}
              placeholder="Enter assignment description"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Files</Text>
            <FileUploader 
              files={files}
              onFilesSelected={setFiles}
            />
            {errors.files ? <Text style={styles.errorText}>{errors.files}</Text> : null}
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
              style={[styles.button, styles.saveButton]}
              onPress={handleUpdateAssignment}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.gray,
  },
  saveButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});