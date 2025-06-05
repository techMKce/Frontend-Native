import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import ProfileHeader from '@/components/shared/ProfileHeader';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Phone, CalendarClock, User, MapPin, GraduationCap, Github, Linkedin } from 'lucide-react-native';
import api from '@/service/api';

interface ProfileData {
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
}

export default function StudentProfileScreen() {
  const { profile } = useAuth();

  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/profile/student/${profile?.profile.id}`);
        const data = response.data;
        
        // Map backend data to frontend format
        const mappedData: ProfileData = {
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
        };
        
        setProfileData(mappedData);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [profile]);

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
    if (!result.canceled) {
      setProfileData({ ...profileData, image: result.assets[0].uri });
    }
  };

  const handleChange = (field: keyof ProfileData, value: string | number | null) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleChange('dob', formattedDate);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Prepare payload - convert empty strings to null and ensure correct types
      const payload: Partial<ProfileData> = {
        ...profileData,
        semester: typeof profileData.semester === 'string' ? parseInt(profileData.semester) || 0 : profileData.semester,
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
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        name={profileData.name}
        role="Student"
        profileImage={profileData.image}
        canEdit={true}
        onEditPress={() => setShowEdit(p => !p)}
      />

      {showEdit ? (
        <View style={styles.editSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            <Image
              source={
                profileData.image
                  ? { uri: profileData.image }
                  : require('@/assets/images/default-avatar.png')
              }
              style={styles.image}
            />
            <Text style={styles.imageText}>Tap to change photo</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.name}
              editable={false}
            />
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.email}
              editable={false}
            />
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Roll Number</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.rollNum}
              editable={false}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.gender || ''}
                onValueChange={(itemValue) => handleChange('gender', itemValue || null)}
                style={styles.picker}
              >
                <Picker.Item label="Select Gender" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Others" value="others" />
              </Picker>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{profileData.dob || 'Select Date'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={profileData.dob ? new Date(profileData.dob) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profileData.phoneNum || ''}
              onChangeText={text => handleChange('phoneNum', text || null)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Blood Group</Text>
            <TextInput
              style={styles.input}
              value={profileData.bloodGroup || ''}
              onChangeText={text => handleChange('bloodGroup', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Nationality</Text>
            <TextInput
              style={styles.input}
              value={profileData.nationality || ''}
              onChangeText={text => handleChange('nationality', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={profileData.address || ''}
              onChangeText={text => handleChange('address', text || null)}
              multiline
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Aadhar Number</Text>
            <TextInput
              style={styles.input}
              value={profileData.adharNum || ''}
              onChangeText={text => handleChange('adharNum', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Father's Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.fatherName || ''}
              onChangeText={text => handleChange('fatherName', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Mother's Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.motherName || ''}
              onChangeText={text => handleChange('motherName', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>First Graduate</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.firstGraduate || ''}
                onValueChange={(itemValue) => handleChange('firstGraduate', itemValue || null)}
                style={styles.picker}
              >
                <Picker.Item label="Select Option" value="" />
                <Picker.Item label="Yes" value="yes" />
                <Picker.Item label="No" value="no" />
              </Picker>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>GitHub Profile</Text>
            <TextInput
              style={styles.input}
              value={profileData.githubProfile || ''}
              onChangeText={text => handleChange('githubProfile', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>LinkedIn Profile</Text>
            <TextInput
              style={styles.input}
              value={profileData.linkedInProfile || ''}
              onChangeText={text => handleChange('linkedInProfile', text || null)}
            />
          </View>

          <Text style={styles.sectionTitle}>Education Details</Text>
          
          <Text style={styles.subSectionTitle}>College Details</Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Institution Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.institutionName || ''}
              onChangeText={text => handleChange('institutionName', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Degree</Text>
            <TextInput
              style={styles.input}
              value={profileData.degree || ''}
              onChangeText={text => handleChange('degree', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Program</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.program}
              editable={false}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileData.year}
              editable={false}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Semester</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.semester}
                onValueChange={(itemValue) => handleChange('semester', itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Semester" value={0} />
                <Picker.Item label="1" value={1} />
                <Picker.Item label="2" value={2} />
                <Picker.Item label="3" value={3} />
                <Picker.Item label="4" value={4} />
                <Picker.Item label="5" value={5} />
                <Picker.Item label="6" value={6} />
                <Picker.Item label="7" value={7} />
                <Picker.Item label="8" value={8} />
              </Picker>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Start Year</Text>
            <TextInput
              style={styles.input}
              value={profileData.startYear || ''}
              onChangeText={text => handleChange('startYear', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Graduation Year</Text>
            <TextInput
              style={styles.input}
              value={profileData.gradutaionYear || ''}
              onChangeText={text => handleChange('gradutaionYear', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>CGPA</Text>
            <TextInput
              style={styles.input}
              value={profileData.cgpa || ''}
              onChangeText={text => handleChange('cgpa', text || null)}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.subSectionTitle}>12th Standard / Diploma</Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>School Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.hscSchoolName || ''}
              onChangeText={text => handleChange('hscSchoolName', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Start Year</Text>
            <TextInput
              style={styles.input}
              value={profileData.hscStartYear || ''}
              onChangeText={text => handleChange('hscStartYear', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>End Year</Text>
            <TextInput
              style={styles.input}
              value={profileData.hscEndYear || ''}
              onChangeText={text => handleChange('hscEndYear', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Percentage</Text>
            <TextInput
              style={styles.input}
              value={profileData.hscPercentage || ''}
              onChangeText={text => handleChange('hscPercentage', text || null)}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Board of Education</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.hscboardOfEducation || ''}
                onValueChange={(itemValue) => handleChange('hscboardOfEducation', itemValue || null)}
                style={styles.picker}
              >
                <Picker.Item label="Select Board" value="" />
                <Picker.Item label="CBSE" value="cbse" />
                <Picker.Item label="State Board" value="state" />
                <Picker.Item label="ICSE" value="icse" />
              </Picker>
            </View>
          </View>

          <Text style={styles.subSectionTitle}>10th Standard</Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>School Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.sslcSchoolName || ''}
              onChangeText={text => handleChange('sslcSchoolName', text || null)}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Start Year</Text>
            <TextInput
              style={styles.input}
              value={profileData.sslcStartYear || ''}
              onChangeText={text => handleChange('sslcStartYear', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>End Year</Text>
            <TextInput
              style={styles.input}
              value={profileData.sslcEndYear || ''}
              onChangeText={text => handleChange('sslcEndYear', text || null)}
              keyboardType="number-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Percentage</Text>
            <TextInput
              style={styles.input}
              value={profileData.sslcPercentage || ''}
              onChangeText={text => handleChange('sslcPercentage', text || null)}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Board of Education</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profileData.sslcboardOfEducation || ''}
                onValueChange={(itemValue) => handleChange('sslcboardOfEducation', itemValue || null)}
                style={styles.picker}
              >
                <Picker.Item label="Select Board" value="" />
                <Picker.Item label="CBSE" value="cbse" />
                <Picker.Item label="State Board" value="state" />
                <Picker.Item label="ICSE" value="icse" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { marginTop: SPACING.lg }]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setShowEdit(true)}
            >
              <Text style={styles.actionButtonText}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Roll Number" value={profileData.rollNum} />
              <InfoRow icon={<Mail size={16} color={COLORS.gray} />} label="Email" value={profileData.email} />
              <InfoRow icon={<Phone size={16} color={COLORS.gray} />} label="Phone" value={profileData.phoneNum || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Date of Birth" value={profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Gender" value={profileData.gender || 'Not specified'} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Address" value={profileData.address || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Program" value={profileData.program || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Year" value={profileData.year || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Semester" value={profileData.semester ? profileData.semester.toString() : 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Father's Name" value={profileData.fatherName || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Mother's Name" value={profileData.motherName || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="First Graduate" value={profileData.firstGraduate || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Blood Group" value={profileData.bloodGroup || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Nationality" value={profileData.nationality || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Aadhar Number" value={profileData.adharNum || 'Not specified'} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<Github size={16} color={COLORS.gray} />} label="GitHub" value={profileData.githubProfile ? `@${profileData.githubProfile}` : 'Not provided'} />
              <InfoRow icon={<Linkedin size={16} color={COLORS.gray} />} label="LinkedIn" value={profileData.linkedInProfile ? `@${profileData.linkedInProfile}` : 'Not provided'} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Education Details</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.educationHeader}>College</Text>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Institution" value={profileData.institutionName || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Degree" value={profileData.degree || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Program" value={profileData.program || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Duration" value={`${profileData.startYear || '?'} - ${profileData.gradutaionYear || '?'}`} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="CGPA" value={profileData.cgpa || 'Not specified'} />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.educationHeader}>12th Standard / Diploma</Text>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="School Name" value={profileData.hscSchoolName || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Duration" value={`${profileData.hscStartYear || '?'} - ${profileData.hscEndYear || '?'}`} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Percentage" value={profileData.hscPercentage || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Board" value={profileData.hscboardOfEducation || 'Not specified'} />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.educationHeader}>10th Standard</Text>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="School Name" value={profileData.sslcSchoolName || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Duration" value={`${profileData.sslcStartYear || '?'} - ${profileData.sslcEndYear || '?'}`} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Percentage" value={profileData.sslcPercentage || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Board" value={profileData.sslcboardOfEducation || 'Not specified'} />
            </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
  },
  buttonContainer: {
    marginBottom: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  saveButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
  },
  editSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageText: {
    marginTop: 8,
    color: COLORS.primary,
    fontFamily: FONT.medium,
  },
  label: {
    fontFamily: FONT.medium,
    color: COLORS.gray,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: COLORS.darkGray,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: COLORS.white,
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
  subSectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: 6,
  },
  infoValue: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
  },
  educationHeader: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  }
});