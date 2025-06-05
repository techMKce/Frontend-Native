import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import ProfileHeader from '@/components/shared/ProfileHeader';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, CalendarClock, User, MapPin, Briefcase } from 'lucide-react-native';
import profileApi from '@/service/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';

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
};

type WorkExperience = {
  id: string;
  organizationName: string;
  designation: string;
  startYear: string;
  endYear: string;
  description: string;
  achievements: string;
  researchDetails: string;
};

export default function FacultyProfileScreen() {
  const { profile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  // Non-editable fields
  const nonEditableFields = ['name', 'email', 'facultyId', 'department'];

  const isFieldEditable = (field: string) => {
    return !nonEditableFields.includes(field);
  };

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
    { label: 'Prefer not to say', value: 'Prefer not to say' },
  ];

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        facultyId: data.staffId || data.facultyId || '',
        phone: data.phoneNum || data.phone || '',
        dob: data.dob || '',
        gender: data.gender || '',
        address: data.address || '',
        department: data.department || data.dept || '',
        experience: data.experience || '',
        designation: data.designation || '',
        aadhaarNumber: data.adharNum || data.aadhaarNumber || '',
        bloodGroup: data.bloodGroup || '',
        nationality: data.nationality || '',
        profilePicture: data.image || data.profilePicture || null,
      };

      const experiences = data.workExperiences?.map((exp: any, index: number) => ({
        id: index.toString(),
        organizationName: exp.organizationName || '',
        designation: exp.designation || '',
        startYear: exp.startYear || '',
        endYear: exp.endYear || '',
        description: exp.description || '',
        achievements: exp.achievements || '',
        researchDetails: exp.researchDetails || ''
      })) || [];

      setProfileData(mappedProfile);
      setWorkExperience(experiences);
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

  const handleChange = (field: keyof ProfileData, value: string) => {
    if (isFieldEditable(field)) {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleWorkExpChange = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = [...workExperience];
    updated[index][field] = value;
    setWorkExperience(updated);
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

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      id: Date.now().toString(),
      organizationName: '',
      designation: '',
      startYear: '',
      endYear: '',
      description: '',
      achievements: '',
      researchDetails: ''
    }]);
  };

  const removeWorkExperience = (index: number) => {
    Alert.alert(
      'Remove Work Experience',
      'Are you sure you want to remove this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = [...workExperience];
            updated.splice(index, 1);
            setWorkExperience(updated);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const saveProfile = async () => {
    try {
      setIsSubmitting(true);

      // Prepare complete payload with all fields
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
        workExperiences: workExperience.map(exp => ({
          organizationName: exp.organizationName,
          designation: exp.designation,
          startYear: exp.startYear,
          endYear: exp.endYear,
          description: exp.description,
          achievements: exp.achievements,
          researchDetails: exp.researchDetails
        }))
      };

      // Remove empty strings and convert to null for the API
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.gray }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        name={profileData.name}
        role="Faculty"
        profileImage={profileData.profilePicture}
        canEdit={true}
        onEditPress={() => setShowEdit(p => !p)}
      />

      {showEdit ? (
        <View style={styles.editSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            <Image
              source={
                profileData.profilePicture
                  ? { uri: profileData.profilePicture }
                  : require('@/assets/images/default-avatar.png')
              }
              style={styles.image}
            />
            <Text style={styles.imageText}>Tap to change photo</Text>
          </TouchableOpacity>

          {[
            { label: 'Name', field: 'name' },
            { label: 'Faculty ID', field: 'facultyId' },
            { label: 'Email', field: 'email' },
            { label: 'Department', field: 'department' },
            { label: 'Experience', field: 'experience' },
            { label: 'Designation', field: 'designation' },
            { label: 'Mobile Number', field: 'phone' },
            { label: 'Address', field: 'address' },
            { label: 'Aadhaar Number', field: 'aadhaarNumber' },
            { label: 'Blood Group', field: 'bloodGroup' },
            { label: 'Nationality', field: 'nationality' },
          ].map(({ label, field }) => (
            <View key={field} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={[
                  styles.input,
                  field === 'experience' && { height: 100, textAlignVertical: 'top' },
                  {
                    backgroundColor: isFieldEditable(field) ? '#ffffff' : '#f0f0f0',
                    opacity: isFieldEditable(field) ? 1 : 0.7,
                  }
                ]}
                value={profileData[field as keyof ProfileData] || ''}
                onChangeText={text => handleChange(field as keyof ProfileData, text)}
                editable={isFieldEditable(field)}
                multiline={field === 'experience'}
                numberOfLines={field === 'experience' ? 4 : 1}
              />
            </View>
          ))}

          {/* Date of Birth Picker */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity onPress={showDatepicker}>
              <TextInput
                style={[styles.input, { color: profileData.dob ? COLORS.darkGray : COLORS.gray }]}
                value={profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'Select date'}
                editable={false}
                pointerEvents="none"
              />
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

          {/* Gender Dropdown */}
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Gender</Text>
            <View style={[styles.input, { paddingHorizontal: 0 }]}>
              <RNPickerSelect
                onValueChange={(value) => handleChange('gender', value)}
                items={genderOptions}
                value={profileData.gender}
                style={pickerSelectStyles}
                placeholder={{ label: 'Select gender...', value: null }}
              />
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Work Experience</Text>
            {workExperience.map((exp, idx) => (
              <View key={exp.id} style={[styles.infoCard, { marginBottom: SPACING.md }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.label}>Organization</Text>
                  <TouchableOpacity onPress={() => removeWorkExperience(idx)}>
                    <Text style={{ color: COLORS.warning, fontWeight: 'bold' }}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Organization Name</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 12 }]}
                  value={exp.organizationName}
                  onChangeText={text => handleWorkExpChange(idx, 'organizationName', text)}
                />

                <Text style={styles.label}>Designation</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 12 }]}
                  value={exp.designation}
                  onChangeText={text => handleWorkExpChange(idx, 'designation', text)}
                />

                <Text style={styles.label}>Start Year</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 12 }]}
                  keyboardType="numeric"
                  value={exp.startYear}
                  onChangeText={text => handleWorkExpChange(idx, 'startYear', text)}
                />

                <Text style={styles.label}>End Year</Text>
                <TextInput
                  style={[styles.input, { marginBottom: 12 }]}
                  value={exp.endYear}
                  onChangeText={text => handleWorkExpChange(idx, 'endYear', text)}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 60, marginBottom: 12 }]}
                  multiline
                  value={exp.description}
                  onChangeText={text => handleWorkExpChange(idx, 'description', text)}
                />

                <Text style={styles.label}>Achievements</Text>
                <TextInput
                  style={[styles.input, { height: 60, marginBottom: 12 }]}
                  multiline
                  value={exp.achievements}
                  onChangeText={text => handleWorkExpChange(idx, 'achievements', text)}
                />

                <Text style={styles.label}>Research Details</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  multiline
                  value={exp.researchDetails}
                  onChangeText={text => handleWorkExpChange(idx, 'researchDetails', text)}
                />
              </View>
            ))}

            <TouchableOpacity style={[styles.actionButton, { marginTop: 0 }]} onPress={addWorkExperience}>
              <Text style={styles.actionButtonText}>Add Work Experience</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={saveProfile}
              disabled={isSubmitting}
            >
              <Text style={styles.actionButtonText}>
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowEdit(true)}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Name" value={profileData.name} />
              <InfoRow icon={<Briefcase size={16} color={COLORS.gray} />} label="Faculty ID" value={profileData.facultyId} />
              <InfoRow icon={<Mail size={16} color={COLORS.gray} />} label="Email" value={profileData.email} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Department" value={profileData.department} />
              <InfoRow icon={<Briefcase size={16} color={COLORS.gray} />} label="Experience" value={profileData.experience} />
              <InfoRow icon={<Briefcase size={16} color={COLORS.gray} />} label="Designation" value={profileData.designation} />
              <InfoRow icon={<Phone size={16} color={COLORS.gray} />} label="Mobile Number" value={profileData.phone} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Date of Birth" value={profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'N/A'} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Address" value={profileData.address} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Aadhaar Number" value={profileData.aadhaarNumber} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Gender" value={profileData.gender} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Blood Group" value={profileData.bloodGroup} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Nationality" value={profileData.nationality} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {workExperience.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: COLORS.gray, padding: SPACING.md }}>No work experience provided.</Text>
            ) : (
              workExperience.map(exp => (
                <View key={exp.id} style={styles.infoCard}>
                  <Text style={[styles.infoLabel, { fontWeight: '600' }]}>{exp.organizationName}</Text>
                  <Text style={styles.infoValue}>{exp.designation}</Text>
                  <Text style={styles.infoValue}>{exp.startYear} - {exp.endYear}</Text>
                  {exp.description && <Text style={styles.infoValue}>{exp.description}</Text>}
                  {exp.achievements && <Text style={styles.infoValue}>Achievements: {exp.achievements}</Text>}
                  {exp.researchDetails && <Text style={styles.infoValue}>Research: {exp.researchDetails}</Text>}
                </View>
              ))
            )}
          </View>
        </>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelContainer}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: SIZES.sm,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: COLORS.darkGray,
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: SIZES.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.darkGray,
    paddingRight: 30,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  actionButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
  editSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  imageText: {
    marginTop: 8,
    color: COLORS.primary,
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
  },
  label: {
    fontFamily: FONT.medium,
    color: COLORS.darkGray,
    marginBottom: 4,
    fontSize: SIZES.sm,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  infoLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: 6,
  },
  infoValue: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    width: '55%',
    textAlign: 'right',
  },
});