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
  courseCode: string | null;
  courseTitle: string;
  courseDescription: string;
  facultyName: string;
  isActive: boolean;
  dept: string;
  credit: number;
  duration: number;
}

export default function ScheduleManagementScreen() {
  const authContext = useContext(AuthContext);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!authContext?.isAuthenticated || !authContext.profile?.token) {
        Alert.alert('Authentication Required', 'Please login to access this feature');
        setIsLoadingCourses(false);
        return;
      }

      setIsLoadingCourses(true);
      try {
        const response = await api.get('/course/details', {
          headers: {
            Authorization: `Bearer ${authContext.profile.token}`,
          },
        });
        const data = response.data;

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        const mappedCourses: Course[] = data.map((item: any) => ({
          id: String(item.course_id),
          courseCode: item.courseCode,
          courseTitle: item.courseTitle,
          courseDescription: item.courseDescription,
          facultyName: item.instructorName,
          isActive: item.isActive,
          dept: item.dept,
          credit: item.credit,
          duration: item.duration,
        }));

        setCourses(mappedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        Alert.alert('Error', 'Failed to load courses. Please try again later.');
        setCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [authContext?.isAuthenticated, authContext?.profile?.token]);

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
    if (!authContext?.profile?.token) {
      Alert.alert('Authentication Required', 'Please login to perform this action');
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Toast.show({
        type: 'success',
        text1: 'Schedule Generated Successfully',
        text2: 'Your exam schedule has been created!',
        position: 'bottom',
        visibilityTime: 3000,
      });

      // Reset form after successful generation
      setSelectedCourses([]);
      setFromDate(new Date());
      setToDate(new Date());
    } catch (error) {
      console.error('Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFromDate(selectedDate);
      if (dayjs(toDate).isBefore(dayjs(selectedDate))) {
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
    const diff = dayjs(toDate).diff(dayjs(fromDate), 'day');
    return diff >= 0 ? `${diff + 1} days` : 'Invalid range';
  };

  if (!authContext?.isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="Schedule Management" />
        <View style={styles.authMessageContainer}>
          <Text style={styles.authMessageText}>
            Please login to access schedule management
          </Text>
        </View>
      </View>
    );
  }

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
            <Text style={styles.noCoursesText}>
              No courses available
            </Text>
          ) : (
            courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseCard,
                  !course.isActive && styles.inactiveCourse
                ]}
                onPress={() => course.isActive && toggleCourse(course.id)}
              >
                <Checkbox
                  status={selectedCourses.includes(course.id) ? 'checked' : 'unchecked'}
                  onPress={() => course.isActive && toggleCourse(course.id)}
                  disabled={!course.isActive}
                  color={course.isActive ? '#1a73e8' : '#999'}
                />
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>
                    {course.courseTitle} {course.courseCode && `(${course.courseCode})`}
                  </Text>
                  <Text style={styles.facultyName}>Faculty: {course.facultyName}</Text>
                  <Text style={styles.courseDetails}>
                    {course.dept} • {course.credit} credits • {course.duration} hours
                  </Text>
                  {course.courseDescription && (
                    <Text style={styles.courseDescription}>{course.courseDescription}</Text>
                  )}
                  {!course.isActive && (
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

          <TouchableOpacity 
            onPress={() => setShowFromPicker(true)} 
            style={styles.datePicker}
          >
            <Text style={styles.datePickerLabel}>From Date:</Text>
            <Text style={styles.datePickerValue}>
              {dayjs(fromDate).format('MMM D, YYYY')}
            </Text>
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

          <TouchableOpacity 
            onPress={() => setShowToPicker(true)} 
            style={styles.datePicker}
          >
            <Text style={styles.datePickerLabel}>To Date:</Text>
            <Text style={styles.datePickerValue}>
              {dayjs(toDate).format('MMM D, YYYY')}
            </Text>
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

          <View style={styles.durationBox}>
            <Text style={styles.durationText}>
              Duration: {calculateDuration()}
            </Text>
          </View>
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
              <Text style={styles.buttonText}>
                Generate Schedule
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
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f2f6fa' 
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  authMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authMessageText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
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
  inactiveCourse: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
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
  courseDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    fontStyle: 'italic',
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