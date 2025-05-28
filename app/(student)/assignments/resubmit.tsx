import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { FileText } from 'lucide-react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';

const mockAssignment = {
  title: 'Database Design Project',
  course: 'Database Management Systems',
  dueDate: '2025-05-30',
  description:
    'Design a database schema for a university management system with at least 10 entities and appropriate relationships between them. Include ER diagrams and SQL DDL statements.',
  submittedOn: '2025-05-27',
  submittedFiles: [
    { name: 'Database_Schema.pdf', size: '0.0 KB' }
  ],
};

export default function AssignmentResubmissionScreen() {
  const [submittedFiles, setSubmittedFiles] = useState(mockAssignment.submittedFiles);
  const [newFiles, setNewFiles] = useState<any[]>([]);

  const handleUnsubmit = () => {
    Alert.alert('Unsubmit?', 'Are you sure you want to unsubmit the current file(s)?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unsubmit',
        onPress: () => {
          setSubmittedFiles([]);
          setNewFiles([]);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleChooseFiles = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (!res.canceled) {
      setNewFiles(res.assets);
    }
  };

  const handleResubmit = () => {
    if (newFiles.length === 0) return;
    // Submit to backend API
    console.log('Submitting files:', newFiles);
    const formatted = newFiles.map(f => ({ name: f.name, size: 'N/A' }));
    setSubmittedFiles(formatted);
    setNewFiles([]);
  };

  return (
    <View style={styles.container}>
        <Header title="ReSubmit Assignment" />
    <ScrollView contentContainerStyle={styles.container}>
      {/* Assignment Info */}
      
      <View style={styles.card}>
        <Text style={styles.heading}>Assignment Details</Text>
        <Text style={styles.title}>{mockAssignment.title}</Text>
        <Text style={styles.course}>{mockAssignment.course}</Text>
        <Text style={styles.dueText}>Due: {mockAssignment.dueDate}</Text>
        <Text style={styles.description}>{mockAssignment.description}</Text>
      </View>

      {/* Submission Info */}
      <View style={styles.card}>
        <Text style={styles.heading}>Submitted Assignment</Text>

        {submittedFiles.length > 0 ? (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successText}>Assignment Submitted</Text>
              <Text style={styles.submittedDate}>Submitted on: {mockAssignment.submittedOn}</Text>
            </View>

            <Text style={styles.subLabel}>Submitted Files:</Text>
            {submittedFiles.map((file, idx) => (
              <View style={styles.fileBox} key={idx}>
                <FileText size={20} color={COLORS.primary} />
                <Text style={styles.fileText}>{file.name}</Text>
                <Text style={styles.fileSize}>{file.size}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.unsubmitButton} onPress={handleUnsubmit}>
              <Text style={styles.unsubmitText}>Unsubmit & Resubmit</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.uploadButton} onPress={handleChooseFiles}>
              <Text style={styles.pickText}>Upload New Files</Text>
            </TouchableOpacity>

            {newFiles.length > 0 &&
              newFiles.map((file, idx) => (
                <View style={styles.fileBox} key={idx}>
                  <FileText size={20} color={COLORS.primary} />
                  <Text style={styles.fileText}>{file.name}</Text>
                </View>
              ))}

            <TouchableOpacity
              style={[styles.resubmitButton, newFiles.length === 0 && { opacity: 0.5 }]}
              disabled={newFiles.length === 0}
              onPress={handleResubmit}
            >
              <Text style={styles.resubmitText}>Resubmit Assignment</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    backgroundColor: '#f1f5f9',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  heading: {
    fontSize: SIZES.md,
    fontFamily: FONT.semiBold,
    marginBottom: SPACING.sm,
    color: COLORS.darkGray,
  },
  title: {
    fontSize: SIZES.lg,
    fontFamily: FONT.bold,
    color: COLORS.black,
  },
  course: {
    fontSize: SIZES.md,
    fontFamily: FONT.medium,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  dueText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: SIZES.md,
    fontFamily: FONT.regular,
    color: COLORS.darkGray,
    lineHeight: 22,
  },
  successBox: {
    backgroundColor: '#d1fae5',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  successText: {
    color: '#065f46',
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
  },
  submittedDate: {
    color: COLORS.gray,
    fontSize: SIZES.sm,
    marginTop: SPACING.xs,
  },
  subLabel: {
    fontFamily: FONT.medium,
    marginBottom: SPACING.xs,
    color: COLORS.darkGray,
  },
  fileBox: {
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  fileText: {
    fontFamily: FONT.medium,
    color: COLORS.darkGray,
    flex: 1,
  },
  fileSize: {
    color: COLORS.gray,
    fontSize: SIZES.sm,
  },
  unsubmitButton: {
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  unsubmitText: {
    color: COLORS.error,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
  uploadButton: {
    padding: SPACING.md,
   // backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderStyle: 'dashed',
    borderWidth: 1.2,
    borderColor: COLORS.primary,
  },
  pickText: {
    fontFamily: FONT.medium,
    color: COLORS.primary,
  },
  resubmitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resubmitText: {
    fontFamily: FONT.semiBold,
    color: COLORS.white,
    fontSize: SIZES.md,
  },
});

