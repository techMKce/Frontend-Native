import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Calendar, Upload, X, Download, Eye } from 'lucide-react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import api from '@/service/api';
import { useAuth } from '@/hooks/useAuth';

interface Assignment {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate: string;
  courseId: string;
  status: string;
  grade: string | null;
  fileName: string | null;
  feedback: string | null;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentName: string;
  studentRollNumber: string;
  fileId: string;
  studentDepartment: string;
  studentSemester: string;
  studentEmail?: string;
  submittedAt: string;
  grade?: string;       // Added grade field
  feedback?: string;    // Added feedback field
  status?: string;      // Added status field
}

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export default function SubmitAssignmentScreen() {
  const {profile} = useAuth();
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  const { assignmentId: rawAssignmentId } = useLocalSearchParams();
  const assignmentId = Array.isArray(rawAssignmentId) ? rawAssignmentId[0] : rawAssignmentId || '';
  const studentName = profile?.profile.name;
  const studentRollNumber = profile?.profile.id;
  const studentEmail = profile?.profile.email;
  const studentDepartment = profile?.profile.department;
  const studentSemester = profile?.profile?.semester as string | undefined;

  // Check if the student is enrolled in the course for this assignment
  const checkEnrollment = useCallback(async () => {
    if (!studentRollNumber || !assignmentId) {
      setCheckingEnrollment(false);
      return;
    }

    try {
      setCheckingEnrollment(true);
      
      // First get the assignment to know which course it belongs to
      const assignmentResponse = await api.get(`/assignments/id?assignmentId=${assignmentId}`);
      const assignment = assignmentResponse.data.assignment;
      
      if (!assignment || !assignment.courseId) {
        setIsEnrolled(false);
        setCheckingEnrollment(false);
        return;
      }
      
      // Using correct endpoint format
      const enrollmentResponse = await api.get(
        `/course-enrollment/check/${assignment.courseId}/${studentRollNumber}`
      );
      setIsEnrolled(enrollmentResponse.data);
    } catch (error) {
      console.error("Error checking enrollment:", error);
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [assignmentId, studentRollNumber]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  useEffect(() => {
    const fetchAssignmentAndSubmission = async () => {
      if (!assignmentId) {
        setError('Assignment ID is missing');
        setLoading(false);
        return;
      }

      // Don't fetch if we've determined the student is not enrolled
      if (!checkingEnrollment && !isEnrolled) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const assignmentResponse = await api.get(`/assignments/id?assignmentId=${assignmentId}`);
        setAssignment(assignmentResponse.data.assignment);
        
        // Fetch submissions
        const submissionResponse = await api.get(`/submissions?assignmentId=${assignmentId}`);
        console.log('Fetched submissions:', submissionResponse.data);
        
        // Find this student's submission if it exists
        const submissions = submissionResponse.data.submissions || [];
        const studentSubmission = Array.isArray(submissions) ? 
          submissions.find((sub: any) => sub.studentRollNumber === studentRollNumber) : null;

        if (studentSubmission) {
          // Check if submission is rejected
          if (studentSubmission.status === "Rejected") {
            // Navigate to resubmit page if submission is rejected
            router.replace({
              pathname: '/student/assignments/resubmit',
              params: { id: assignmentId }
            });
            return;
          }
          
          // Otherwise, set the submission data
          setSubmission(studentSubmission);
          setIsSubmitted(true);
          
          // If submission exists, check for grading information
          try {
            const gradingResponse = await api.get('/gradings', {
              params: { 
                assignmentId, 
                studentRollNumber 
              }
            });
            
            if (gradingResponse.data && gradingResponse.data.gradings && gradingResponse.data.gradings.length > 0) {
              const grading = gradingResponse.data.gradings[0];
              // Update the submission with grade and feedback
              setSubmission(prev => prev ? {
                ...prev,
                grade: grading.grade,
                feedback: grading.feedback
              } : null);
            }
          } catch (gradingError) {
            console.log('No grading found or error fetching grading:', gradingError);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (!checkingEnrollment) {
      fetchAssignmentAndSubmission();
    }
  }, [assignmentId, studentRollNumber, router, checkingEnrollment, isEnrolled]);

  const handlePick = async () => {
    if (isPastDue && !isSubmitted) {
      Alert.alert('Due Date Passed', 'You cannot upload a file after the due date has passed.');
      return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' }); // Adjusted type for broader compatibility
      if (!res.canceled) {
        setSelectedFile(res.assets[0]);
      }
    } catch (e) {
      console.error('File picker error:', e);
      setError('Failed to pick file. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !assignmentId) return;

    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('studentName', studentName ?? '');
      formData.append('studentEmail', studentEmail ?? '');
      formData.append('studentRollNumber', studentRollNumber ?? '');
      formData.append('studentDepartment', studentDepartment ?? '');
      formData.append('studentSemester', studentSemester ?? '');
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);

      const response = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsSubmitted(true);
      setSubmission({
        id: response.data.submissionId,
        assignmentId,
        studentName: studentName ?? '',
        studentRollNumber: studentRollNumber ?? '',
        fileId: response.data.submissionId,
        studentDepartment: response.data.studentDepartment ?? '',
        studentSemester: response.data.studentSemester ?? '',
        submittedAt: new Date().toISOString(),
      });
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while submitting the assignment');
    }
  };

  const handleEditSubmission = async () => {
    if (!selectedFile || !assignmentId || !submission?.id) return;

    try {
      const formData = new FormData();
      formData.append('submissionId', submission.id);
      formData.append('assignmentId', assignmentId);
      formData.append('studentName', studentName ?? '');
      formData.append('studentRollNumber', studentRollNumber ?? '');
      formData.append('studentEmail', studentEmail ?? '');
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);

      const response = await api.put('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsSubmitted(true);
      setSubmission({
        ...submission,
        fileId: response.data.submissionId,
        submittedAt: new Date().toISOString(),
      });
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while editing the submission');
    }
  };

  const handleUnsubmit = async () => {
    if (!submission || !assignmentId) return;

    try {
      await api.delete('/submissions', {
        data: {
          assignmentId,
          studentRollNumber,
        },
      });

      setSelectedFile(null);
      setIsSubmitted(false);
      setSubmission(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while unsubmitting the assignment');
    }
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
              toolbarColor: COLORS.primary,
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

  // Rename function from saveAndSharePdf to be more generic
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

  // Rename function from sharePdf to be more generic
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

  const handleDownloadFacultyFile = async () => {
    if (!assignment?.fileName) {
      setError('No faculty file available for download');
      return;
    }

    try {
      setDownloading('faculty');
      
      // Extract file extension from original file name
      const fileExtension = assignment.fileName.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `faculty_file_${assignmentId}.${fileExtension}`;
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
        setDownloading(null);
        return;
      }

      // Fetch from server
      const response = await api.get(`/assignments/download?assignmentId=${assignmentId}`, {
        responseType: 'blob',
      });

      // Handle web platform differently
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

      // Try opening file directly
      openFile(fileUri, false);
      setDownloading(null);
      
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'Error',
        'Failed to download file. Please check your internet connection and try again.'
      );
      setDownloading(null);
    }
  };

  const handleDownloadSubmittedFile = async () => {
    if (!submission?.id) {
      setError('No submitted file available for download');
      return;
    }

    try {
      setDownloading('submission');
      
      // Default extension is pdf, but we'll try to extract it if possible
      const fileName = `submission_${submission.id}.pdf`;
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
        setDownloading(null);
        return;
      }

      // Fetch from server
      const response = await api.get(`/submissions/download?submissionId=${submission.id}`, {
        responseType: 'blob',
      });

      // Try to determine file type from content-type header
      const contentType = response.headers['content-type'] || 'application/pdf';
      let fileExtension = 'pdf';
      if (contentType.includes('word')) fileExtension = 'docx';
      if (contentType.includes('presentation')) fileExtension = 'pptx';
      if (contentType.includes('sheet')) fileExtension = 'xlsx';
      
      // Update file path with correct extension
      const actualFileUri = `${FileSystem.documentDirectory}submission_${submission.id}.${fileExtension}`;

      // Handle web platform differently
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
      setDownloading(null);
      
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'Error',
        'Failed to download file. Please check your internet connection and try again.'
      );
      setDownloading(null);
    }
  };

  if (loading || checkingEnrollment) {
    return (
      <View style={styles.container}>
        <Header title="Submit Assignment" />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading assignment details...</Text>
        </View>
      </View>
    );
  }

  if (!isEnrolled) {
    return (
      <View style={styles.container}>
        <Header title="Submit Assignment" />
        <View style={styles.content}>
          <Text style={styles.errorText}>
            You are not enrolled in this course. Please enroll to access assignments.
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error || !assignment) {
    return (
      <View style={styles.container}>
        <Header title="Submit Assignment"  />
        <View style={styles.content}>
          <Text style={styles.errorText}>{error || 'Assignment not found'}</Text>
        </View>
      </View>
    );
  }

  // Debug: Log the raw due date and parsed date
  const dueDate = new Date(assignment.dueDate);

  // Validate the due date
  const isDueDateValid = !isNaN(dueDate.getTime());
  if (!isDueDateValid) {
    console.error('Invalid due date:', assignment.dueDate);
    setError('Invalid due date format. Please contact support.');
    return (
      <View style={styles.container}>
        <Header title="Submit Assignment"  />
        <View style={styles.content}>
          <Text style={styles.errorText}>Invalid due date format. Please contact support.</Text>
        </View>
      </View>
    );
  }

  // Compare timestamps to avoid time zone issues
  const dueDateTimestamp = dueDate.getTime();
  const currentTimestamp = new Date().getTime();
  const isPastDue = dueDateTimestamp < currentTimestamp;
 
  return (
    <View style={styles.container}>
      <Header title="Submit Assignment" />

      <ScrollView style={styles.content}>
        {/* Assignment Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.assignmentName}>{assignment.title}</Text>
          <Text style={styles.courseName}>{assignment.courseId}</Text>

          <View style={styles.dueDateContainer}>
            <Calendar size={16} color={isPastDue ? COLORS.error : COLORS.gray} />
            <Text style={[styles.dueDate, { color: isPastDue ? COLORS.error : COLORS.gray }]}>
              Due: {formatDate(new Date(assignment.dueDate))}
            </Text>
          </View>

          <Text style={styles.description}>{assignment.description || 'No description provided'}</Text>

          {assignment.fileName && (
            <View style={styles.facultyFileContainer}>
              <View style={styles.fileRow}>
                <Text style={styles.metaInfo}>
                  {assignment.fileName}
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
                  <TouchableOpacity 
                    style={[styles.iconButton, downloading === 'faculty' && styles.iconButtonDisabled]} 
                    onPress={() => {
                      const fileExtension = assignment?.fileName?.split('.').pop()?.toLowerCase() || 'pdf';
                      saveAndShareFile(FileSystem.documentDirectory + `faculty_file_${assignmentId}.${fileExtension}`);
                    }}
                    disabled={downloading === 'faculty'}
                  >
                    {downloading === 'faculty' ? (
                      <Download size={18} color="#999" />
                    ) : (
                      <Download size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              {downloading === 'faculty' && (
                <View style={styles.progressBar}>
                  <View style={styles.progressIndicator} />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Submission Card */}
        <View style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Submit Assignment</Text>

          {isPastDue && !isSubmitted && (
            <Text style={styles.pastDueMessage}>
              The due date has passed. Submissions are no longer accepted.
            </Text>
          )}

          {isSubmitted && submission ? (
            <>
              <View style={styles.submittedFile}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>Submitted File</Text>
                  <Text style={styles.submissionDate}>
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity 
                    style={[styles.iconButton, styles.viewButton, downloading === 'submission' && styles.iconButtonDisabled]} 
                    onPress={handleDownloadSubmittedFile}
                    disabled={downloading === 'submission'}
                  >
                    {downloading === 'submission' ? (
                      <Eye size={18} color="#999" />
                    ) : (
                      <Eye size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.iconButton, downloading === 'submission' && styles.iconButtonDisabled]} 
                    onPress={() => saveAndShareFile(FileSystem.documentDirectory + `submission_${submission.id}.pdf`)}
                    disabled={downloading === 'submission'}
                  >
                    {downloading === 'submission' ? (
                      <Download size={18} color="#999" />
                    ) : (
                      <Download size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              {downloading === 'submission' && (
                <View style={styles.progressBar}>
                  <View style={styles.progressIndicator} />
                </View>
              )}
              
              {/* Display grade and feedback if available */}
              {submission.grade && (
                <View style={styles.gradingContainer}>
                  <View style={styles.gradeBox}>
                    <Text style={styles.gradeLabel}>Grade</Text>
                    <Text style={styles.gradeValue}>{submission.grade}</Text>
                  </View>
                  
                  {submission.feedback && (
                    <View style={styles.feedbackBox}>
                      <Text style={styles.feedbackLabel}>Feedback</Text>
                      <Text style={styles.feedbackText}>{submission.feedback}</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Only show unsubmit button if not graded */}
              {!submission.grade && (
                <TouchableOpacity
                  style={styles.unsubmitButton}
                  onPress={handleUnsubmit}
                  disabled={isPastDue}
                >
                  <Text style={styles.unsubmitButtonText}>Unsubmit</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.uploadButton, isPastDue && { opacity: 0.6 }]}
                onPress={handlePick}
                disabled={isPastDue}
              >
                <Upload size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload your file</Text>
              </TouchableOpacity>

              {selectedFile && (
                <View style={styles.selectedFile}>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.iconButton, styles.deleteButton]}
                    onPress={() => setSelectedFile(null)}
                    disabled={isPastDue}
                  >
                    <X size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedFile || isSubmitted || isPastDue) && { opacity: 0.6 },
                ]}
                onPress={submission ? handleEditSubmission : handleSubmit}
                disabled={!selectedFile || isSubmitted || isPastDue}
              >
                <Text style={styles.submitButtonText}>
                  {submission ? 'Update Submission' : 'Submit Assignment'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

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
  pastDueMessage: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  uploadText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  submittedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  fileSize: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  submissionDate: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
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
  deleteButton: {
    backgroundColor: `${COLORS.error}15`,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressIndicator: {
    width: '30%', // Would be dynamic in a real implementation
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  unsubmitButton: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  unsubmitButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
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
  gradingContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  gradeBox: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gradeLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  gradeValue: {
    fontFamily: FONT.bold,
    fontSize: SIZES.lg,
    color: COLORS.primary,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  feedbackBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  feedbackLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  feedbackText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    alignSelf: 'center',
    width: '50%',
  },
  backButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});