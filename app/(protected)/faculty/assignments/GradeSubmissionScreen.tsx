import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import api from '@/service/api';

interface Submission {
  assignmentId: string;
  studentName: string;
  studentRollNumber: string;
  submittedAt: string;
  status: string;
  fileNo: string;
}

const GradeSubmissionScreen = () => {
  const { id } = useLocalSearchParams();
  const submissionId = id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const grades = [
    { label: 'O', description: 'Outstanding' },
    { label: 'A+', description: 'Excellent' },
    { label: 'A', description: 'Very Good' },
    { label: 'B+', description: 'Good' },
    { label: 'B', description: 'Above Average' },
    { label: 'C', description: 'Average' },
  ];

  useEffect(() => {
    const fetchSubmission = async () => {
      console.log('submissionId:', submissionId);

      if (!submissionId) {
        Alert.alert('Error', 'No submission ID provided.');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/submissions/id?submissionId=${submissionId}`);
        console.log('API response:', response.data);

        if (response.data.submission) {
          setSubmission(response.data.submission);
        } else {
          Alert.alert('Error', response.data.message || 'No submission data found.');
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to load submission: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text>Loading submission details...</Text>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>Submission not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>{'< Back to All Submissions'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Grade Submission</Text>

      <Card style={styles.fullCard}>
        <Card.Title title="STUDENT INFORMATION" titleStyle={styles.cardTitle} />
        <Card.Content>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{submission.studentName}</Text>

          <Text style={styles.label}>Roll Number</Text>
          <Text style={styles.value}>{submission.studentRollNumber}</Text>

          <Text style={styles.label}>Submitted On</Text>
          <View style={styles.dateRow}>
            <MaterialIcons name="calendar-today" size={16} />
            <Text style={styles.value}>
              {' '}
              {new Date(submission.submittedAt).toLocaleString()}
            </Text>
          </View>

          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{submission.status}</Text>

          <Text style={styles.label}>Submitted Document</Text>
          <View style={styles.docRow}>
            <FontAwesome5 name="file-pdf" size={16} color="white" style={styles.pdfIcon} />
            <Text style={styles.docText}>submission_{submission.fileNo}.pdf</Text>
            <IconButton
              icon="download"
              size={18}
              onPress={async () => {
                const url = `${api.defaults.baseURL}/submissions/download?submissionId=${submissionId}`;
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

      <Card style={styles.fullCard}>
        <View style={styles.gradingHeader}>
          <Text style={styles.cardTitle}>GRADING</Text>
        </View>
        <Card.Content>
          <Text style={styles.label}>Select Grade</Text>
          <View style={styles.gradeGrid}>
            {grades.map((grade) => (
              <TouchableOpacity
                key={grade.label}
                style={[
                  styles.gradeButton,
                  selectedGrade === grade.label && styles.selectedGrade,
                ]}
                onPress={() => setSelectedGrade(grade.label)}
              >
                <Text
                  style={[
                    styles.gradeText,
                    selectedGrade === grade.label && { color: '#fff' },
                  ]}
                >
                  {grade.label}
                </Text>
                <Text
                  style={[
                    styles.gradeDescription,
                    selectedGrade === grade.label && { color: '#fff' },
                  ]}
                >
                  {grade.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Feedback</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Provide feedback on the student's work..."
            multiline
            numberOfLines={4}
            maxLength={500}
            value={feedback}
            onChangeText={setFeedback}
          />
          <Text style={styles.charCount}>{feedback.length}/500 characters</Text>

          <Button
            mode="contained"
            icon="check"
            style={styles.submitButton}
            onPress={async () => {
              if (!selectedGrade) {
                Alert.alert('Validation Error', 'Please select a grade before submitting.');
                return;
              }

              try {
                const response = await api.post('/gradings', {
                  studentRollNumber: submission.studentRollNumber,
                  assignmentId: submission.assignmentId,
                  grade: selectedGrade,
                  feedback: feedback,
                });

                Alert.alert('Success', 'Grade submitted successfully!');
                navigation.goBack();
              } catch (error: any) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to submit grade.');
              }
            }}
          >
            Submit Grade
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  backLink: {
    color: '#4b5563',
    marginBottom: 8,
    marginTop: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
  },
  fullCard: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#d1d5db',
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
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  gradeButton: {
    width: '30%',
    marginVertical: 6,
    padding: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedGrade: {
    backgroundColor: '#2563eb',
  },
  gradeText: {
    fontWeight: 'bold',
    color: '#111827',
  },
  gradeDescription: {
    fontSize: 12,
    color: '#374151',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  charCount: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: '#1e3a8a',
  },
  gradingHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default GradeSubmissionScreen;