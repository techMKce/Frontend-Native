import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import api from '@/service/api'; // Adjust the import path as necessary
import { useAuth } from '@/hooks/useAuth';

type StudentProgressDisplayProps = {
  courseId: string;
  studentId: string;
};

type Student = {
  studentRollNumber: string;
  studentName: string;
  studentDepartment: string;
  progressPercentage: number;
  attendancePercentage: number;
  averageGrade: string | number;
};

type AttendanceRecord = {
  batch: string;
  courseId: string;
  courseName: string;
  deptId: string;
  deptName: string;
  percentage: number;
  presentcount: number;
  sem: number;
  stdId: string;
  stdName: string;
  totaldays: number;
};

function useStudentProgress(courseId: string, studentId: string) {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          `/submissions/courses/${courseId}/student-progress`
        );
        
        const attendanceResponse = await api.get(
          `/attendance/getstudentbyid?id=${profile?.profile?.id}`
        );

        const userProgress = response.data.students.find(
          (student: Student) =>
            student.studentRollNumber === profile?.profile?.id
        );

        const attendanceProgress = attendanceResponse.data.find(
          (record: AttendanceRecord) =>
            record.stdId === studentId && record.courseId === courseId
        );

        setProgressPercentage(
          userProgress ? userProgress.progressPercentage : 0
        );
        
        setAttendancePercentage(
          attendanceProgress ? attendanceProgress.percentage : 0
        );

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgress();
  }, [courseId, studentId, profile?.profile?.id]);

  return { progressPercentage, loading, error, attendancePercentage };
}

export const StudentProgressDisplay = ({
  courseId,
  studentId,
}: StudentProgressDisplayProps) => {
  const { progressPercentage, loading, error, attendancePercentage } =
    useStudentProgress(courseId, studentId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text>Loading progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Percentage Completed</Text>
          <Text style={styles.progressValue}>{progressPercentage}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Attendance Percentage</Text>
          <Text style={styles.progressValue}>{attendancePercentage}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { width: `${attendancePercentage}%` }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#333',
    borderRadius: 4,
  },
});

export default StudentProgressDisplay;