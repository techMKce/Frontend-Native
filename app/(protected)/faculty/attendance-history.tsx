import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '@/components/shared/Header';
import api from '@/service/api';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

interface AttendanceRecord {
  id: number;
  dates: string;
  deptName: string;
  batch: string;
  courseName: string;
  sem: string;
  session: string;
  stdId: string;
  stdName: string;
  rollNum: string;
  status: number;
}

interface Course {
  courseId: string;
  courseName: string;
}

interface Assignment {
  courseId: string;
  [key: string]: any;
}

interface CourseDetails {
  courseTitle?: string;
  [key: string]: any;
}

interface Stats {
  total: number;
  present: number;
  absent: number;
}

export default function AttendanceHistoryScreen() {
  const { profile } = useAuth();
  const facultyId = profile?.profile?.id;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showFN, setShowFN] = useState(false);
  const [showAN, setShowAN] = useState(false);

  // Fetch faculty courses on mount
  const fetchCourses = useCallback(async () => {
    if (!facultyId) {
      Alert.alert('Error', 'Faculty ID not found');
      return;
    }

    setCoursesLoading(true);
    try {
      const assignmentsResponse = await api.get(`/faculty-student-assigning/admin/faculty/${facultyId}`);
      
      if (!assignmentsResponse.data || !Array.isArray(assignmentsResponse.data)) {
        setCourses([]);
        return;
      }

      const courseIds: string[] = [
        ...new Set(assignmentsResponse.data.map((assignment: Assignment) => assignment.courseId)),
      ].filter(Boolean); // Remove null/undefined values

      if (courseIds.length === 0) {
        setCourses([]);
        return;
      }

      const coursePromises = courseIds.map(async (courseId) => {
        try {
          const courseResponse = await api.get(`course/detailsbyId`, {
            params: { id: courseId },
          });
          
          const courseData: CourseDetails[] = courseResponse.data;
          const courseTitle = courseData?.[0]?.courseTitle || `Course ${courseId}`;
          
          return {
            courseId: String(courseId),
            courseName: String(courseTitle),
          } as Course;
        } catch (error) {
          console.warn(`Failed to fetch course ${courseId}:`, error);
          return {
            courseId: String(courseId),
            courseName: `Course ${courseId}`,
          } as Course;
        }
      });

      const fetchedCourses: Course[] = await Promise.all(coursePromises);
      setCourses(fetchedCourses.filter(course => course.courseId && course.courseName));
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses');
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch attendance for selected course and date
  const fetchAttendance = useCallback(async () => {
    if (!selectedCourse || !selectedDate || !facultyId) {
      return;
    }

    setLoading(true);
    setAttendanceRecords([]);
    setShowFN(false);
    setShowAN(false);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await api.get(
        `/attendance/getfacultybydate?facultyid=${facultyId}&courseid=${selectedCourse.courseId}&date=${dateStr}`
      );
      
      const records = response.data || [];
      setAttendanceRecords(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      Alert.alert('Error', 'Failed to fetch attendance records');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedDate, facultyId]);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      fetchAttendance();
    }
  }, [fetchAttendance]);

  // Split records by session
  const fnRecords = attendanceRecords.filter((r) => r.session?.toLowerCase() === 'fn');
  const anRecords = attendanceRecords.filter((r) => r.session?.toLowerCase() === 'an');

  // Stats calculation
  const getStats = (records: AttendanceRecord[]): Stats => {
    const total = records.length;
    const present = records.filter((r) => r.status === 1).length;
    const absent = total - present;
    return { total, present, absent };
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setSelectedDate(null); // Reset date when course changes
    setAttendanceRecords([]); // Clear previous records
    setShowDateModal(true);
  };

  const handleDateConfirm = () => {
    setShowDateModal(false);
    if (selectedCourse && selectedDate) {
      fetchAttendance();
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={[
        styles.courseCard,
        selectedCourse?.courseId === item.courseId && styles.selectedCard,
      ]}
      onPress={() => handleCourseSelect(item)}
    >
      <Text style={styles.courseTitle} numberOfLines={2}>
        {item.courseName}
      </Text>
      <Ionicons name="calendar-outline" size={22} color="#007BFF" />
    </TouchableOpacity>
  );

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => (
    <View
      style={[
        styles.recordRow,
        item.status === 1 ? styles.presentRow : styles.absentRow,
      ]}
    >
      <Text style={styles.recordText} numberOfLines={1}>
        {item.stdId || item.rollNum || 'N/A'}
      </Text>
      <Text style={styles.recordText} numberOfLines={1}>
        {item.stdName || 'Unknown'}
      </Text>
      <Text
        style={[
          styles.statusText,
          item.status === 1 ? styles.presentText : styles.absentText,
        ]}
      >
        {item.status === 1 ? 'Present' : 'Absent'}
      </Text>
    </View>
  );

  const renderSessionCard = (title: string, records: AttendanceRecord[], isExpanded: boolean, setExpanded: (value: boolean) => void) => (
    <View style={styles.sessionCard}>
      <TouchableOpacity
        style={styles.sessionHeader}
        onPress={() => setExpanded(!isExpanded)}
      >
        <Text style={styles.sessionTitle}>{title}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#007BFF"
        />
      </TouchableOpacity>
      {isExpanded && (
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Roll No</Text>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Status</Text>
          </View>
          <FlatList
            data={records}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={renderAttendanceRecord}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.statsRow}>
            <Text>Total: {getStats(records).total}</Text>
            <Text style={styles.presentStatsText}>Present: {getStats(records).present}</Text>
            <Text style={styles.absentStatsText}>Absent: {getStats(records).absent}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Attendance History" />
      <View style={styles.content}>
        <Text style={styles.heading}>Select a Course</Text>
        
        {coursesLoading ? (
          <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.courseId}
            renderItem={renderCourseItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No courses assigned.</Text>
            }
          />
        )}

        {/* Date Picker Modal */}
        <Modal visible={showDateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    setShowDateModal(false);
                    if (event.type === 'set' && date) {
                      setSelectedDate(date);
                    }
                  } else if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowDateModal(false);
                      setSelectedDate(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleDateConfirm}
                  >
                    <Text style={styles.confirmButtonText}>View Attendance</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Attendance Results */}
        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />
        ) : selectedCourse && selectedDate ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultTitle}>
              {selectedCourse.courseName} - {formatDate(selectedDate)}
            </Text>
            
            {/* FN Session */}
            {fnRecords.length > 0 && 
              renderSessionCard("Forenoon (FN) Session", fnRecords, showFN, setShowFN)
            }
            
            {/* AN Session */}
            {anRecords.length > 0 && 
              renderSessionCard("Afternoon (AN) Session", anRecords, showAN, setShowAN)
            }
            
            {fnRecords.length === 0 && anRecords.length === 0 && (
              <Text style={styles.emptyText}>No attendance records for this date.</Text>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>Select a course and date to view attendance.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  content: { 
    flex: 1, 
    padding: 16 
  },
  heading: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12, 
    color: '#222' 
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-between',
  },
  selectedCard: {
    borderColor: '#007BFF',
    borderWidth: 2,
  },
  courseTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  emptyText: { 
    textAlign: 'center', 
    color: '#888', 
    marginTop: 32,
    fontSize: 16,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    width: '100%',
  },
  modalButton: { 
    flex: 1, 
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 24,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sessionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#007BFF' 
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f4fa',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  headerCell: { 
    flex: 1, 
    fontWeight: 'bold', 
    color: '#333',
    fontSize: 14,
  },
  recordRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordText: { 
    flex: 1, 
    fontSize: 14, 
    color: '#222' 
  },
  statusText: { 
    fontWeight: 'bold', 
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  presentRow: { 
    backgroundColor: '#e8f5e8' 
  },
  absentRow: { 
    backgroundColor: '#fdeaea' 
  },
  presentText: { 
    color: '#28a745' 
  },
  absentText: { 
    color: '#dc3545' 
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  presentStatsText: {
    color: '#28a745',
    fontWeight: '500',
  },
  absentStatsText: {
    color: '#dc3545',
    fontWeight: '500',
  },
});