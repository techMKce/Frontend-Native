import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Calendar, Upload, X, Download, Eye } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  fileId: string; // Submitted file identifier
  submittedAt: string;
}

export default function SubmitAssignmentScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [facultyFileName, setFacultyFileName] = useState<string>('Faculty Assignment File'); // State for faculty file name

  const { id } = useLocalSearchParams(); // Get the assignmentId from route params
 // const BASE_URL = 'https://assignmentservice-2a8o.onrender.com/api';

  // Hardcoded student details (replace with actual user context if available)
  const studentName = 'John Doe';
  const studentRollNumber = 'STU123';

  // Fetch assignment details, submission status, and faculty file name
  useEffect(() => {
    const fetchAssignmentAndSubmission = async () => {
      if (!id) {
        setError('Assignment ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch assignment details
        const assignmentResponse = await fetch(`${BASE_URL}/assignments/id?assignmentId=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!assignmentResponse.ok) {
          throw new Error('Failed to fetch assignment details');
        }

        const assignmentData = await assignmentResponse.json();
        const fetchedAssignment = assignmentData.assignment;
        setAssignment(fetchedAssignment);

        // Check if the assignment is overdue
        const dueDate = new Date(fetchedAssignment.dueDate);
        const currentDate = new Date();
        if (dueDate < currentDate) {
          setIsOverdue(true);
        }

        // Fetch the faculty file name if fileNo exists
        if (fetchedAssignment.fileNo) {
          const fileResponse = await fetch(
            `${BASE_URL}/assignments/download?fileId=${fetchedAssignment.fileNo}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            setFacultyFileName(fileData.filename || 'Faculty Assignment File'); // Fallback to default if filename is not found
          } else {
            console.warn('Failed to fetch faculty file name, using default');
          }
        }

        // Fetch submission details for this assignment and student
        const submissionResponse = await fetch(
          `${BASE_URL}/submissions?assignmentId=${id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
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
  }, [id]);

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
    if (!selectedFile || !id || isOverdue) return;

    try {
      const formData = new FormData();
      formData.append('assignmentId', id as string);
      formData.append('studentName', studentName);
      formData.append('studentRollNumber', studentRollNumber);
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
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      const data = await response.json();
      setIsSubmitted(true);
      setSubmission({
        id: data.submissionId,
        assignmentId: id as string,
        studentName,
        studentRollNumber,
        fileId: data.submissionId, // Assuming the fileId is the same as submissionId
        submittedAt: new Date().toISOString(),
      });
      setSelectedFile(null); // Clear the selected file after submission
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting the assignment');
    }
  };

  const handleEditSubmission = async () => {
    if (!selectedFile || !id || !submission?.id || isOverdue) return;

    try {
      const formData = new FormData();
      formData.append('submissionId', submission.id);
      formData.append('assignmentId', id as string);
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
        },
      });

      if (!response.ok) {
        throw new Error('Failed to edit submission');
      }

      const data = await response.json();
      setIsSubmitted(true);
      setSubmission({
        ...submission,
        fileId: data.submissionId, // Update fileId if the backend returns a new one
        submittedAt: new Date().toISOString(),
      });
      setSelectedFile(null); // Clear the selected file after editing
    } catch (err: any) {
      setError(err.message || 'An error occurred while editing the submission');
    }
  };

  const handleUnsubmit = async () => {
    if (!submission || !id || isOverdue) return;

    try {
      const response = await fetch(`${BASE_URL}/submissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: id,
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
    if (!assignment?.fileNo) return;

    try {
      const response = await fetch(
        `${BASE_URL}/assignments/download?fileId=${assignment.fileNo}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download faculty file');
      }

      const data = await response.blob();
      const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'faculty_file.pdf';

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to read response body');

        await FileSystem.writeAsStringAsync(fileUri, '', { encoding: FileSystem.EncodingType.Base64 });
        const result = await reader.read();
        if (!result.done) {
          await FileSystem.writeAsStringAsync(fileUri, Buffer.from(result.value).toString('base64'), {
            encoding: FileSystem.EncodingType.Base64,
          });
          Linking.openURL(fileUri);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while downloading the faculty file');
    }
  };

  const handleViewFacultyFile = async () => {
    if (!assignment?.fileNo) return;

    try {
      const response = await fetch(
        `${BASE_URL}/assignments/download?fileId=${assignment.fileNo}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to view faculty file');
      }

      const data = await response.blob();
      const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'faculty_file.pdf';

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(data);
        window.open(url, '_blank');
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to read response body');

        await FileSystem.writeAsStringAsync(fileUri, '', { encoding: FileSystem.EncodingType.Base64 });
        const result = await reader.read();
        if (!result.done) {
          await FileSystem.writeAsStringAsync(fileUri, Buffer.from(result.value).toString('base64'), {
            encoding: FileSystem.EncodingType.Base64,
          });
          const supported = await Linking.canOpenURL(fileUri);
          if (supported) {
            await Linking.openURL(fileUri);
          } else {
            setError('Cannot open file: No viewer available');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while viewing the faculty file');
    }
  };

  const handleDownloadSubmittedFile = async () => {
    if (!submission?.id) return;

    try {
      const response = await fetch(
        `${BASE_URL}/submissions/download?submissionId=${submission.id}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download submitted file');
      }

      const data = await response.blob();
      const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'submitted_file.pdf';

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to read response body');

        await FileSystem.writeAsStringAsync(fileUri, '', { encoding: FileSystem.EncodingType.Base64 });
        const result = await reader.read();
        if (!result.done) {
          await FileSystem.writeAsStringAsync(fileUri, Buffer.from(result.value).toString('base64'), {
            encoding: FileSystem.EncodingType.Base64,
          });
          Linking.openURL(fileUri);
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
                    <Eye size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={handleDownloadFacultyFile}>
                    <Download size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Submission Card */}
        <View style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Submit Your Work</Text>

          {isOverdue && !isSubmitted && (
            <View style={styles.overdueContainer}>
              <X size={16} color={COLORS.error} />
              <Text style={styles.overdueText}>Due Date Over</Text>
            </View>
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
                    <Download size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.unsubmitButton}
                onPress={handleUnsubmit}
                disabled={isOverdue}
              >
                <Text style={styles.unsubmitButtonText}>Unsubmit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={handlePick}
                disabled={isOverdue}
              >
                <Upload size={24} color={isOverdue ? COLORS.gray : COLORS.primary} />
                <Text style={[styles.uploadText, isOverdue && { color: COLORS.gray }]}>
                  Upload your file
                </Text>
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
                    <X size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedFile || isSubmitted || isOverdue) && { opacity: 0.6 },
                ]}
                onPress={submission ? handleEditSubmission : handleSubmit}
                disabled={!selectedFile || isSubmitted || isOverdue}
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    flex: 1, 
    padding: SPACING.md 
  },

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
    padding: SPACING.sm,
    flexWrap: 'wrap', // Allow wrapping for long filenames
  },
  metaInfo: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm, // Reduced font size for better fit
    color: COLORS.darkGray,
    flex: 1, // Allow the text to take available space
    marginRight: SPACING.xs, // Add margin to separate from buttons
  },
  fileActions: {
    flexDirection: 'row',
    gap: SPACING.xs, // Reduced gap for better fit on mobile
    minWidth: 80, // Ensure buttons have enough space
  },
  iconButton: {
    padding: SPACING.sm, // Increased padding for better touch target
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
    backgroundColor: `${COLORS.error}20`, // Light red background
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  overdueText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  overdueSubText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    flex: 1,
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
    backgroundColor: COLORS.gray,
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