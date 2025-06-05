import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native'; // Add this import
import * as WebBrowser from 'expo-web-browser';
import api from '@/service/api';

interface StudentSubmission {
  id: number;
  studentName: string;
  studentRollNumber: string;
  submittedAt: string;
  grade?: string;
}

interface Grading {
  studentRollNumber: string;
  assignmentId: number;
  grade: string;
}

export default function GradeSubmissionsScreen() {
  const { id: assignmentId } = useLocalSearchParams();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dueDate, setDueDate] = useState<string>('');
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');
  const [gradedCount, setGradedCount] = useState<number>(0);
  const navigation = useNavigation(); // Add navigation hook

  const fetchData = async () => {
    if (!assignmentId) {
      console.error("Invalid assignment ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true); // Set loading to true during refresh
      const [assignmentRes, submissionRes, gradingRes] = await Promise.all([
        api.get('/assignments/id', { params: { assignmentId } }),
        api.get('/submissions', { params: { assignmentId } }),
        api.get('/gradings', { params: { assignmentId } }),
      ]);

      const assignment = assignmentRes.data.assignment;
      if (assignment) {
        setAssignmentTitle(assignment.title);
        setDueDate(assignment.dueDate);
        setCourseId(assignment.course_id);
      } else {
        console.error("Failed to load assignment details.");
      }

      const submissionsData: StudentSubmission[] = Array.isArray(submissionRes.data.submissions)
        ? submissionRes.data.submissions
        : [];

      const gradingsData: Grading[] = Array.isArray(gradingRes.data.gradings)
        ? gradingRes.data.gradings
        : [];

      const mergedSubmissions = submissionsData.map((sub) => ({
        ...sub,
        grade: gradingsData.find(
          (g: Grading) =>
            g.studentRollNumber === sub.studentRollNumber &&
            g.assignmentId.toString() === assignmentId
        )?.grade,
      }));

      setSubmissions(mergedSubmissions);
      setGradedCount(mergedSubmissions.filter((s) => s.grade).length);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch

    // Add listener for when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData(); // Refetch data when screen is focused
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, [assignmentId, navigation]);

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/gradings/download-url', {
        params: { assignmentId },
        responseType: 'blob',
      });

      if (response.data.url) {
        await WebBrowser.openBrowserAsync(response.data.url);
      } else if (response.data instanceof Blob) {
        const fileURL = URL.createObjectURL(response.data);
        await WebBrowser.openBrowserAsync(fileURL);
        URL.revokeObjectURL(fileURL);
      } else {
        const directDownloadUrl = `${api.defaults.baseURL}/gradings/download?assignmentId=${assignmentId}`;
        await WebBrowser.openBrowserAsync(directDownloadUrl);
      }
    } catch (err: any) {
      console.error('Download error:', err.message || 'Failed to download report');
      Alert.alert(
        'Download Failed',
        'Could not download the report. Please try again later.'
      );
    }
  };

  const filtered = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentRollNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1D4E89" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push(`/faculty/courses?courseId=${courseId}`)}
        style={styles.backLink}
      >
        <Text style={styles.backLinkText}>← Back to courses</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Grade Submissions</Text>
      <Text style={styles.subheader}>{assignmentTitle || '—'}</Text>

      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Due Date</Text>
          <Text style={styles.summaryValue}>
            {dueDate
              ? new Date(dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Submissions</Text>
          <Text style={styles.summaryValue}>{submissions.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Graded</Text>
          <Text style={styles.summaryValue}>
            {gradedCount} / {submissions.length}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadReport}
      >
        <Icon name="download-outline" size={16} color="#fff" />
        <Text style={styles.downloadButtonText}>Download Report</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Search by student name or roll number..."
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
      />
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 4 }]}>Student & Roll Number</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Action</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
  <View style={styles.studentCard}>
    <View style={[styles.studentInfo, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
      <Icon name="person-circle-outline" size={36} color="#888" />
      <View style={{ marginLeft: 10 }}>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={styles.roll}>{item.studentRollNumber}</Text>
      </View>
    </View>
    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => {
        router.push({
          pathname: item.grade
            ? '/faculty/assignments/ViewGradedSubmissionScreen'
            : '/faculty/assignments/GradeSubmissionScreen',
          params: { id: item.id.toString() },
        });
      }}
    >
      <Icon name="document-text-outline" size={16} color="#fff" />
      <Text style={styles.actionText}>{item.grade ? 'Review' : 'Grade'}</Text>
    </TouchableOpacity>
  </View>
)}
      />
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F6F6' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 32,
    color: '#1D4E89',
  },
  subheader: { fontSize: 16, color: '#777', marginBottom: 12 },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4E89',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#d9e3ea',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: 4,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1D4E89',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  studentInfo: {
    flex: 2,
    marginLeft: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roll: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
 
  actionButton: {
    backgroundColor: '#1D4E89',
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  backLink: {
    marginTop: 16,
    marginBottom: 4,
  },
  backLinkText: {
    color: '#1D4E89',
    fontSize: 14,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#1D4E89',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});