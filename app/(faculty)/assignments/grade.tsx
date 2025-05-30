
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
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import Api from '@/service/api';

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
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dueDate, setDueDate] = useState<string>('');
  const [assignmentTitle, setAssignmentTitle] = useState<string>('');
  const [gradedCount, setGradedCount] = useState<number>(0);


  useEffect(() => {
    if (!assignmentId) {
      console.error("Invalid assignment ID.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [assignmentRes, submissionRes, gradingRes] = await Promise.all([
          Api.get(`/assignments/id`, {
            params: { assignmentId },
          }),
          Api.get(  `/submissions`, {
           params: { assignmentId },
}),
          Api.get(`/gradings`, {
            params: { assignmentId },
          }),
        ]);

        const assignment = assignmentRes.data.assignment;
        if (assignment) {
          setAssignmentTitle(assignment.title);
          setDueDate(assignment.dueDate);
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

        const graded = mergedSubmissions.filter((s) => s.grade).length;
        setGradedCount(graded);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId]);

  
const handleDownloadReport = async () => {
  

    const url = `https://assignmentservice-2a8o.onrender.com/api/gradings/download?assignmentId=${assignmentId}`;
    try {
      await WebBrowser.openBrowserAsync(url);

    } catch (err: any) {
     console.log(err.message || 'An error occurred while viewing the faculty file');
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
        onPress={() => router.push('/(faculty)/assignments')}
        style={styles.backLink}
      >
        <Text style={styles.backLinkText}>← Back to Assignments</Text>
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

      {/* Download Report Button */}
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
        <Text style={[styles.headerCell, { flex: 2 }]}>Student</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Roll Number</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Submitted On</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Action</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <View style={[styles.studentInfo, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
              <Icon name="person-circle-outline" size={36} color="#888" />
              <Text style={[styles.studentName, { marginLeft: 10 }]}>{item.studentName}</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.roll}>{item.studentRollNumber}</Text>
            </View>
            <View style={[styles.submittedOn, { flex: 1, justifyContent: 'center' }]}>
              <Icon name="time-outline" size={14} color="#555" />
              <Text style={styles.date}>
                {new Date(item.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                router.push({
                  pathname: item.grade
                    ? '/(faculty)/assignments/ViewGradedSubmissionScreen'
                    : '/(faculty)/assignments/GradeSubmissionScreen',
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
    textAlign: 'center',
  },
  submittedOn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
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
  // New styles for the download button
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