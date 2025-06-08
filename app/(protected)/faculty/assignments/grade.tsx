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
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '@/service/api';
import Header from '@/components/shared/Header';

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
  const navigation = useNavigation();

  const fetchData = async () => {
    if (!assignmentId) {
      console.error("Invalid assignment ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
    fetchData();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [assignmentId, navigation]);

  const readBlobAsText = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result.startsWith('data:')) {
          const base64String = result.split(',')[1];
          const text = atob(base64String);
          resolve(text);
        } else {
          resolve(result);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  };

  const handleDownloadReport = async () => {
    try {
      // Fetch the CSV content as a Blob
      const response = await api.get('/gradings/download', {
        params: { assignmentId },
        responseType: 'blob',
      });

      // Log response details for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data type:', response.data instanceof Blob ? 'Blob' : typeof response.data);
      console.log('Response data size:', response.data.size);
      console.log('Response data type (Blob):', response.data.type);

      // Check if the response status is 200 OK
      if (response.status !== 200) {
        const errorBlob = response.data;
        const errorText = await readBlobAsText(errorBlob);
        let errorMessage = 'Failed to download the report.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Validate that response.data is a Blob
      if (!(response.data instanceof Blob)) {
        throw new Error('Response data is not a valid Blob.');
      }

      // Check Blob size
      if (response.data.size === 0) {
        throw new Error('Received an empty Blob.');
      }

      // Removed strict type check since response.data.type may not reliably reflect Content-Type in React Native
      // If needed, check response.headers['content-type'] instead
      const contentType = response.headers['content-type']?.toLowerCase() || '';
      if (contentType && !contentType.includes('text/csv') && !contentType.includes('application/octet-stream')) {
        const errorText = await readBlobAsText(response.data);
        let errorMessage = 'Invalid response type received.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Convert Blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(response.data);
      const base64Data: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      // Extract the base64 string (remove the "data:text/csv;base64," prefix)
      const base64String = base64Data.split(',')[1];

      // Define the file path in the app's document directory
      const fileName = `grading-report-${assignmentId}-${Date.now()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write the file to the device's file system
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Check if sharing is available (optional, for user interaction)
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        // Open a sharing dialog to let the user save or share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Save or Share Grading Report',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        // If sharing isn't available, inform the user where the file is saved
        Alert.alert(
          'File Saved',
          `The grading report has been saved to your app's storage at: ${fileUri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Download error:', err.message || 'Failed to download report');
      Alert.alert(
        'Download Failed',
        err.message || 'Could not download the report. Please try again later.'
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
    <>
      <Header title="Grades" />
      <View style={styles.container}>
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
            <TouchableOpacity
              style={styles.studentCard}
              onPress={() => {
                router.push({
                  pathname: item.grade
                    ? '/faculty/assignments/ViewGradedSubmissionScreen'
                    : '/faculty/assignments/GradeSubmissionScreen',
                  params: { id: item.id.toString() },
                });
              }}
              accessible={true}
              accessibilityLabel={`Navigate to ${item.grade ? 'review' : 'grade'} submission for ${item.studentName}`}
              accessibilityHint={`Taps to ${item.grade ? 'review' : 'grade'} the submission by ${item.studentName} with roll number ${item.studentRollNumber}`}
            >
              <View style={[styles.studentInfo, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                <Icon name="person-circle-outline" size={36} color="#888" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.roll}>{item.studentRollNumber}</Text>
                </View>
              </View>
              <View style={styles.actionButton}>
                <Icon name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.actionText}>{item.grade ? 'Review' : 'Grade'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}

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