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
import { BASE_URL } from '@/service/api';

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
  fileId: string;
  studentDepartment: string;
  studentSemester: string; // Submitted file identifier
  submittedAt: string;
}

export default function SubmitAssignmentScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useLocalSearchParams(); // Get the assignmentId from route params
  const assignmentId = id as string;
  //const BASE_URL = 'https://assignmentservice-2a8o.onrender.com/api';

  // Hardcoded student details (replace with actual user context if available)
  const studentName = 'John Doe';
  const studentRollNumber = 'STU123';
  const studentDepartment='CSE';
  const studentSemester='3';
  // Fetch assignment details and submission status
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
        const assignmentResponse = await fetch(`${BASE_URL}/assignments/id?assignmentId=${assignmentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers if needed, e.g.:
            // Authorization: `Bearer ${yourToken}`,
          },
        });

        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment details');
        }

        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData.assignment);

        // Fetch submission details for this assignment and student
        const submissionResponse = await fetch(
          `${BASE_URL}/submissions?assignmentId=${assignmentId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Add authentication headers if needed
            },
          }
        );

        if (!submissionResponse.ok) {
          throw new Error('Failed to fetch submission details');
        }

        const submissionData = await submissionResponse.json();
        const studentSubmission = submissionData.submissions.find(
          (sub: Submission) => sub.studentRollNumber === studentRollNumber
        );

        if (studentSubmission) {
          setSubmission(studentSubmission);
          setIsSubmitted(true);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentAndSubmission();
  }, [assignmentId]);

  const handlePick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled) {
        setSelectedFile(res.assets[0]);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to pick file');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !assignmentId) return;

    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('studentName', studentName);
      formData.append('studentRollNumber', studentRollNumber);
      formData.append('studentDepartment',studentDepartment);
      formData.append('studentSemester',studentSemester);
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);

      const response = await fetch(`${BASE_URL}/submissions`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add authentication headers if needed
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      const data = await response.json();
      setIsSubmitted(true);
      setSubmission({
        id: data.submissionId,
        assignmentId,
        studentName,
        studentRollNumber,
        fileId: data.submissionId,
        studentDepartment:data.studentDepartment,
        studentSemester:data.studentSemester,
        submittedAt: new Date().toISOString(),
      });
      setSelectedFile(null);

      // Redirect to StudentAssignmentsScreen
      router.replace('/assignments');
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting the assignment');
    }
  };

  const handleEditSubmission = async () => {
    if (!selectedFile || !assignmentId || !submission?.id) return;

    try {
      const formData = new FormData();
      formData.append('submissionId', submission.id);
      formData.append('assignmentId', assignmentId);
      formData.append('studentName', studentName);
      formData.append('studentRollNumber', studentRollNumber);
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);

      const response = await fetch(`${BASE_URL}/submissions`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add authentication headers if needed
        },
      });

      if (!response.ok) {
        throw new Error('Failed to edit submission');
      }

      const data = await response.json();
      setIsSubmitted(true);
      setSubmission({
        ...submission,
        fileId: data.submissionId,
        submittedAt: new Date().toISOString(),
      });
      setSelectedFile(null);

      // Redirect to StudentAssignmentsScreen
      router.replace('/assignments');
    } catch (err: any) {
      setError(err.message || 'An error occurred while editing the submission');
    }
  };

  const handleUnsubmit = async () => {
    if (!submission || !assignmentId) return;

    try {
      const response = await fetch(`${BASE_URL}/submissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
        },
        body: JSON.stringify({
          assignmentId,
          studentRollNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubmit assignment');
      }

      setSelectedFile(null);
      setIsSubmitted(false);
      setSubmission(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while unsubmitting the assignment');
    }
  };

  const handleDownloadFacultyFile = async () => {
    if (!assignment?.fileNo) {
      setError('No faculty file available for download');
      return;
    }

    const url = `${BASE_URL}/assignments/download?assignmentId=${assignmentId}`;
    const fileName = `faculty_file_${assignment.fileNo}.pdf`;

    try {
      if (Platform.OS === 'web') {
        // For web, fetch the file and trigger a download
        const response = await fetch(url, {
          headers: {
            // Add authentication headers if needed, e.g.:
            // Authorization: `Bearer ${yourToken}`,
          },
        });
        if (!response.ok) throw new Error('Failed to download faculty file');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        // For mobile, save to file system and open
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const response = await FileSystem.downloadAsync(url, fileUri, {
          headers: {
            // Add authentication headers if needed
          },
        });
        if (response.status !== 200) {
          throw new Error('Failed to download faculty file');
        }
        const supported = await Linking.canOpenURL(response.uri);
        if (supported) {
          await Linking.openURL(response.uri);
        } else {
          Alert.alert('Success', `File downloaded to ${response.uri}, but no viewer is available`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while downloading the faculty file');
    }
  };

  const handleViewFacultyFile = async () => {
    if (!assignment?.fileNo) {
      setError('No faculty file available to view');
      return;
    }

    const url = `${BASE_URL}/assignments/download?assignmentId=${assignmentId}`;
    try {
      // Option 1: Open in external browser
      await WebBrowser.openBrowserAsync(url);
      // Option 2: Navigate to in-app PDFPreview screen (uncomment if using WebView)
      // router.push({ pathname: '/PDFPreview', params: { url } });
    } catch (err: any) {
      setError(err.message || 'An error occurred while viewing the faculty file');
    }
  };

  const handleDownloadSubmittedFile = async () => {
    if (!submission?.id) {
      setError('No submitted file available for download');
      return;
    }

    const url = `${BASE_URL}/submissions/download?submissionId=${submission.id}`;
    const fileName = `submitted_file_${submission.id}.pdf`;

    try {
      if (Platform.OS === 'web') {
        const response = await fetch(url, {
          headers: {
            // Add authentication headers if needed
          },
        });
        if (!response.ok) throw new Error('Failed to download submitted file');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const response = await FileSystem.downloadAsync(url, fileUri, {
          headers: {
            // Add authentication headers if needed
          },
        });
        if (response.status !== 200) {
          throw new Error('Failed to download submitted file');
        }
        const supported = await Linking.canOpenURL(response.uri);
        if (supported) {
          await Linking.openURL(response.uri);
        } else {
          Alert.alert('Success', `File downloaded to ${response.uri}, but no viewer is available`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while downloading the submitted file');
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
        <Header title="Submit Assignment" />
        <View style={styles.content}>
          <Text style={styles.errorText}>{error || 'Assignment not found'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Submit Assignment" />

      <ScrollView style={styles.content}>
        {/* Assignment Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.assignmentName}>{assignment.title}</Text>
          <Text style={styles.courseName}>{assignment.courseId}</Text>

          <View style={styles.dueDateContainer}>
            <Calendar size={16} color={COLORS.gray} />
            <Text style={styles.dueDate}>
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.description}>{assignment.description || 'No description provided'}</Text>

          {assignment.fileNo && (
            <View style={styles.facultyFileContainer}>
              <View style={styles.fileRow}>
                <Text style={styles.metaInfo}>
                  {assignment.fileNo}
                </Text>
                <View style={styles.fileActions}>
                  <TouchableOpacity style={styles.iconButton} onPress={handleViewFacultyFile}>
                    <Download size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  {/* <TouchableOpacity style={styles.iconButton} onPress={handleDownloadFacultyFile}>
                    <Download size={18} color={COLORS.primary} />
                  </TouchableOpacity> */}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Submission Card */}
        <View style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Submit Assignment</Text>

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
              >
                <Text style={styles.unsubmitButtonText}>Unsubmit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.uploadButton} onPress={handlePick}>
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
                  >
                    <X size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedFile || isSubmitted) && { opacity: 0.6 },
                ]}
                onPress={submission ? handleEditSubmission : handleSubmit}
                disabled={!selectedFile || isSubmitted}
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
    backgroundColor: COLORS.green,
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