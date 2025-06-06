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
  Platform
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
  Briefcase, 
  BookOpen,
  Camera,
  Edit3,
  Save,
  X,
  Award,
  GraduationCap
} from 'lucide-react-native';
import profileApi from '@/service/api';
import DateTimePicker from '@react-native-community/datetimepicker';

// Enhanced color scheme for modern UI
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
  id: string;
  name: string;
  email: string;
  facultyId: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  department: string;
  experience: string;
  designation: string;
  aadhaarNumber: string;
  bloodGroup: string;
  nationality: string;
  profilePicture: string | null;
  institutionName: string;
  startYear: string;
  endYear: string;
  workDescription: string;
  achievements: string;
  researchDetails: string;
};

type FieldErrors = {
  phone?: string;
  aadhaarNumber?: string;
  startYear?: string;
  endYear?: string;
  bloodGroup?: string;
  [key: string]: string | undefined;
};

export default function FacultyProfileScreen() {
  const { profile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    name: '',
    email: '',
    facultyId: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    department: '',
    experience: '',
    designation: '',
    aadhaarNumber: '',
    bloodGroup: '',
    nationality: '',
    profilePicture: null,
    institutionName: '',
    startYear: '',
    endYear: '',
    workDescription: '',
    achievements: '',
    researchDetails: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [errors, setErrors] = useState<FieldErrors>({});

  // Non-editable fields
  const nonEditableFields = ['name', 'email', 'facultyId', 'department'];

  const isFieldEditable = (field: string) => {
    return !nonEditableFields.includes(field);
  };

  const bloodGroupOptions = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  useEffect(() => {
    fetchProfileData();
    // Animate on mount
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
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const endpoint = `/profile/faculty/${profile?.profile.id}`;
      
      const response = await profileApi.get(endpoint);
      const data = response.data;
      
      const mappedProfile: ProfileData = {
        id: data.id || '',
        name: data.name || '',
        email: data.email || '',
        facultyId: data.staffId || '',
        phone: data.phoneNum || '',
        dob: data.dob || '',
        gender: data.gender || '',
        address: data.address || '',
        department: data.department || '',
        experience: data.experience || '',
        designation: data.designation || '',
        aadhaarNumber: data.adharNum || '',
        bloodGroup: data.bloodGroup || '',
        nationality: data.nationality || '',
        profilePicture: data.image || null,
        institutionName: data.institutionName || '',
        startYear: data.startYear || '',
        endYear: data.endYear || '',
        workDescription: data.workDescription || '',
        achievements: data.achievements || '',
        researchDetails: data.researchDetails || '',
      };

      setProfileData(mappedProfile);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
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
    if (!result.canceled) setProfileData({ ...profileData, profilePicture: result.assets[0].uri });
  };

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'phone':
        if (!/^\d{10}$/.test(value)) return 'Phone number must be 10 digits';
        break;
      case 'aadhaarNumber':
        if (value && !/^\d{12}$/.test(value)) return 'Aadhaar must be 12 digits';
        break;
      case 'startYear':
        if (value && !/^\d{4}$/.test(value)) return 'Invalid year format';
        if (value && parseInt(value) > new Date().getFullYear()) return 'Year cannot be in future';
        break;
      case 'endYear':
        if (value && !/^\d{4}$/.test(value)) return 'Invalid year format';
        if (value && profileData.startYear && parseInt(value) < parseInt(profileData.startYear)) 
          return 'End year cannot be before start year';
        if (value && parseInt(value) > new Date().getFullYear()) return 'Year cannot be in future';
        break;
      case 'bloodGroup':
        if (value && !bloodGroupOptions.includes(value)) return 'Invalid blood group';
        break;
      default:
        return undefined;
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    if (isFieldEditable(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
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

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};
    let isValid = true;

    if (profileData.phone) {
      const phoneError = validateField('phone', profileData.phone);
      if (phoneError) {
        newErrors.phone = phoneError;
        isValid = false;
      }
    }

    if (profileData.aadhaarNumber) {
      const aadhaarError = validateField('aadhaarNumber', profileData.aadhaarNumber);
      if (aadhaarError) {
        newErrors.aadhaarNumber = aadhaarError;
        isValid = false;
      }
    }

    if (profileData.startYear) {
      const startYearError = validateField('startYear', profileData.startYear);
      if (startYearError) {
        newErrors.startYear = startYearError;
        isValid = false;
      }
    }

    if (profileData.endYear) {
      const endYearError = validateField('endYear', profileData.endYear);
      if (endYearError) {
        newErrors.endYear = endYearError;
        isValid = false;
      }
    }

    if (profileData.bloodGroup) {
      const bloodGroupError = validateField('bloodGroup', profileData.bloodGroup);
      if (bloodGroupError) {
        newErrors.bloodGroup = bloodGroupError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const saveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors in the form');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        name: profileData.name,
        email: profileData.email,
        staffId: profileData.facultyId,
        phoneNum: profileData.phone,
        dob: profileData.dob,
        gender: profileData.gender,
        address: profileData.address,
        department: profileData.department,
        experience: profileData.experience,
        designation: profileData.designation,
        adharNum: profileData.aadhaarNumber,
        bloodGroup: profileData.bloodGroup,
        nationality: profileData.nationality,
        image: profileData.profilePicture,
        institutionName: profileData.institutionName,
        startYear: profileData.startYear,
        endYear: profileData.endYear,
        workDescription: profileData.workDescription,
        achievements: profileData.achievements,
        researchDetails: profileData.researchDetails
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [
          key, 
          value === '' ? null : value
        ])
      );

      const endpoint = `/profile/faculty/${profile?.profile.id}`;
      const response = await profileApi.put(endpoint, cleanPayload);

      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEdit(false);
        fetchProfileData();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
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
      <Header title="Faculty Profile" />
      
      {/* Animated Container */}
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
                profileData.profilePicture
                  ? { uri: profileData.profilePicture }
                  : require('@/assets/images/default-avatar.png')
              }
              style={styles.profileImage}
            />
            <View style={styles.statusIndicator} />
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.profileName}>{profileData.name}</Text>
            <Text style={styles.profileRole}>Faculty Member</Text>
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>{profileData.department}</Text>
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
                    profileData.profilePicture
                      ? { uri: profileData.profilePicture }
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

            {/* Form Sections */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>Basic Information</Text>
              
              {[
                { label: 'Full Name', field: 'name', icon: User },
                { label: 'Faculty ID', field: 'facultyId', icon: Briefcase },
                { label: 'Email Address', field: 'email', icon: Mail },
                { label: 'Department', field: 'department', icon: BookOpen },
              ].map(({ label, field, icon: Icon }) => (
                <ModernInput
                  key={field}
                  label={label}
                  value={profileData[field] || ''}
                  onChangeText={(text) => handleChange(field as keyof ProfileData, text)}
                  editable={isFieldEditable(field)}
                  icon={<Icon size={18} color={MODERN_COLORS.textSecondary} />}
                />
              ))}

              <ModernInput
                label="Mobile Number"
                value={profileData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                keyboardType="phone-pad"
                maxLength={10}
                icon={<Phone size={18} color={MODERN_COLORS.textSecondary} />}
                error={errors.phone}
              />

              <ModernInput
                label="Aadhaar Number"
                value={profileData.aadhaarNumber}
                onChangeText={(text) => handleChange('aadhaarNumber', text)}
                keyboardType="number-pad"
                maxLength={12}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
                error={errors.aadhaarNumber}
                secureTextEntry={true}
              />

              <ModernInput
                label="Blood Group"
                value={profileData.bloodGroup}
                onChangeText={(text) => handleChange('bloodGroup', text)}
                placeholder="e.g. A+, B-, etc."
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
                error={errors.bloodGroup}
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
                label="Designation"
                value={profileData.designation}
                onChangeText={(text) => handleChange('designation', text)}
                icon={<Briefcase size={18} color={MODERN_COLORS.textSecondary} />}
              />

              <ModernInput
                label="Experience"
                value={profileData.experience}
                onChangeText={(text) => handleChange('experience', text)}
                multiline
                height={80}
                icon={<Award size={18} color={MODERN_COLORS.textSecondary} />}
              />

              <ModernInput
                label="Address"
                value={profileData.address}
                onChangeText={(text) => handleChange('address', text)}
                multiline
                height={80}
                icon={<MapPin size={18} color={MODERN_COLORS.textSecondary} />}
              />

              <ModernInput
                label="Nationality"
                value={profileData.nationality}
                onChangeText={(text) => handleChange('nationality', text)}
                icon={<User size={18} color={MODERN_COLORS.textSecondary} />}
              />
            </View>

            {/* Work Experience Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionHeader}>Work Experience</Text>
              
              <ModernInput
                label="Institution Name"
                value={profileData.institutionName}
                onChangeText={(text) => handleChange('institutionName', text)}
                icon={<BookOpen size={18} color={MODERN_COLORS.textSecondary} />}
              />

              <View style={styles.rowInputs}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Start Year</Text>
                  <View style={styles.modernInput}>
                    <CalendarClock size={18} color={MODERN_COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profileData.startYear}
                      onChangeText={(text) => handleChange('startYear', text)}
                      maxLength={4}
                      placeholder="2020"
                    />
                  </View>
                  {errors.startYear && <Text style={styles.errorText}>{errors.startYear}</Text>}
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>End Year</Text>
                  <View style={styles.modernInput}>
                    <CalendarClock size={18} color={MODERN_COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profileData.endYear}
                      onChangeText={(text) => handleChange('endYear', text)}
                      placeholder="Present"
                      maxLength={4}
                    />
                  </View>
                  {errors.endYear && <Text style={styles.errorText}>{errors.endYear}</Text>}
                </View>
              </View>

              <ModernInput
                label="Work Description"
                value={profileData.workDescription}
                onChangeText={(text) => handleChange('workDescription', text)}
                multiline
                height={80}
                icon={<Briefcase size={18} color={MODERN_COLORS.textSecondary} />}
              />

              <ModernInput
                label="Achievements"
                value={profileData.achievements}
                onChangeText={(text) => handleChange('achievements', text)}
                multiline
                height={80}
                icon={<Award size={18} color={MODERN_COLORS.textSecondary} />}
              />

              <ModernInput
                label="Research Details"
                value={profileData.researchDetails}
                onChangeText={(text) => handleChange('researchDetails', text)}
                multiline
                height={80}
                icon={<GraduationCap size={18} color={MODERN_COLORS.textSecondary} />}
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
                onPress={saveProfile}
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
            {/* Quick Stats Cards */}
            <View style={styles.statsContainer}>
              <StatsCard 
                title="Experience" 
                value={profileData.experience || 'N/A'} 
                icon={<Award size={24} color={MODERN_COLORS.primary} />}
              />
              <StatsCard 
                title="Department" 
                value={profileData.department || 'N/A'} 
                icon={<BookOpen size={24} color={MODERN_COLORS.secondary} />}
              />
            </View>

            {/* Information Sections */}
            <ModernInfoSection 
              title="Personal Information" 
              icon={<User size={20} color={MODERN_COLORS.primary} />}
            >
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Name" value={profileData.name} />
              <ModernInfoRow icon={<Briefcase size={16} color={MODERN_COLORS.textSecondary} />} label="Faculty ID" value={profileData.facultyId} />
              <ModernInfoRow icon={<Mail size={16} color={MODERN_COLORS.textSecondary} />} label="Email" value={profileData.email} />
              <ModernInfoRow icon={<Phone size={16} color={MODERN_COLORS.textSecondary} />} label="Phone" value={profileData.phone} />
              <ModernInfoRow icon={<CalendarClock size={16} color={MODERN_COLORS.textSecondary} />} label="Date of Birth" value={profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'N/A'} />
              <ModernInfoRow icon={<MapPin size={16} color={MODERN_COLORS.textSecondary} />} label="Address" value={profileData.address} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Blood Group" value={profileData.bloodGroup} />
              <ModernInfoRow icon={<User size={16} color={MODERN_COLORS.textSecondary} />} label="Nationality" value={profileData.nationality} />
            </ModernInfoSection>

            <ModernInfoSection 
              title="Professional Details" 
              icon={<Briefcase size={20} color={MODERN_COLORS.primary} />}
            >
              <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Department" value={profileData.department} />
              <ModernInfoRow icon={<Briefcase size={16} color={MODERN_COLORS.textSecondary} />} label="Designation" value={profileData.designation} />
              <ModernInfoRow icon={<Award size={16} color={MODERN_COLORS.textSecondary} />} label="Experience" value={profileData.experience} />
            </ModernInfoSection>

            {(profileData.institutionName || profileData.startYear) && (
              <ModernInfoSection 
                title="Work Experience" 
                icon={<GraduationCap size={20} color={MODERN_COLORS.primary} />}
              >
                <ModernInfoRow icon={<BookOpen size={16} color={MODERN_COLORS.textSecondary} />} label="Institution" value={profileData.institutionName} />
                <ModernInfoRow icon={<CalendarClock size={16} color={MODERN_COLORS.textSecondary} />} label="Duration" value={`${profileData.startYear} - ${profileData.endYear || 'Present'}`} />
                {profileData.workDescription && (
                  <ModernInfoRow icon={<Briefcase size={16} color={MODERN_COLORS.textSecondary} />} label="Description" value={profileData.workDescription} />
                )}
                {profileData.achievements && (
                  <ModernInfoRow icon={<Award size={16} color={MODERN_COLORS.textSecondary} />} label="Achievements" value={profileData.achievements} />
                )}
                {profileData.researchDetails && (
                  <ModernInfoRow icon={<GraduationCap size={16} color={MODERN_COLORS.textSecondary} />} label="Research" value={profileData.researchDetails} />
                )}
              </ModernInfoSection>
            )}
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

const StatsCard = ({ title, value, icon }: any) => (
  <View style={styles.statsCard}>
    <View style={styles.statsIcon}>{icon}</View>
    <Text style={styles.statsTitle}>{title}</Text>
    <Text style={styles.statsValue}>{value}</Text>
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
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statsCard: {
    flex: 1,
    backgroundColor: MODERN_COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${MODERN_COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: SIZES.xs,
    fontFamily: FONT.medium,
    color: MODERN_COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statsValue: {
    fontSize: SIZES.sm,
    fontFamily: FONT.bold,
    color: MODERN_COLORS.textPrimary,
    textAlign: 'center',
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