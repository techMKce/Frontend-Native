
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, IconButton, Button } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BASE_URL } from '@/service/api';
// Define interfaces for type safety
interface Grading {
  assignmentId: string;
  studentRollNumber: string;
  grade: string;
  feedback: string;
}

interface GradingResponse {
  gradings: Grading[];
}

interface Submission {
  assignmentId: string;
  studentName: string;
  studentRollNumber: string;
  submittedAt: string;
  fileNo: string;
  grade: string;
  feedback: string;
}

const ViewGradedSubmissionScreen = () => {
  const { id: submissionId } = useLocalSearchParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [tempGrade, setTempGrade] = useState('');
  const [tempFeedback, setTempFeedback] = useState('');

  const grades = [
    { label: 'O', description: 'Outstanding' },
    { label: 'A+', description: 'Excellent' },
    { label: 'A', description: 'Very Good' },
    { label: 'B+', description: 'Good' },
    { label: 'B', description: 'Above Avg' },
    { label: 'C', description: 'Average' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const subRes = await fetch(
          `${BASE_URL}/submissions/id?submissionId=${submissionId}`
        );
        const subData = await subRes.json();

        if (!subRes.ok || !subData.submission) {
          throw new Error('Submission not found');
        }

        const fetchedSubmission: Submission = subData.submission;

        const gradingRes = await fetch(
          `${BASE_URL}/gradings?assignmentId=${fetchedSubmission.assignmentId}`
        );
        const gradingData: GradingResponse = await gradingRes.json();

        if (!gradingRes.ok || !Array.isArray(gradingData.gradings)) {
          throw new Error('Grading data not found or invalid');
        }

        const matchedGrading = gradingData.gradings.find(
          (g: Grading) =>
            g.assignmentId === fetchedSubmission.assignmentId &&
            g.studentRollNumber === fetchedSubmission.studentRollNumber
        );

        const finalSubmission: Submission = {
          ...fetchedSubmission,
          grade: matchedGrading?.grade || '',
          feedback: matchedGrading?.feedback || '',
        };

        setSubmission(finalSubmission);
        setTempGrade(finalSubmission.grade);
        setTempFeedback(finalSubmission.feedback);
      } catch (error) {
        console.error('Error:', (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId]);

  const handleSave = async () => {
    if (!tempGrade) {
      Alert.alert('Validation Error', 'Please select a grade.');
      return;
    }

    if (!submission || !submission.assignmentId) {
      Alert.alert('Error', 'Submission or assignment data missing.');
      return;
    }

    const requestBody = {
      studentRollNumber: submission.studentRollNumber,
      assignmentId: submission.assignmentId,
      grade: tempGrade,
      feedback: tempFeedback,
    };

    try {
      const response = await fetch(
        `${BASE_URL}/gradings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const responseData = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Grade updated successfully.');
        setSubmission(prev => ({
          ...prev!,
          grade: tempGrade,
          feedback: tempFeedback,
        }));
        setEditMode(false);
      } else {
        Alert.alert('Error', responseData.message || 'Failed to submit grade.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not submit grade.');
    }
  };

  const handleCancel = () => {
    setTempGrade(submission?.grade || '');
    setTempFeedback(submission?.feedback || '');
    setEditMode(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>Submission not found.</Text>
      </View>
    );
  }

  const { studentName, studentRollNumber, submittedAt, fileNo, grade, feedback } = submission;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backLink}>{'< Back to All Submissions'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>View Graded Submission</Text>
      {/* <Text style={styles.subtitle}>Assignment ID: {submission.assignmentId}</Text> */}

      <Card style={styles.card}>
        <Card.Title title={<Text style={styles.cardTitle}>STUDENT INFORMATION</Text>} />
        <Card.Content>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{studentName}</Text>

          <Text style={styles.label}>Roll Number</Text>
          <Text style={styles.value}>{studentRollNumber}</Text>

          <Text style={styles.label}>Submitted On</Text>
          <View style={styles.rowInline}>
            <MaterialIcons name="calendar-today" size={16} />
            <Text style={styles.value}>{new Date(submittedAt).toLocaleString()}</Text>
          </View>

          <Text style={styles.label}>File Number</Text>
          <View style={styles.docRow}>
            <FontAwesome5 name="file-pdf" size={16} color="white" style={styles.pdfIcon} />
            <Text style={styles.docText}>{fileNo || 'Document.pdf'}</Text>
            <IconButton
              icon="download"
              size={18}
              onPress={async () => {
                const url = `${BASE_URL}/submissions/download?submissionId=${submissionId}`;
                try {
                  await WebBrowser.openBrowserAsync(url);
                } catch (error: any) {
                  Alert.alert('Error', 'Failed to open file: ' + error.message);
                }
              }}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title={<Text style={styles.cardTitle}>GRADING</Text>}
          right={() =>
            !editMode && (
              <Button icon="pencil" compact onPress={() => setEditMode(true)}>
                Edit
              </Button>
            )
          }
        />
        <Card.Content>
          <Text style={styles.label}>Grade</Text>
          <View style={styles.gradeGrid}>
            {grades.map((gradeItem) => {
              const isSelected = editMode
                ? tempGrade === gradeItem.label
                : grade === gradeItem.label;
              return (
                <TouchableOpacity
                  key={gradeItem.label}
                  onPress={() => editMode && setTempGrade(gradeItem.label)}
                  activeOpacity={editMode ? 0.7 : 1}
                  style={[styles.gradeButton, isSelected && styles.selectedGrade]}
                >
                  <Text style={styles.gradeText}>{gradeItem.label}</Text>
                  <Text style={styles.gradeDescription}>{gradeItem.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Feedback</Text>
          <TextInput
            style={styles.feedbackInput}
            multiline
            editable={editMode}
            numberOfLines={4}
            value={editMode ? tempFeedback : feedback}
            onChangeText={text => editMode && setTempFeedback(text)}
          />
          <Text style={styles.charCount}>
            {(editMode ? tempFeedback : feedback).length}/500 characters
          </Text>

          {editMode && (
            <View style={styles.buttonRow}>
              <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>
                Save
              </Button>
              <Button mode="outlined" onPress={handleCancel} style={styles.cancelBtn}>
                Cancel
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    marginTop: 35,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111827',
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#1f2937',
    marginTop: 4,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pdfIcon: {
    backgroundColor: '#1f2937',
    padding: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  docText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  gradeButton: {
    width: '48%',
    padding: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedGrade: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  gradeText: {
    fontWeight: 'bold',
    color: '#111827',
    fontSize: 16,
  },
  gradeDescription: {
    fontSize: 12,
    color: '#374151',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f3f4f6',
    marginTop: 8,
  },
  charCount: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  saveBtn: {
    marginRight: 8,
  },
  cancelBtn: {
    borderColor: '#9ca3af',
  },
  backLink: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 10,
  },
});

export default ViewGradedSubmissionScreen;