import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform, Alert } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Calendar, Upload, X, Download, Eye } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
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

  const { assignmentId: rawAssignmentId } = useLocalSearchParams();
  const assignmentId = Array.isArray(rawAssignmentId) ? rawAssignmentId[0] : rawAssignmentId || '';
  const studentName = profile?.profile.name;
  const studentRollNumber = profile?.profile.id;
  const studentEmail = profile?.profile.email;
  const studentDepartment = profile?.profile.department;
  const studentSemester = profile?.profile.semester;

  useEffect(() => {
    const fetchAssignmentAndSubmission = async () => {
      if (!assignmentId) {
        setError('Assignment ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const assignmentResponse = await api.get(`/assignments/id?assignmentId=${assignmentId}`);
        setAssignment(assignmentResponse.data.assignment);

        const submissionResponse = await api.get(`/submissions?assignmentId=${assignmentId}`);
        const studentSubmission = submissionResponse.data.submissions.find(
          (sub: Submission) => sub.studentRollNumber === studentRollNumber
        );

        if (studentSubmission) {
          setSubmission(studentSubmission);
          setIsSubmitted(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentAndSubmission();
  }, [assignmentId]);

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

  const handleDownloadFacultyFile = async () => {
    if (!assignment?.fileName) {
      setError('No faculty file available for download');
      return;
    }

    try {
      const response = await api.get(`/assignments/download?assignmentId=${assignmentId}`, {
        responseType: 'blob',
      });

      const fileName = `faculty_file_${assignment.fileName}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data]));

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, response.data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const supported = await Linking.canOpenURL(fileUri);
        if (supported) {
          await Linking.openURL(fileUri);
        } else {
          Alert.alert('Success', `File downloaded to ${fileUri}, but no viewer is available`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while downloading the faculty file');
    }
  };

  const handleViewFacultyFile = async () => {
    if (!assignment?.fileName) {
      setError('No faculty file available to view');
      return;
    }

    try {
      const url = `${api.defaults.baseURL}/assignments/download?assignmentId=${assignmentId}`;
      await WebBrowser.openBrowserAsync(url);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while viewing the faculty file');
    }
  };

  const handleDownloadSubmittedFile = async () => {
    if (!submission?.id) {
      setError('No submitted file available for download');
      return;
    }

    try {
      const response = await api.get(`/submissions/download?submissionId=${submission.id}`, {
        responseType: 'blob',
      });

      const fileName = `submitted_file_${submission.id}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data]));

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, response.data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const supported = await Linking.canOpenURL(fileUri);
        if (supported) {
          await Linking.openURL(fileUri);
        } else {
          Alert.alert('Success', `File downloaded to ${fileUri}, but no viewer is available`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while downloading the submitted file');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Submit Assignment" />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading assignment details...</Text>
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
                  <TouchableOpacity style={styles.iconButton} onPress={handleViewFacultyFile}>
                    <Download size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
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
                  <TouchableOpacity style={styles.iconButton} onPress={handleDownloadSubmittedFile}>
                    <Download size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.unsubmitButton}
                onPress={handleUnsubmit}
                disabled={isPastDue}
              >
                <Text style={styles.unsubmitButtonText}>Unsubmit</Text>
              </TouchableOpacity>
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
  },
  deleteButton: {
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 4,
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
});