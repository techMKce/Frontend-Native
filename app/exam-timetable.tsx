import React from 'react';
import { View, StyleSheet } from 'react-native';
import ExamTimetable from '../components/shared/exam-timetable'; // Adjust path if needed
import Header from '../components/shared/Header'; // Adjust path if needed
export default function ExamTimetableScreen() {
  return (
    
    <View style={styles.container}>
        <Header title="Enrolled Courses" />
      <ExamTimetable />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});