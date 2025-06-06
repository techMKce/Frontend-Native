import React, { useState, useEffect, useContext } from 'react';
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
import Toast from 'react-native-toast-message';
import api from '@/service/api';
import Header from '@/components/shared/Header';
import { AuthContext } from '@/context/AuthContext';

interface Course {
  id: string;
  courseId: string;
  name: string;
  description: string;
  facultyId: string;
  facultyName: string;
  isEnabled: boolean;
}

export default function ScheduleManagementScreen() {
  const authContext = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await api.get('/course/active');
        const data = response.data;
        if (!Array.isArray(data)) {
          setCourses([]);
          return;
        }
        const mappedCourses: Course[] = data.map((item: any) => ({
          id: String(item.course_id),
          courseId: item.courseTitle,
          name: item.courseTitle,
          description: item.courseDescription,
          facultyId: "",
          facultyName: item.instructorName,
          isEnabled: item.isActive,
        }));
        const enabledCourses = mappedCourses.filter((course) => course.isEnabled);
        setCourses(enabledCourses);
      } catch (error) {
        setCourses([]);
        Toast.show({ type: 'error', text1: 'Failed to load courses' });
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseSelection = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses((prev) => [...prev, courseId]);
    } else {
      setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
    }
  };

  const handleGenerate = async () => {
    if (selectedCourses.length === 0) {
      Toast.show({ type: 'error', text1: 'Please select at least one course' });
      return;
    }
    if (!fromDate || !toDate) {
      Toast.show({ type: 'error', text1: 'Please select both from and to dates' });
      return;
    }
    if (fromDate >= toDate) {
      Toast.show({ type: 'error', text1: 'From date must be before to date' });
      return;
    }

    setIsGenerating(true);

    // Prepare schedule data
    const schedule = selectedCourses.map((courseId, index) => {
      const course = courses.find((c) => c.id === courseId);
      return {
        id: (index + 1).toString(),
        courseId: course?.id || "",
        courseName: course?.name || "",
        facultyName: course?.facultyName || "",
        fromDate: fromDate.toISOString().split("T")[0],
        toDate: toDate.toISOString().split("T")[0],
      };
    });

    const formData = new FormData();
    const courseArray = schedule.map(entry => ({
      courseId: entry.courseId,
      name: entry.courseName,
    }));
    const duration = {
      startDate: new Date(new Date(fromDate).setDate(fromDate.getDate() + 1)).toISOString().split("T")[0],
      endDate: new Date(new Date(toDate).setDate(toDate.getDate() + 1)).toISOString().split("T")[0],
    };

    formData.append("courses", JSON.stringify(courseArray));
    formData.append("duration", JSON.stringify(duration));

    try {
      const response = await api.post('/attendance/postexam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data === "Warning: Not all courses were scheduled.\nChoose a valid date range based on course counts.") {
        Toast.show({ type: 'error', text1: 'Warning', text2: 'Not all courses were scheduled. Choose a valid date range based on course counts.' });
      } else {
        Toast.show({ type: 'success', text1: `Schedule data prepared for ${courseArray.length} course(s)` });
        Toast.show({ type: 'success', text1: 'Schedule uploaded successfully' });
      }
      // Optionally: setGeneratedSchedule(response.data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to upload schedule' });
    } finally {
      setIsGenerating(false);
    }
  };

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFromDate(selectedDate);
      if (toDate && dayjs(toDate).isBefore(dayjs(selectedDate))) {
        setToDate(selectedDate);
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
    if (!fromDate || !toDate) return '';
    const diff = dayjs(toDate).diff(dayjs(fromDate), 'day');
    return diff >= 0 ? `${diff + 1} days` : 'Invalid range';
  };

  return (
    <View style={styles.container}>
      <Header title="Schedule Management" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Courses Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Courses</Text>
          <Text style={styles.subtext}>Select courses to create schedule</Text>
          {isLoadingCourses ? (
            <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
          ) : courses.length === 0 ? (
            <Text style={styles.noCoursesText}>No courses available</Text>
          ) : (
            courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => handleCourseSelection(course.id, !selectedCourses.includes(course.id))}
                disabled={!course.isEnabled}
              >
                <Checkbox
                  status={selectedCourses.includes(course.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleCourseSelection(course.id, !selectedCourses.includes(course.id))}
                  disabled={!course.isEnabled}
                  color={course.isEnabled ? '#1a73e8' : '#999'}
                />
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>
                    {course.courseId} - {course.name}
                  </Text>
                  <Text style={styles.facultyName}>Faculty: {course.facultyName}</Text>
                  <Text style={styles.courseDetails}>
                    {course.description}
                  </Text>
                  {!course.isEnabled && (
                    <Text style={styles.inactiveLabel}>Inactive</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Date Pickers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule Period</Text>
          <Text style={styles.subtext}>Select the date range for the schedule</Text>
          <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.datePicker}>
            <Text style={styles.datePickerLabel}>From Date:</Text>
            <Text style={styles.datePickerValue}>
              {fromDate ? dayjs(fromDate).format('MMM D, YYYY') : 'Pick start date'}
            </Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display="default"
              onChange={onFromDateChange}
              maximumDate={toDate}
            />
          )}

          <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.datePicker}>
            <Text style={styles.datePickerLabel}>To Date:</Text>
            <Text style={styles.datePickerValue}>
              {toDate ? dayjs(toDate).format('MMM D, YYYY') : 'Pick end date'}
            </Text>
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display="default"
              onChange={onToDateChange}
              minimumDate={fromDate}
            />
          )}

          {fromDate && toDate && (
            <View style={styles.durationBox}>
              <Text style={styles.durationText}>
                Duration: {calculateDuration()}
              </Text>
            </View>
          )}
        </View>

        {/* Generate Button */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={handleGenerate}
            style={[
              styles.generateButton,
              (isGenerating || selectedCourses.length === 0) && styles.buttonDisabled
            ]}
            disabled={isGenerating || selectedCourses.length === 0}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generate Schedule</Text>
            )}
          </TouchableOpacity>
          {(selectedCourses.length === 0 || !fromDate || !toDate) && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {selectedCourses.length === 0 && 'Select at least one course. '}
                {!fromDate && 'Choose start date. '}
                {!toDate && 'Choose end date.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <Toast />
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
  noCoursesText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666'
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  courseInfo: {
    flex: 1,
    marginLeft: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  facultyName: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  courseDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inactiveLabel: {
    fontSize: 11,
    color: '#cc0000',
    marginTop: 4,
    fontWeight: 'bold',
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
});