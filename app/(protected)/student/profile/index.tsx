import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  Phone,
  CalendarClock,
  User,
  MapPin,
  BookOpen,
  Camera,
  Edit3,
  Save,
  X,
  Award,
  GraduationCap,
  Github,
  Linkedin,
} from 'lucide-react-native';
import api from '@/service/api';
import DateTimePicker from '@react-native-community/datetimepicker';

// Modern color scheme
const MODERN_COLORS = {
  ...COLORS,
  primary: '#667eea',
  primaryLight: '#764ba2',
  secondary: '#f093fb',
  accent: '#4facfe',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  cardBg: '#ffffff',
  inputBg: '#f8fafc',
  borderColor: '#e2e8f0',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  gradient1: '#667eea',
  gradient2: '#764ba2',
};

type ProfileData = {
  rollNum: string;
  image: string | null;
  name: string;
  email: string;
  gender: string | null;
  dob: string | null;
  phoneNum: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  address: string | null;
  adharNum: string | null;
  fatherName: string | null;
  motherName: string | null;
  firstGraduate: string | null;
  institutionName: string | null;
  degree: string | null;
  program: string;
  year: string;
  semester: number;
  startYear: string | null;
  gradutaionYear: string | null;
  cgpa: string | null;
  githubProfile: string | null;
  linkedInProfile: string | null;
  sslcSchoolName: string | null;
  sslcStartYear: string | null;
  sslcEndYear: string | null;
  sslcPercentage: string | null;
  sslcboardOfEducation: string | null;
  hscSchoolName: string | null;
  hscStartYear: string | null;
  hscEndYear: string | null;
  hscPercentage: string | null;
  hscboardOfEducation: string | null;
};

export default function StudentProfileScreen() {
  const { profile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [profileData, setProfileData] = useState<ProfileData>({
    rollNum: '',
    image: null,
    name: '',
    email: '',
    gender: null,
    dob: null,
    phoneNum: null,
    bloodGroup: null,
    nationality: null,
    address: null,
    adharNum: null,
    fatherName: null,
    motherName: null,
    firstGraduate: null,
    institutionName: null,
    degree: null,
    program: '',
    year: '',
    semester: 0,
    startYear: null,
    gradutaionYear: null,
    cgpa: null,
    githubProfile: null,
    linkedInProfile: null,
    sslcSchoolName: null,
    sslcStartYear: null,
    sslcEndYear: null,
    sslcPercentage: null,
    sslcboardOfEducation: null,
    hscSchoolName: null,
    hscStartYear: null,
    hscEndYear: null,
    hscPercentage: null,
    hscboardOfEducation: null,
  });

  useEffect(() => {
    fetchProfileData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/profile/student/${profile?.profile.id}`);
      const data = response.data;
      setProfileData({
        rollNum: data.rollNum || '',
        image: data.image || null,
        name: data.name || profile?.profile?.name || '',
        email: data.email || profile?.profile?.email || '',
        gender: data.gender || null,
        dob: data.dob || null,
        phoneNum: data.phoneNum || null,
        bloodGroup: data.bloodGroup || null,
        nationality: data.nationality || null,
        address: data.address || null,
        adharNum: data.adharNum || null,
        fatherName: data.fatherName || null,
        motherName: data.motherName || null,
        firstGraduate: data.firstGraduate || null,
        institutionName: data.institutionName || null,
        degree: data.degree || null,
        program: data.program || '',
        year: data.year || data.startYear || '',
        semester: data.semester || 0,
        startYear: data.startYear || null,
        gradutaionYear: data.gradutaionYear || null,
        cgpa: data.cgpa || null,
        githubProfile: data.githubProfile || null,
        linkedInProfile: data.linkedInProfile || null,
        sslcSchoolName: data.sslcSchoolName || null,
        sslcStartYear: data.sslcStartYear || null,
        sslcEndYear: data.sslcEndYear || null,
        sslcPercentage: data.sslcPercentage || null,
        sslcboardOfEducation: data.sslcboardOfEducation || null,
        hscSchoolName: data.hscSchoolName || null,
        hscStartYear: data.hscStartYear || null,
        hscEndYear: data.hscEndYear || null,
        hscPercentage: data.hscPercentage || null,
        hscboardOfEducation: data.hscboardOfEducation || null,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Camera roll permission is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    });
    if (!result.canceled) setProfileData({ ...profileData, image: result.assets[0].uri });
  };

  const handleChange = (field: keyof ProfileData, value: string | number | null) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const showDatepicker = () => {
    setTempDate(profileData.dob ? new Date(profileData.dob) : new Date());
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setProfileData({
        ...profileData,
        dob: selectedDate.toISOString().split('T')[0]
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const payload: Partial<ProfileData> = {
        ...profileData,
        semester: typeof profileData.semester === 'string' ? parseInt(profileData.semester as any) || 0 : profileData.semester,
      };
      // Remove non-editable fields
      const nonEditableFields = ['rollNum', 'name', 'email', 'year', 'program'];
      nonEditableFields.forEach(field => delete payload[field as keyof typeof payload]);
      // Convert empty strings to null
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof ProfileData] === '') {
          payload[key as keyof ProfileData] = null;
        }
      });
      const response = await api.put(`/profile/student/${profile?.profile.id}`, payload);
      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEdit(false);
        fetchProfileData();
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Student Profile" />
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Modern Profile Header */}
        <View style={styles.modernHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profileData.image
                  ? { uri: profileData.image }
                  : require('@/assets/images/default-avatar.png')
              }
              style={styles.profileImage}
            />
            <View style={styles.statusIndicator} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileRole}>Student</Text>
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>{profileData.program}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.modernEditButton}
            onPress={() => setShowEdit(!showEdit)}
          >
            {showEdit ? (
              <X size={20} color={MODERN_COLORS.white} />
            ) : (
              <Edit3 size={20} color={MODERN_COLORS.white} />
            )}
          </TouchableOpacity>
        </View>

        {showEdit ? (
          <View style={styles.editSection}>
            {/* Modern Image Picker */}
            <TouchableOpacity onPress={pickImage} style={styles.modernImagePicker}>
              <View style={styles.imagePickerContent}>
                <Image
                  source={
                    profileData.image
                      ? { uri: profileData.image }
                      : require('@/assets/images/default-avatar.png')
                  }
                  style={styles.editImage}
                />
                <View style={styles.cameraOverlay}>
                  <Camera size={24} color={MODERN_COLORS.white} />
                </View>
              </View>
              <Text style={styles.imagePickerText}>Change Photo</Text>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>Personal Information</Text>
              <ModernInput
                label="Full Name"
                value={profileData.name}
                editable={false}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Roll Number"
                value={profileData.rollNum}
                editable={false}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Email"
                value={profileData.email}
                editable={false}
                icon={<Mail size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Phone Number"
                value={profileData.phoneNum || ''}
                onChangeText={text => handleChange('phoneNum', text)}
                keyboardType="phone-pad"
                icon={<Phone size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Gender"
                value={profileData.gender || ''}
                onChangeText={text => handleChange('gender', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              {/* Date Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity onPress={showDatepicker} style={styles.dateInput}>
                  <CalendarClock size={18} color={MODERN_COLORS.textSecondary} />
                  <Text style={[
                    styles.dateText,
                    { color: profileData.dob ? MODERN_COLORS.textPrimary : MODERN_COLORS.textSecondary }
                  ]}>
                    {profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'Select date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>
              <ModernInput
                label="Address"
                value={profileData.address || ''}
                onChangeText={text => handleChange('address', text)}
                icon={<MapPin size={18} color={MODERN_COLORS.textSecondary} />}
                multiline
                height={80}
              />
              <ModernInput
                label="Blood Group"
                value={profileData.bloodGroup || ''}
                onChangeText={text => handleChange('bloodGroup', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Nationality"
                value={profileData.nationality || ''}
                onChangeText={text => handleChange('nationality', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Aadhar Number"
                value={profileData.adharNum || ''}
                onChangeText={text => handleChange('adharNum', text)}
                keyboardType="number-pad"
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Father's Name"
                value={profileData.fatherName || ''}
                onChangeText={text => handleChange('fatherName', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Mother's Name"
                value={profileData.motherName || ''}
                onChangeText={text => handleChange('motherName', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="First Graduate"
                value={profileData.firstGraduate || ''}
                onChangeText={text => handleChange('firstGraduate', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>Social Profiles</Text>
              <ModernInput
                label="GitHub"
                value={profileData.githubProfile || ''}
                onChangeText={text => handleChange('githubProfile', text)}
                icon={<Github size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="LinkedIn"
                value={profileData.linkedInProfile || ''}
                onChangeText={text => handleChange('linkedInProfile', text)}
                icon={<Linkedin size={18} color={MODERN_COLORS.textSecondary} />}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>Education Details</Text>
              <ModernInput
                label="Institution Name"
                value={profileData.institutionName || ''}
                onChangeText={text => handleChange('institutionName', text)}
                icon={<GraduationCap size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Degree"
                value={profileData.degree || ''}
                onChangeText={text => handleChange('degree', text)}
                icon={<GraduationCap size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Program"
                value={profileData.program}
                editable={false}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Year"
                value={profileData.year}
                editable={false}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Semester"
                value={profileData.semester ? profileData.semester.toString() : ''}
                onChangeText={text => handleChange('semester', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Start Year"
                value={profileData.startYear || ''}
                onChangeText={text => handleChange('startYear', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Graduation Year"
                value={profileData.gradutaionYear || ''}
                onChangeText={text => handleChange('gradutaionYear', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="CGPA"
                value={profileData.cgpa || ''}
                onChangeText={text => handleChange('cgpa', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              {/* HSC */}
              <Text style={styles.inputLabel}>12th Standard / Diploma</Text>
              <ModernInput
                label="School Name"
                value={profileData.hscSchoolName || ''}
                onChangeText={text => handleChange('hscSchoolName', text)}
                icon={<GraduationCap size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Start Year"
                value={profileData.hscStartYear || ''}
                onChangeText={text => handleChange('hscStartYear', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="End Year"
                value={profileData.hscEndYear || ''}
                onChangeText={text => handleChange('hscEndYear', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Percentage"
                value={profileData.hscPercentage || ''}
                onChangeText={text => handleChange('hscPercentage', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Board"
                value={profileData.hscboardOfEducation || ''}
                onChangeText={text => handleChange('hscboardOfEducation', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              {/* SSLC */}
              <Text style={styles.inputLabel}>10th Standard</Text>
              <ModernInput
                label="School Name"
                value={profileData.sslcSchoolName || ''}
                onChangeText={text => handleChange('sslcSchoolName', text)}
                icon={<GraduationCap size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Start Year"
                value={profileData.sslcStartYear || ''}
                onChangeText={text => handleChange('sslcStartYear', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="End Year"
                value={profileData.sslcEndYear || ''}
                onChangeText={text => handleChange('sslcEndYear', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Percentage"
                value={profileData.sslcPercentage || ''}
                onChangeText={text => handleChange('sslcPercentage', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
              <ModernInput
                label="Board"
                value={profileData.sslcboardOfEducation || ''}
                onChangeText={text => handleChange('sslcboardOfEducation', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />
            </View>
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEdit(false)}
              >
                <X size={20} color={MODERN_COLORS.textSecondary} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Save size={20} color={MODERN_COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.viewMode}>
            <ModernInfoSection
              title="Personal Information"
              icon={<User size={20} color={MODERN_COLORS.primary} />}
            >
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Name" value={profileData.name} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Roll Number" value={profileData.rollNum} />
              <ModernInfoRow icon={<Mail size={16} color={MODERN_COLORS.textSecondary} />} label="Email" value={profileData.email} />
              <ModernInfoRow icon={<Phone size={16} color={MODERN_COLORS.textSecondary} />} label="Phone" value={profileData.phoneNum} />
              <ModernInfoRow icon={<CalendarClock size={16} color={MODERN_COLORS.textSecondary} />} label="Date of Birth" value={profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'N/A'} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Gender" value={profileData.gender} />
              <ModernInfoRow icon={<MapPin size={16} color={MODERN_COLORS.textSecondary} />} label="Address" value={profileData.address} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Blood Group" value={profileData.bloodGroup} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Nationality" value={profileData.nationality} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Aadhar Number" value={profileData.adharNum} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Father's Name" value={profileData.fatherName} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Mother's Name" value={profileData.motherName} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="First Graduate" value={profileData.firstGraduate} />
            </ModernInfoSection>
            <ModernInfoSection
              title="Social Profiles"
              icon={<Github size={20} color={MODERN_COLORS.primary} />}
            >
              <ModernInfoRow icon={<Github size={16} color={MODERN_COLORS.textSecondary} />} label="GitHub" value={profileData.githubProfile} />
              <ModernInfoRow icon={<Linkedin size={16} color={MODERN_COLORS.textSecondary} />} label="LinkedIn" value={profileData.linkedInProfile} />
            </ModernInfoSection>
            <ModernInfoSection
              title="Education Details"
              icon={<GraduationCap size={20} color={MODERN_COLORS.primary} />}
            >
              <ModernInfoRow icon={<GraduationCap size={16} color={MODERN_COLORS.textSecondary} />} label="Institution" value={profileData.institutionName} />
              <ModernInfoRow icon={<GraduationCap size={16} color={MODERN_COLORS.textSecondary} />} label="Degree" value={profileData.degree} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Program" value={profileData.program} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Year" value={profileData.year} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Semester" value={profileData.semester ? profileData.semester.toString() : ''} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Start Year" value={profileData.startYear} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Graduation Year" value={profileData.gradutaionYear} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="CGPA" value={profileData.cgpa} />
              {/* HSC */}
              <ModernInfoRow icon={<GraduationCap size={16} color={MODERN_COLORS.textSecondary} />} label="12th School" value={profileData.hscSchoolName} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="12th Duration" value={`${profileData.hscStartYear || '?'} - ${profileData.hscEndYear || '?'}`} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="12th Percentage" value={profileData.hscPercentage} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="12th Board" value={profileData.hscboardOfEducation} />
              {/* SSLC */}
              <ModernInfoRow icon={<GraduationCap size={16} color={MODERN_COLORS.textSecondary} />} label="10th School" value={profileData.sslcSchoolName} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="10th Duration" value={`${profileData.sslcStartYear || '?'} - ${profileData.sslcEndYear || '?'}`} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="10th Percentage" value={profileData.sslcPercentage} />
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="10th Board" value={profileData.sslcboardOfEducation} />
            </ModernInfoSection>
          </View>
        )}
      </Animated.View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Modern Components
const ModernInput = ({
  label,
  value,
  onChangeText,
  editable = true,
  icon,
  error,
  multiline = false,
  height = 56,
  ...props
}: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[
      styles.modernInput,
      { height },
      error && styles.inputError,
      !editable && styles.inputDisabled
    ]}>
      {icon}
      <TextInput
        style={[styles.textInput, multiline && { height: height - 16, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        placeholderTextColor={MODERN_COLORS.textSecondary}
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const ModernInfoSection = ({ title, icon, children }: any) => (
  <View style={styles.infoSection}>
    <View style={styles.sectionHeaderContainer}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.infoCard}>
      {children}
    </View>
  </View>
);

const ModernInfoRow = ({ icon, label, value }: any) => (
  <View style={styles.modernInfoRow}>
    <View style={styles.infoLabelContainer}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  animatedContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingCard: {
    backgroundColor: MODERN_COLORS.white,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: MODERN_COLORS.borderColor,
    borderTopColor: MODERN_COLORS.primary,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: SIZES.md,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.textSecondary,
  },
  modernHeader: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.small,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: MODERN_COLORS.primary,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: MODERN_COLORS.success,
    borderWidth: 2,
    borderColor: MODERN_COLORS.white,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: SIZES.lg,
    fontFamily: FONT.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: SIZES.sm,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.textSecondary,
    marginBottom: 8,
  },
  departmentBadge: {
    backgroundColor: `${MODERN_COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  departmentText: {
    fontSize: SIZES.xs,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.primary,
  },
  modernEditButton: {
    backgroundColor: MODERN_COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  editSection: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.small,
  },
  modernImagePicker: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imagePickerContent: {
    position: 'relative',
    marginBottom: 12,
  },
  editImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: MODERN_COLORS.primary,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: MODERN_COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
  },
  imagePickerText: {
    fontSize: SIZES.sm,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.primary,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: SIZES.md,
    fontFamily: FONT.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: `${MODERN_COLORS.primary}20`,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: SIZES.sm,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.textPrimary,
    marginBottom: 8,
  },
  modernInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: MODERN_COLORS.borderColor,
    height: 56,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: SIZES.sm,
    fontFamily: FONT.regular,
    color: MODERN_COLORS.textPrimary,
  },
  inputError: {
    borderColor: MODERN_COLORS.error,
    backgroundColor: `${MODERN_COLORS.error}08`,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.7,
  },
  errorText: {
    fontSize: SIZES.xs,
    fontFamily: FONT.regular,
    color: MODERN_COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: MODERN_COLORS.borderColor,
    height: 56,
  },
  dateText: {
    flex: 1,
    marginLeft: 12,
    fontSize: SIZES.sm,
    fontFamily: FONT.regular,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.inputBg,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: MODERN_COLORS.borderColor,
  },
  cancelButtonText: {
    marginLeft: 8,
    fontSize: SIZES.sm,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.textSecondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    ...SHADOWS.small,
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: SIZES.sm,
    fontFamily: FONT.bold,
    color: MODERN_COLORS.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
  viewMode: {
    gap: 20,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: SIZES.md,
    fontFamily: FONT.bold,
    color: MODERN_COLORS.textPrimary,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.small,
  },
  modernInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${MODERN_COLORS.borderColor}40`,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: SIZES.sm,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.textSecondary,
    marginLeft: 8,
  },
  infoValue: {
    flex: 1,
    fontSize: SIZES.sm,
    fontFamily: FONT.regular,
    color: MODERN_COLORS.textPrimary,
    textAlign: 'right',
    lineHeight: 20,
  },
});