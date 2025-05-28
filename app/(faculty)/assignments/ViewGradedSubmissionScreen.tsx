import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Card, IconButton, Button } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const ViewGradedSubmissionScreen = () => {
  const [selectedGrade, setSelectedGrade] = useState('A+');
  const [feedbackText, setFeedbackText] = useState('Great job on the ER diagram. Consider normalizing further next time.');
  const [editMode, setEditMode] = useState(false);
  const [tempGrade, setTempGrade] = useState(selectedGrade);
  const [tempFeedback, setTempFeedback] = useState(feedbackText);

  const grades = [
    { label: 'O', description: 'Outstanding' },
    { label: 'A+', description: 'Excellent' },
    { label: 'A', description: 'Very Good' },
    { label: 'B+', description: 'Good' },
    { label: 'B', description: 'Above Avg' },
    { label: 'C', description: 'Average' },
  ];

  const handleSave = () => {
    setSelectedGrade(tempGrade);
    setFeedbackText(tempFeedback);
    setEditMode(false);
  };

  const handleCancel = () => {
    setTempGrade(selectedGrade);
    setTempFeedback(feedbackText);
    setEditMode(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>View Graded Submission</Text>
      <Text style={styles.subtitle}>Database Design Project</Text>

      <View style={styles.verticalLayout}>
        {/* Student Info */}
        <Card style={styles.card}>
          <Card.Title title={<Text style={styles.cardTitle}>STUDENT INFORMATION</Text>} />
          <Card.Content>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>Alex Johnson</Text>

            <Text style={styles.label}>Roll Number</Text>
            <Text style={styles.value}>CS20001</Text>

            <Text style={styles.label}>Submitted On</Text>
            <View style={styles.rowInline}>
              <MaterialIcons name="calendar-today" size={16} />
              <Text style={styles.value}>May 25,2025 12:00</Text>
            </View>

            <Text style={styles.label}>Submitted Document</Text>
            <View style={styles.docRow}>
              <FontAwesome5 name="file-pdf" size={16} color="white" style={styles.pdfIcon} />
              <Text style={styles.docText}>Database_ER_Model.pdf</Text>
              <IconButton icon="eye" size={18} onPress={() => {}} />
              <IconButton icon="download" size={18} onPress={() => {}} />
            </View>
          </Card.Content>
        </Card>

        {/* Grading Section */}
        <Card style={styles.card}>
          <Card.Title
            title={<Text style={styles.cardTitle}>GRADING</Text>}
            right={() => (
              !editMode && (
                <Button icon="pencil" compact onPress={() => setEditMode(true)}>
                  Edit
                </Button>
              )
            )}
          />
          <Card.Content>
            <Text style={styles.label}>Grade</Text>
            <View style={styles.gradeGrid}>
              {grades.map((grade) => {
                const isSelected = editMode ? tempGrade === grade.label : selectedGrade === grade.label;
                return (
                  <TouchableOpacity
                    key={grade.label}
                    onPress={() => editMode && setTempGrade(grade.label)}
                    activeOpacity={editMode ? 0.7 : 1}
                    style={[
                      styles.gradeButton,
                      isSelected && styles.selectedGrade,
                    ]}
                  >
                    <Text style={styles.gradeText}>{grade.label}</Text>
                    <Text style={styles.gradeDescription}>{grade.description}</Text>
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
              value={editMode ? tempFeedback : feedbackText}
              onChangeText={text => editMode && setTempFeedback(text)}
            />
            <Text style={styles.charCount}>
              {(editMode ? tempFeedback : feedbackText).length}/500 characters
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
      </View>
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
  verticalLayout: {
    flexDirection: 'column',
    gap: 16,
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
    fontWeight: 'bold',
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
});

export default ViewGradedSubmissionScreen;
