import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const GradeSubmissionScreen = () => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const navigation = useNavigation();

  const grades = [
    { label: 'O', description: 'Outstanding' },
    { label: 'A+', description: 'Excellent' },
    { label: 'A', description: 'Very Good' },
    { label: 'B+', description: 'Good' },
    { label: 'B', description: 'Above Average' },
    { label: 'C', description: 'Average' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>{'< Back to All Submissions'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Grade Submission</Text>
      <Text style={styles.subtitle}>Database Design Project</Text>

      {/* Student Info */}
      <Card style={styles.fullCard}>
        <Card.Title title="STUDENT INFORMATION" titleStyle={styles.cardTitle} />
        <Card.Content>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>Alex Johnson</Text>

          <Text style={styles.label}>Roll Number</Text>
          <Text style={styles.value}>CS20001</Text>

          <Text style={styles.label}>Submitted On</Text>
          <View style={styles.dateRow}>
            <MaterialIcons name="calendar-today" size={16} />
            <Text style={styles.value}> May 25, 2025 12:00</Text>
          </View>

          <Text style={styles.label}>Submitted Document</Text>
          <View style={styles.docRow}>
            <FontAwesome5 name="file-pdf" size={16} color="white" style={styles.pdfIcon} />
            <Text style={styles.docText}>Database_ER_Model.pdf</Text>
            <IconButton icon="eye" size={18} onPress={() => {}} />
          </View>
        </Card.Content>
      </Card>

      {/* Grading Section */}
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
            onPress={() => {
              if (!selectedGrade) {
                Alert.alert('Validation Error', 'Please select a grade before submitting.');
                return;
              }
              console.log('Grade submitted:', selectedGrade, feedback);
              navigation.goBack();
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
});

export default GradeSubmissionScreen;
