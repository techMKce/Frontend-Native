import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Checkbox } from 'react-native-paper';
import dayjs from 'dayjs';
import api from '@/service/api'; // Adjust the import path as necessary
import Header from '@/components/shared/Header';

interface Course {
  id: string;
  courseId: string;
  name: string;
  facultyName: string;
  isEnabled: boolean;
}

interface ScheduleEntry {
  id: string;
  courseId: string;
  courseName: string;
  facultyName: string;
  fromDate: string;
  toDate: string;
}

export default function ScheduleManagementScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Fetch active courses from backend on mount
    const fetchCourses = async () => {
      try {
        const response = await api.get('/course/active');
        const data = response.data;
        console.log('Fetched courses:', data);

        if (!Array.isArray(data)) {
          Alert.alert('Error', 'Failed to fetch courses');
          setCourses([]);
          return;
        }

        const mappedCourses: Course[] = data.map((item: any) => ({
          id: String(item.course_id),
          courseId: item.courseTitle,
          name: item.courseTitle,
          facultyName: item.instructorName,
          isEnabled: item.isActive,
        }));

        const enabledCourses = mappedCourses.filter(course => course.isEnabled);
        setCourses(enabledCourses);
      } catch (error) {
        Alert.alert('Error', 'Error fetching courses from server');
        setCourses([]);
      }
    };

    fetchCourses();
  }, []);

  const toggleCourse = (id: string) => {
    setSelectedCourses(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const validateInputs = (): boolean => {
    if (selectedCourses.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one course');
      return false;
    }
    if (!fromDate || !toDate) {
      Alert.alert('Validation Error', 'Please select both from and to dates');
      return false;
    }
    if (dayjs(fromDate).isAfter(dayjs(toDate))) {
      Alert.alert('Validation Error', 'From date must be before To date');
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    setSuccessMessage('');

    const schedule = selectedCourses.map((courseId, index) => {
      const course = courses.find(c => c.id === courseId);
      return {
        id: (index + 1).toString(),
        courseId: course?.id || '',
        courseName: course?.name || '',
        facultyName: course?.facultyName || '',
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0],
      };
    });

    // Prepare form data as per backend expectations
    const courseArray = schedule.map(entry => ({
      courseId: entry.courseId,
      name: entry.courseName,
    }));

    const duration = {
      startDate: fromDate.toISOString().split('T')[0],
      endDate: toDate.toISOString().split('T')[0],
    };

    const formData = new FormData();
    formData.append('courses', JSON.stringify(courseArray));
    formData.append('duration', JSON.stringify(duration));

    try {
      const response = await api.post('/postexam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setGeneratedSchedule(response.data);
      setSuccessMessage('Schedule generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFromDate(selectedDate);
      if (dayjs(toDate).isBefore(dayjs(selectedDate))) {
        setToDate(selectedDate); // Adjust toDate if earlier than fromDate
      }
    }
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  const calculateDuration = () => {
    const diff = dayjs(toDate).diff(dayjs(fromDate), 'day');
    return diff >= 0 ? `${diff + 1} days` : 'Invalid range';
  };

  return (
    <View style={styles.container}>
      <Header title="Schedule" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Courses Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Courses</Text>
          <Text style={styles.subtext}>Select courses to create schedule</Text>
          {courses.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 20, color: '#666' }}>
              No courses available
            </Text>
          ) : (
            courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => toggleCourse(course.id)}
              >
                <Checkbox
                  status={selectedCourses.includes(course.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleCourse(course.id)}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.courseName}>{course.courseId} - {course.name}</Text>
                  <Text style={styles.facultyName}>Faculty: {course.facultyName}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Date Pickers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule Period</Text>
          <Text style={styles.subtext}>Select the date range for the schedule</Text>

          {/* From Date */}
          <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.datePicker}>
            <Text style={styles.datePickerLabel}>From Date:</Text>
            <Text style={styles.datePickerValue}>{dayjs(fromDate).format('MMM D, YYYY')}</Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="date"
              display="default"
              onChange={onFromDateChange}
              maximumDate={toDate}
            />
          )}

          {/* To Date */}
          <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.datePicker}>
            <Text style={styles.datePickerLabel}>To Date:</Text>
            <Text style={styles.datePickerValue}>{dayjs(toDate).format('MMM D, YYYY')}</Text>
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="date"
              display="default"
              onChange={onToDateChange}
              minimumDate={fromDate}
            />
          )}

          {/* Duration Display */}
          <View style={styles.durationBox}>
            <Text style={styles.durationText}>Duration: {calculateDuration()}</Text>
          </View>
        </View>

        {/* Generate Button */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={handleGenerate}
            style={[styles.generateButton, (isGenerating || selectedCourses.length === 0) && styles.buttonDisabled]}
            disabled={isGenerating || selectedCourses.length === 0}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {generatedSchedule.length > 0 ? 'Generated ✓' : 'Generate Schedule'}
              </Text>
            )}
          </TouchableOpacity>

          {(!selectedCourses.length || !fromDate || !toDate) && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {!selectedCourses.length && 'Select at least one course. '}
                {!fromDate && 'Choose start date. '}
                {!toDate && 'Choose end date.'}
              </Text>
            </View>
          )}

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}
        </View>

        {/* Display Generated Schedule */}
        {generatedSchedule.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Generated Schedule</Text>
            {generatedSchedule.map(entry => (
              <View key={entry.id} style={styles.scheduleItem}>
                <Text style={styles.scheduleCourse}>{entry.courseName}</Text>
                <Text style={styles.scheduleFaculty}>Faculty: {entry.facultyName}</Text>
                <Text style={styles.scheduleDates}>
                  From: {dayjs(entry.fromDate).format('MMM D, YYYY')} - To: {dayjs(entry.toDate).format('MMM D, YYYY')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f6fa' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  facultyName: {
    fontSize: 13,
    color: '#555',
  },
  datePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
  },
  durationBox: {
    marginTop: 16,
    backgroundColor: '#e0f0ff',
    padding: 10,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2165c2',
  },
  generateButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a3c3f9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  warningBox: {
    marginTop: 12,
    backgroundColor: '#fff4e5',
    padding: 10,
    borderRadius: 6,
  },
  warningText: {
    color: '#a66d00',
    fontSize: 14,
  },
  successBox: {
    marginTop: 12,
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 6,
  },
  successText: {
    color: '#155724',
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleItem: {
    marginBottom: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  scheduleCourse: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  scheduleFaculty: {
    fontSize: 14,
    color: '#555',
  },
  scheduleDates: {
    fontSize: 13,
    color: '#666',
  },
});
