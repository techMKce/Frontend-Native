import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import api from '@/service/api';

const { width } = Dimensions.get('window');

type AssignmentGrade = {
  assignmentTitle: string;
  grade: number;
};

type Student = {
  assignmentGrades: AssignmentGrade[];
  averageGrade: number | null;
  progressPercentage: number;
  studentDepartment: string;
  studentEmail: string;
  studentName: string;
  studentRollNumber: string;
  studentSemester: string;
};

type StudentProgressReportProps = {
  courseId: string;
};

const StudentProgressReport = ({ courseId }: StudentProgressReportProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Memoize the CSV download function to prevent re-creation on every render
  const downloadCSV = useCallback(async (students: Student[]) => {
    setIsExporting(true);
    
    try {
      // Prepare CSV headers
      const headers = [
        "S.No",
        "Roll No",
        "Name",
        "Department",
        "Progress (%)",
        ...(students[0]?.assignmentGrades?.map(
          (assignment) => assignment.assignmentTitle || "Your Assignment"
        ) || []),
        "Average Grade",
      ];

      // Prepare CSV data rows
      const rows = students.map((student, index) => [
        index + 1,
        student.studentRollNumber,
        student.studentName,
        student.studentDepartment,
        student.progressPercentage,
        ...(student.assignmentGrades?.map(
          (assignment) => assignment.grade ?? "N/A"
        ) || []),
        student.averageGrade ?? "N/A",
      ]);

      // Convert to CSV format
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Save file locally
      const fileUri = FileSystem.documentDirectory + `student_progress_report_${new Date().toISOString().split('T')[0]}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Share Student Progress Report',
        UTI: 'public.comma-separated-values-text',
      });

      Alert.alert('Success', 'Report exported successfully!');
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/submissions/courses/${courseId}/student-progress`
        );
        const formattedStudents = response.data.students.map(
          (student: any) => ({
            ...student,
            assignmentGrades:
              student.assignmentGrades?.map((grade: any) => ({
                grade: grade.grade,
                assignmentTitle: grade.assignmentTitle || "Your Assignment",
              })) || [],
          })
        );
        setStudents(formattedStudents);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        Alert.alert('Error', 'Failed to load student data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [courseId]);

  // Memoize color functions to prevent recalculation
  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }, []);

  const getGradeColor = useCallback((grade: number) => {
    if (grade >= 85) return '#10b981'; // Green
    if (grade >= 70) return '#3b82f6'; // Blue
    if (grade >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }, []);

  // Memoize summary calculations to prevent recalculation on every render
  const summaryData = useMemo(() => {
    const totalStudents = students.length;
    const avgProgress = totalStudents > 0 
      ? (students.reduce((sum, student) => sum + student.progressPercentage, 0) / totalStudents).toFixed(1)
      : 0;
    const studentsWithGrades = students.filter(s => s.averageGrade !== null);
    const avgGrade = studentsWithGrades.length > 0
      ? (students.reduce((sum, student) => sum + (student.averageGrade || 0), 0) / studentsWithGrades.length).toFixed(1)
      : 'N/A';

    return { totalStudents, avgProgress, avgGrade };
  }, [students]);

  // Memoize the summary card component
  const SummaryCard = useMemo(() => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Course Overview</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <MaterialIcons name="group" size={24} color="#6366f1" />
          <Text style={styles.summaryValue}>{summaryData.totalStudents}</Text>
          <Text style={styles.summaryLabel}>Students</Text>
        </View>
        <View style={styles.summaryItem}>
          <MaterialIcons name="trending-up" size={24} color="#10b981" />
          <Text style={styles.summaryValue}>{summaryData.avgProgress}%</Text>
          <Text style={styles.summaryLabel}>Avg Progress</Text>
        </View>
        <View style={styles.summaryItem}>
          <MaterialIcons name="grade" size={24} color="#f59e0b" />
          <Text style={styles.summaryValue}>{summaryData.avgGrade}</Text>
          <Text style={styles.summaryLabel}>Avg Grade</Text>
        </View>
      </View>
    </View>
  ), [summaryData]);

  // Memoize table header
  const TableHeader = useMemo(() => {
    if (students.length === 0) return null;
    
    return (
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.snoCell]}>S.No</Text>
        <Text style={[styles.headerCell, styles.rollCell]}>Roll No</Text>
        <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
        <Text style={[styles.headerCell, styles.deptCell]}>Department</Text>
        <Text style={[styles.headerCell, styles.progressCell]}>Progress</Text>
        
        {students[0]?.assignmentGrades?.map((assignment, index) => (
          <Text key={index} style={[styles.headerCell, styles.assignmentCell]}>
            {assignment.assignmentTitle.length > 15 
              ? `${assignment.assignmentTitle.substring(0, 15)}...` 
              : assignment.assignmentTitle}
          </Text>
        ))}
        
        <Text style={[styles.headerCell, styles.avgCell]}>Avg Grade</Text>
      </View>
    );
  }, [students]);

  // Memoize individual table row component to prevent unnecessary re-renders
  const TableRow = React.memo(({ student, index }: { student: Student; index: number }) => {
    const isEvenRow = index % 2 === 0;
    
    return (
      <View style={[
        styles.tableRow, 
        isEvenRow ? styles.evenRow : styles.oddRow
      ]}>
        <Text style={[styles.cell, styles.snoCell]}>{index + 1}</Text>
        <Text style={[styles.cell, styles.rollCell]}>{student.studentRollNumber}</Text>
        <Text style={[styles.cell, styles.nameCell]} numberOfLines={2}>
          {student.studentName}
        </Text>
        <Text style={[styles.cell, styles.deptCell]} numberOfLines={1}>
          {student.studentDepartment}
        </Text>
        
        <View style={[styles.cell, styles.progressCell]}>
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressBar,
              { 
                width: `${student.progressPercentage}%`,
                backgroundColor: getProgressColor(student.progressPercentage)
              }
            ]} />
          </View>
          <Text style={[
            styles.progressText,
            { color: getProgressColor(student.progressPercentage) }
          ]}>
            {student.progressPercentage}%
          </Text>
        </View>
        
        {student.assignmentGrades?.map((assignment, idx) => (
          <View key={idx} style={[styles.cell, styles.assignmentCell]}>
            {assignment.grade !== null ? (
              <View style={[
                styles.gradeChip,
                { backgroundColor: `${getGradeColor(assignment.grade)}15` }
              ]}>
                <Text style={[
                  styles.gradeText,
                  { color: getGradeColor(assignment.grade) }
                ]}>
                  {assignment.grade}
                </Text>
              </View>
            ) : (
              <Text style={styles.naText}>N/A</Text>
            )}
          </View>
        ))}
        
        <View style={[styles.cell, styles.avgCell]}>
          {student.averageGrade !== null ? (
            <View style={[
              styles.gradeChip,
              { backgroundColor: `${getGradeColor(student.averageGrade)}15` }
            ]}>
              <Text style={[
                styles.gradeText,
                { color: getGradeColor(student.averageGrade) }
              ]}>
                {student.averageGrade.toFixed(1)}
              </Text>
            </View>
          ) : (
            <Text style={styles.naText}>N/A</Text>
          )}
        </View>
      </View>
    );
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading student data...</Text>
        </View>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="school" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptySubtitle}>
            No student progress data found for this course
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Student Progress Report</Text>
          <Text style={styles.subtitle}>{students.length} students enrolled</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.downloadButton, isExporting && styles.downloadButtonDisabled]}
          onPress={() => downloadCSV(students)}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <FontAwesome name="download" size={16} color="white" />
          )}
          <Text style={styles.downloadButtonText}>
            {isExporting ? "Exporting..." : "Export CSV"}
          </Text>
        </TouchableOpacity>
      </View>

      {SummaryCard}

      <View style={styles.tableContainer}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {TableHeader}
            <ScrollView showsVerticalScrollIndicator={false}>
              {students.map((student, index) => (
                <TableRow 
                  key={student.studentRollNumber} 
                  student={student} 
                  index={index} 
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 100,
    maxWidth: 140,
  },
  downloadButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0.1,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  table: {
    minWidth: width * 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#ffffff',
  },
  oddRow: {
    backgroundColor: '#fafbfc',
  },
  cell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Column widths
  snoCell: { width: 50 },
  rollCell: { width: 80 },
  nameCell: { width: 120, alignItems: 'flex-start' },
  deptCell: { width: 100 },
  progressCell: { width: 100 },
  assignmentCell: { width: 80 },
  avgCell: { width: 80 },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gradeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  naText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default StudentProgressReport;