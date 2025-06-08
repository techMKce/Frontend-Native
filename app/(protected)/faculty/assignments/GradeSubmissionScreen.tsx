import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import api from '@/service/api';
import Header from '@/components/shared/Header';

interface Submission {
  assignmentId: string;
  studentName: string;
  studentRollNumber: string;
  submittedAt: string;
  status: string;
  fileNo: string;
  fileName: string;
}

const GradeSubmissionScreen = () => {
  const { id } = useLocalSearchParams();
  const submissionId = id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const navigation = useNavigation();

  const statusFadeAnim = useRef(new Animated.Value(1)).current;

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
        console.log('Fetch submission API response:', response.data);

        if (response.data.submission) {
          setSubmission(response.data.submission);
        } else {
          Alert.alert('Error', response.data.message || 'No submission data found.');
        }
      } catch (error: any) {
        console.error('Fetch submission error:', error);
        Alert.alert('Error', 'Failed to load submission: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const animateStatusChange = () => {
    Animated.timing(statusFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(statusFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRejectSubmission = async () => {
    if (!submissionId || !submission?.assignmentId) {
      Alert.alert('Error', 'Submission or assignment ID is missing.');
      return;
    }

    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this submission? The student will need to resubmit, and you will not be able to assign a grade.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejecting(true);
            try {
              const response = await api.post('/submissions/status', {
                submissionId,
                assignmentId: submission.assignmentId,
                status: 'Rejected',
              });

              console.log('Reject submission API response:', response);
              console.log('Response status:', response.status);
              console.log('Response data:', response.data);

              // Update UI optimistically
              setSubmission((prev) => {
                if (prev) {
                  animateStatusChange();
                  return { ...prev, status: 'Rejected' };
                }
                return null;
              });
            } catch (error: any) {
              console.error('Reject submission error:', error);
              console.log('Error response:', error.response);
              console.log('Error status:', error.response?.status);
              console.log('Error data:', error.response?.data);

              // Handle cases where the backend might return a 204 or other non-error status
              if (error.response?.status === 204 || error.response?.status === 200) {
                setSubmission((prev) => {
                  if (prev) {
                    animateStatusChange();
                    return { ...prev, status: 'Rejected' };
                  }
                  return null;
                });
              } else {
                Alert.alert(
                  'Error',
                  error.response?.data?.message || 'Failed to reject submission. Please try again.'
                );
                // Re-fetch submission to ensure UI consistency
                try {
                  const response = await api.get(`/submissions/id?submissionId=${submissionId}`);
                  if (response.data.submission) {
                    setSubmission(response.data.submission);
                  }
                } catch (fetchError: any) {
                  console.error('Re-fetch submission error:', fetchError);
                }
              }
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (data:application/pdf;base64,)
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
      case 'pdf':
        return 'application/pdf';
      case 'doc':
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'ppt':
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
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
      
      // For iOS
      if (Platform.OS === 'ios') {
        // First try direct linking (works for local files on iOS)
        try {
          await Linking.openURL(fileUri);
          return;
        } catch (error) {
          console.log('Could not open with Linking, trying WebBrowser:', error);
        }
        
        // Then try WebBrowser (only works well with PDFs)
        if (mimeType === 'application/pdf') {
          try {
            await WebBrowser.openBrowserAsync(fileUri, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              showTitle: true,
              toolbarColor: '#1e3a8a',
              controlsColor: '#fff',
              enableBarCollapsing: true,
            });
            return;
          } catch (error) {
            console.log('Could not open with WebBrowser, will try to share:', error);
          }
        } else {
          // For non-PDF files, go straight to sharing
          await shareFile(fileUri);
          return;
        }
      }
      
      // Last resort: try to share directly instead
      await shareFile(fileUri);
      
      // If the file is not meant to be permanent, clean it up after a delay
      if (!permanent) {
        setTimeout(async () => {
          try {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists && !permanent) {
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

      // Fallback: try to share the file instead
      Alert.alert(
        'Cannot Open File',
        'Unable to open file directly. Would you like to save and share it with another app?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save & Share', onPress: () => saveAndShareFile(fileUri) },
        ]
      );
    }
  };

  const saveAndShareFile = async (fileUri: string) => {
    try {
      if (!permissionResponse?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Storage permission is needed to save files.');
          return;
        }
      }
      
      // Save to media library first
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      }
      
      // Then share
      await shareFile(fileUri);
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
          UTI: 'public.item',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Error', 'Failed to share file');
    }
  };

  const handleDownloadSubmission = async () => {
    if (!submissionId) {
      Alert.alert('Error', 'Submission ID is missing.');
      return;
    }

    try {
      setDownloading(true);
      
      // Default extension is pdf, but we'll try to extract it if possible
      const fileName = `submission_${submissionId}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && fileInfo.size > 0) {
        // File exists, ask user what to do
        Alert.alert('File Ready', 'What would you like to do?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View',
            onPress: () => openFile(fileUri, false),
          },
          {
            text: 'Save & Share',
            onPress: () => saveAndShareFile(fileUri),
          },
        ]);
        setDownloading(false);
        return;
      }

      // Fetch from server
      const response = await api.get(`/submissions/download?submissionId=${submissionId}`, {
        responseType: 'blob',
      });

      // Try to determine file type from content-type header
      const contentType = response.headers['content-type'] || 'application/pdf';
      let fileExtension = 'pdf';
      if (contentType.includes('word')) fileExtension = 'docx';
      if (contentType.includes('presentation')) fileExtension = 'pptx';
      if (contentType.includes('sheet')) fileExtension = 'xlsx';
      
      // Update file path with correct extension
      const actualFileUri = `${FileSystem.documentDirectory}submission_${submissionId}.${fileExtension}`;

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
      await FileSystem.writeAsStringAsync(actualFileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify file was created
      const newFileInfo = await FileSystem.getInfoAsync(actualFileUri);
      if (!newFileInfo.exists || newFileInfo.size === 0) {
        throw new Error('File was not created properly');
      }

      // Try opening file directly 
      openFile(actualFileUri, false);
      
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'Error',
        'Failed to download file. Please check your internet connection and try again.'
      );
    } finally {
      setDownloading(false);
    }
  };

  const isRejected = submission?.status === 'Rejected';

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
    <>
      <Header title="Grades" />
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
            <Animated.View style={{ opacity: statusFadeAnim }}>
              <Text style={[styles.value, isRejected && { color: '#ef4444' }]}>
                {submission.status}
              </Text>
            </Animated.View>

            <Text style={styles.label}>Submitted Document</Text>
            <View style={styles.docRow}>
              <FontAwesome5 name="file-pdf" size={16} color="white" style={styles.pdfIcon} />
              <Text style={styles.docText}>submission_{submission.fileName || submissionId}.pdf</Text>
              <View style={styles.docActions}>
                <TouchableOpacity 
                  style={[styles.iconButton, styles.viewButton, downloading && styles.iconButtonDisabled]} 
                  onPress={handleDownloadSubmission}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#1e3a8a" />
                  ) : (
                    <FontAwesome5 name="eye" size={16} color="#1e3a8a" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconButton, downloading && styles.iconButtonDisabled]} 
                  onPress={() => {
                    const fileUri = FileSystem.documentDirectory + `submission_${submissionId}.pdf`;
                    saveAndShareFile(fileUri);
                  }}
                  disabled={downloading}
                >
                  <FontAwesome5 name="download" size={16} color="#1e3a8a" />
                </TouchableOpacity>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.fullCard}>
          <View style={styles.gradingHeader}>
            <View style={styles.headerRow}>
              <Text style={styles.cardTitle}>GRADING</Text>
              {!isRejected && (
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleRejectSubmission}
                  disabled={rejecting}
                >
                  {rejecting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
                    isRejected && styles.disabledGradeButton,
                  ]}
                  onPress={() => !isRejected && setSelectedGrade(grade.label)}
                  disabled={isRejected}
                >
                  <Text
                    style={[
                      styles.gradeText,
                      selectedGrade === grade.label && { color: '#fff' },
                      isRejected && styles.disabledText,
                    ]}
                  >
                    {grade.label}
                  </Text>
                  <Text
                    style={[
                      styles.gradeDescription,
                      selectedGrade === grade.label && { color: '#fff' },
                      isRejected && styles.disabledText,
                    ]}
                  >
                    {grade.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Feedback</Text>
            <TextInput
              style={[styles.feedbackInput, isRejected && styles.disabledInput]}
              placeholder="Provide feedback on the student's work..."
              multiline
              numberOfLines={4}
              maxLength={500}
              value={feedback}
              onChangeText={setFeedback}
              editable={!isRejected}
            />
            <Text style={styles.charCount}>{feedback.length}/500 characters</Text>

            <Button
              mode="contained"
              icon="check"
              style={[styles.submitButton, isRejected && styles.disabledButton]}
              onPress={async () => {
                if (isRejected) {
                  Alert.alert('Error', 'Cannot submit grade for a rejected submission.');
                  return;
                }

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
              disabled={isRejected}
            >
              Submit Grade
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </>
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
  docActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  viewButton: {
    backgroundColor: '#e0f2fe',
  },
  iconButtonDisabled: {
    opacity: 0.6,
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
  disabledGradeButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  gradeText: {
    fontWeight: 'bold',
    color: '#111827',
  },
  gradeDescription: {
    fontSize: 12,
    color: '#374151',
  },
  disabledText: {
    color: '#6b7280',
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
  disabledInput: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
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
  disabledButton: {
    backgroundColor: '#6b7280',
    opacity: 0.5,
  },
  gradingHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default GradeSubmissionScreen;