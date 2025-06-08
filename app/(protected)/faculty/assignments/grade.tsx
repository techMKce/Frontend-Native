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
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
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
  const [downloading, setDownloading] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
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

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper function to get MIME type from file extension
  const getMimeType = (uri: string): string => {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'text/plain';
    }
  };

  const openFile = async (fileUri: string, permanent: boolean = false) => {
    try {
      const mimeType = getMimeType(fileUri);
      
      // For Android, try Intent first (most direct method)
      if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(fileUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: mimeType,
          });
          return;
        } catch (error) {
          console.log('Could not open with intent, trying alternatives:', error);
        }
      }
      
      // For iOS and web
      if (Platform.OS === 'ios') {
        try {
          await Linking.openURL(fileUri);
          return;
        } catch (error) {
          console.log('Could not open with Linking, trying WebBrowser:', error);
        }
        
        try {
          await WebBrowser.openBrowserAsync(fileUri);
          return;
        } catch (error) {
          console.log('Could not open with WebBrowser, will try to share:', error);
        }
      }
      
      // Last resort: share the file
      await shareFile(fileUri);
      
      // Clean up temporary files after a delay
      if (!permanent) {
        setTimeout(async () => {
          try {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              console.log('Temporary file cleaned up:', fileUri);
            }
          } catch (cleanupError) {
            console.log('Failed to clean up temporary file:', cleanupError);
          }
        }, 300000); // Clean up after 5 minutes
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      Alert.alert(
        'Cannot Open File',
        'Unable to open file directly. Would you like to save it to your device?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save File', onPress: () => saveFile(fileUri) },
        ]
      );
    }
  };

  const saveFile = async (fileUri: string) => {
    try {
      if (!permissionResponse?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Storage permission is needed to save files.');
          return;
        }
      }
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      }
      
      Alert.alert('Success', 'File has been saved to your downloads folder');
    } catch (error) {
      console.error('Failed to save file:', error);
      Alert.alert('Error', 'Failed to save file to downloads');
      
      // Try sharing anyway
      shareFile(fileUri);
    }
  };

  const shareFile = async (fileUri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(fileUri),
          dialogTitle: 'Share File',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleDownloadReport = async () => {
    if (!assignmentId) {
      Alert.alert('Error', 'Assignment ID is missing.');
      return;
    }

    try {
      setDownloading(true);
      
      // Define file path
      const fileName = `grading-report-${assignmentId}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size > 0) {
        Alert.alert('File Ready', 'What would you like to do?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View',
            onPress: () => openFile(fileUri, false),
          },
          {
            text: 'Save',
            onPress: () => saveFile(fileUri),
          },
        ]);
        setDownloading(false);
        return;
      }

      // Fetch from server
      const response = await api.get(`/gradings/download`, {
        params: { assignmentId },
        responseType: 'blob',
      });

      // Handle web platform differently
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([response.data]));
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
        setDownloading(false);
        return;
      }

      // For mobile platforms
      let base64Data;
      try {
        base64Data = await blobToBase64(response.data);
      } catch (error) {
        console.error('Error converting blob to base64:', error);
        throw new Error('Failed to process the downloaded file');
      }

      // Write file to filesystem
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify file was created
      const newFileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!newFileInfo.exists || newFileInfo.size === 0) {
        throw new Error('File was not created properly');
      }

      Alert.alert('Report Downloaded', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View',
          onPress: () => openFile(fileUri, false),
        },
        {
          text: 'Save',
          onPress: () => saveFile(fileUri),
        },
      ]);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'Error',
        'Failed to download report. Please check your internet connection and try again.'
      );
    } finally {
      setDownloading(false);
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
          style={[styles.downloadButton, downloading && styles.downloadingButton]}
          onPress={handleDownloadReport}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="download-outline" size={16} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Report</Text>
            </>
          )}
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
  downloadingButton: {
    backgroundColor: '#7a9cc7',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  backLink: {
    marginTop: 16,
    marginBottom: 4,
  },
  backLinkText: {
    color: '#1D4E89',
    fontSize: 14,
    fontWeight: '500',
  }
});