import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Calendar, Upload, X, Download, Eye } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import api from '@/service/api';
import { useAuth } from '@/hooks/useAuth';

// Define the Assignment interface inline
interface Assignment {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate: string;
  courseId: string;
  status: string;
  grade: string | null;
  fileNo: string | null; // Faculty-uploaded file identifier
  feedback: string | null;
}

// Define the Submission interface inline
interface Submission {
  id: string;
  assignmentId: string;
  studentName: string;
  studentRollNumber: string;
  fileId: string; // Submitted file identifier
  submittedAt: string;
}

export default function OverdueAssignmentScreen() {
  const {profile} = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOverdue, setIsOverdue] = useState(true);
  const [facultyFileName, setFacultyFileName] = useState<string>('Faculty Assignment File');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const { id } = useLocalSearchParams();
  const assignmentId = id as string;
  const studentName = profile?.profile.name;
  const studentRollNumber = profile?.profile.id;
  const studentEmail = profile?.profile.email;
  const studentDepartment = profile?.profile.department;
  const studentSemester = profile?.profile?.semester as string | undefined;

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
      
      // For Android, try Intent first
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
        try {
          await Linking.openURL(fileUri);
          return;
        } catch (error) {
          console.log('Could not open with Linking, trying WebBrowser:', error);
        }
        
        if (mimeType === 'application/pdf') {
          try {
            await WebBrowser.openBrowserAsync(fileUri, {
              presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
              showTitle: true,
              toolbarColor: COLORS.primary,
              controlsColor: '#fff',
              enableBarCollapsing: true,
            });
            return;
          } catch (error) {
            console.log('Could not open with WebBrowser, will try to share:', error);
          }
        } else {
          await shareFile(fileUri);
          return;
        }
      }
      
      // Last resort: share the file
      await shareFile(fileUri);
      
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
        }, 300000); // 5 minutes
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      Alert.alert(
        'Cannot Open File',
        'Unable to open file directly. Would you like to save it to your device?',
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
      
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      }
      
      await shareFile(fileUri);
      Alert.alert('Success', 'File has been saved to your downloads folder');
    } catch (error) {
      console.error('Failed to save file:', error);
      Alert.alert('Error', 'Failed to save file to downloads');
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

  // Fetch assignment details, submission status, and faculty file name
  useEffect(() => {
    const fetchAssignmentAndSubmission = async () => {
      if (!assignmentId) {
        setError('Assignment ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch assignment details
        const assignmentResponse = await api.get(`/assignments/id?assignmentId=${assignmentId}`);
        const fetchedAssignment = assignmentResponse.data.assignment;
        setAssignment(fetchedAssignment);

        // Check if the assignment is overdue
        const dueDate = new Date(fetchedAssignment.dueDate);
        const currentDate = new Date();
        setIsOverdue(dueDate < currentDate);

        // Fetch submission details for this student
        if (studentRollNumber) {
          try {
            const submissionResponse = await api.get(`/submissions?assignmentId=${assignmentId}`);
            const submissions = submissionResponse.data.submissions || [];
            const studentSubmission = Array.isArray(submissions) ? 
              submissions.find((sub: Submission) => sub.studentRollNumber === studentRollNumber) : null;
            
            if (studentSubmission) {
              setSubmission(studentSubmission);
              setIsSubmitted(true);
            }
          } catch (submissionError) {
            console.error('Error fetching submission:', submissionError);
            // Don't set global error, just log it
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentAndSubmission();
  }, [assignmentId, studentRollNumber]);

  const handleDownloadFacultyFile = async () => {
    if (!assignment?.fileNo) {
      setError('No faculty file available for download');
      return;
    }

    try {
      setDownloading('faculty');
      
      // Default extension is pdf
      const fileExtension = 'pdf';
      const fileName = `faculty_file_${assignmentId}.${fileExtension}`;
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
            text: 'Save & Share',
            onPress: () => saveAndShareFile(fileUri),
          },
        ]);
        setDownloading(null);
        return;
      }

      // Fetch from server
      const response = await api.get(`/assignments/download?assignmentId=${assignmentId}`, {
        responseType: 'blob',
      });

      // Handle web platform
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([response.data]));
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
        setDownloading(null);
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

      // Open file
      openFile(fileUri, false);
      setDownloading(null);
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Failed to download file. Please check your internet connection and try again.');
      setDownloading(null);
    }
  };

  // ...existing code for handleViewFacultyFile, handleDownloadSubmittedFile...

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Assignment Details" />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading assignment details...</Text>
        </View>
      </View>
    );
  }

  if (error || !assignment) {
    return (
      <View style={styles.container}>
        <Header title="Assignment Details" />
        <View style={styles.content}>
          <Text style={styles.errorText}>{error || 'Assignment not found'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Assignment Details" />

      <ScrollView style={styles.content}>
        {/* Assignment Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.assignmentName}>{assignment.title}</Text>
          <Text style={styles.courseName}>{assignment.courseId}</Text>

          <View style={styles.dueDateContainer}>
            <Calendar size={16} color={COLORS.error} />
            <Text style={[styles.dueDate, { color: COLORS.error }]}>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.description}>{assignment.description || 'No description provided'}</Text>

          {assignment.fileNo && (
            <View style={styles.facultyFileContainer}>
              <View style={styles.fileRow}>
                <Text style={styles.metaInfo}>
                  Assignment File
                </Text>
                <View style={styles.fileActions}>
                  <TouchableOpacity 
                    style={[styles.iconButton, styles.viewButton, downloading === 'faculty' && styles.iconButtonDisabled]} 
                    onPress={handleDownloadFacultyFile}
                    disabled={downloading === 'faculty'}
                  >
                    {downloading === 'faculty' ? (
                      <Eye size={18} color="#999" />
                    ) : (
                      <Eye size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Overdue Notice Card */}
        <View style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Assignment Overdue</Text>

          <View style={styles.overdueContainer}>
            <X size={20} color={COLORS.error} />
            <Text style={styles.overdueText}>Due Date Has Passed</Text>
          </View>
          
          <Text style={styles.overdueMessage}>
            This assignment was due on {new Date(assignment.dueDate).toLocaleDateString()} and can no longer be submitted.
            Please contact your instructor for any late submission requests.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/student/assignments')}
          >
            <Text style={styles.backButtonText}>Go Back to Assignments</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// Add styles for new elements
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.md },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  assignmentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  courseName: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dueDate: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  facultyFileContainer: {
    marginTop: SPACING.md,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  metaInfo: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    flex: 1,
    marginRight: SPACING.xs,
  },
  fileActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  submissionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.error}15`,
    padding: SPACING.md,
    borderRadius: 8,
  },
  overdueText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
  overdueMessage: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  iconButton: {
    padding: SPACING.xs,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: `${COLORS.success}15`,
  },
  iconButtonDisabled: {
    opacity: 0.6,
    backgroundColor: `${COLORS.gray}15`,
  },
  loadingText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  errorText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressIndicator: {
    width: '30%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});