import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import ProfileHeader from '@/components/shared/ProfileHeader';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, CalendarClock, User, MapPin, GraduationCap, Github, Linkedin } from 'lucide-react-native';
import api from '@/service/api';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  department: string;
  batch: string;
  fathersName: string;
  mothersName: string;
  firstGraduate: string;
  github: string;
  linkedin: string;
  profilePicture: string | null;
}

interface EducationData {
  college: {
    institution: string;
    degree: string;
    program: string;
    startYear: string;
    endYear: string;
    cgpa: string;
  };
  highSchool: {
    institution: string;
    startYear: string;
    endYear: string;
    percentage: string;
    board: string;
  };
  school: {
    institution: string;
    startYear: string;
    endYear: string;
    percentage: string;
    board: string;
  };
}

export default function StudentProfileScreen() {
  const { user, authProfile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    name: '',
    email: '',
    rollNumber: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    department: '',
    batch: '',
    fathersName: '',
    mothersName: '',
    firstGraduate: '',
    github: '',
    linkedin: '',
    profilePicture: null,
  });
  const [education, setEducation] = useState<EducationData>({
    college: { 
      institution: '', 
      degree: '', 
      program: '', 
      startYear: '', 
      endYear: '', 
      cgpa: '' 
    },
    highSchool: { 
      institution: '', 
      startYear: '', 
      endYear: '', 
      percentage: '',
      board: '' 
    },
    school: { 
      institution: '', 
      startYear: '', 
      endYear: '', 
      percentage: '',
      board: '' 
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/students/${authProfile?.profile.id}`);
        const data = response.data;

        setProfile({
          id: data.id || '',
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          rollNumber: data.rollNumber || data.rollNum || '',
          phone: data.phone || data.phoneNum || '',
          dob: data.dob || '',
          gender: data.gender || '',
          address: data.address || '',
          department: data.department || '',
          batch: data.batch || data.year || '',
          fathersName: data.fathersName || data.fatherName || '',
          mothersName: data.mothersName || data.motherName || '',
          firstGraduate: data.firstGraduate || '',
          github: data.github || data.githubProfile || '',
          linkedin: data.linkedin || data.linkedInProfile || '',
          profilePicture: data.profilePicture || data.image || null,
        });

        if (data.education) {
          setEducation({
            college: {
              institution: data.education.college?.institution || data.institutionName || '',
              degree: data.education.college?.degree || data.degree || '',
              program: data.education.college?.program || data.program || '',
              startYear: data.education.college?.startYear || data.startYear || '',
              endYear: data.education.college?.endYear || data.expectedGraduation || '',
              cgpa: data.education.college?.cgpa || data.cgpa || ''
            },
            highSchool: {
              institution: data.education.highSchool?.institution || data.hscSchoolName || '',
              startYear: data.education.highSchool?.startYear || data.hscStartYear || '',
              endYear: data.education.highSchool?.endYear || data.hscEndYear || '',
              percentage: data.education.highSchool?.percentage || data.hscPercentage || '',
              board: data.education.highSchool?.board || data.hscboardOfEducation || ''
            },
            school: {
              institution: data.education.school?.institution || data.sslcSchoolName || '',
              startYear: data.education.school?.startYear || data.sslcStartYear || '',
              endYear: data.education.school?.endYear || data.sslcEndYear || '',
              percentage: data.education.school?.percentage || data.sslcPercentage || '',
              board: data.education.school?.board || data.sslcboardOfEducation || ''
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [authProfile]);

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
      setProfile({ ...profile, profilePicture: result.assets[0].uri });
    }
  };

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleEducationChange = (level: keyof EducationData, field: string, value: string) => {
    setEducation(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const payload = {
        name: profile.name,
        email: profile.email,
        rollNumber: profile.rollNumber,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        address: profile.address,
        department: profile.department,
        batch: profile.batch,
        fathersName: profile.fathersName,
        mothersName: profile.mothersName,
        firstGraduate: profile.firstGraduate,
        github: profile.github,
        linkedin: profile.linkedin,
        profilePicture: profile.profilePicture,
        education: education
      };

      const response = await api.put(`/students/${authProfile?.profile.id}`, payload);
      
      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEdit(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
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
        name={profile.name}
        role="Student"
        profileImage={profile.profilePicture}
        canEdit={true}
        onEditPress={() => setShowEdit(p => !p)}
      />

      {showEdit ? (
        <View style={styles.editSection}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            <Image
              source={
                profile.profilePicture
                  ? { uri: profile.profilePicture }
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
              value={profile.name}
              editable={false}
            />
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.email}
              editable={false}
            />
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Roll Number</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.rollNumber}
              editable={false}
            />
          </View>

          {[
            { label: 'Phone', field: 'phone' },
            { label: 'Date of Birth', field: 'dob' },
            { label: 'Gender', field: 'gender' },
            { label: 'Address', field: 'address' },
            { label: 'Department', field: 'department' },
            { label: 'Batch', field: 'batch' },
            { label: "Father's Name", field: 'fathersName' },
            { label: "Mother's Name", field: 'mothersName' },
            { label: 'First Graduate', field: 'firstGraduate' },
            { label: 'GitHub', field: 'github' },
            { label: 'LinkedIn', field: 'linkedin' },
          ].map(({ label, field }) => (
            <View key={field} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={profile[field]}
                onChangeText={text => handleProfileChange(field as keyof ProfileData, text)}
              />
            </View>
          ))}

          <Text style={styles.sectionTitle}>Education Details</Text>
          
          <Text style={styles.subSectionTitle}>College Details</Text>
          {[
            { label: 'Institution', field: 'institution', level: 'college' },
            { label: 'Degree', field: 'degree', level: 'college' },
            { label: 'Program', field: 'program', level: 'college' },
            { label: 'Start Year', field: 'startYear', level: 'college' },
            { label: 'End Year', field: 'endYear', level: 'college' },
            { label: 'CGPA', field: 'cgpa', level: 'college' },
          ].map(({ label, field, level }) => (
            <View key={`college-${field}`} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={education.college[field]}
                onChangeText={text => handleEducationChange('college', field, text)}
              />
            </View>
          ))}

          <Text style={styles.subSectionTitle}>12th Standard / Diploma</Text>
          {[
            { label: 'Institution', field: 'institution', level: 'highSchool' },
            { label: 'Start Year', field: 'startYear', level: 'highSchool' },
            { label: 'End Year', field: 'endYear', level: 'highSchool' },
            { label: 'Percentage', field: 'percentage', level: 'highSchool' },
            { label: 'Board', field: 'board', level: 'highSchool' },
          ].map(({ label, field, level }) => (
            <View key={`hsc-${field}`} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={education.highSchool[field]}
                onChangeText={text => handleEducationChange('highSchool', field, text)}
              />
            </View>
          ))}

          <Text style={styles.subSectionTitle}>10th Standard</Text>
          {[
            { label: 'Institution', field: 'institution', level: 'school' },
            { label: 'Start Year', field: 'startYear', level: 'school' },
            { label: 'End Year', field: 'endYear', level: 'school' },
            { label: 'Percentage', field: 'percentage', level: 'school' },
            { label: 'Board', field: 'board', level: 'school' },
          ].map(({ label, field, level }) => (
            <View key={`sslc-${field}`} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={education.school[field]}
                onChangeText={text => handleEducationChange('school', field, text)}
              />
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.saveButton, { marginTop: SPACING.lg }]} 
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
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
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Roll Number" value={profile.rollNumber} />
              <InfoRow icon={<Mail size={16} color={COLORS.gray} />} label="Email" value={profile.email} />
              <InfoRow icon={<Phone size={16} color={COLORS.gray} />} label="Phone" value={profile.phone} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Gender" value={profile.gender || 'Not specified'} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Address" value={profile.address || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Department" value={profile.department || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Batch" value={profile.batch || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Father's Name" value={profile.fathersName || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Mother's Name" value={profile.mothersName || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="First Graduate" value={profile.firstGraduate || 'Not specified'} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<Github size={16} color={COLORS.gray} />} label="GitHub" value={profile.github ? `@${profile.github}` : 'Not provided'} />
              <InfoRow icon={<Linkedin size={16} color={COLORS.gray} />} label="LinkedIn" value={profile.linkedin ? `@${profile.linkedin}` : 'Not provided'} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Education Details</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.educationHeader}>College</Text>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Institution" value={education.college.institution || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Degree" value={education.college.degree || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Program" value={education.college.program || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Duration" value={`${education.college.startYear} - ${education.college.endYear}`} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="CGPA" value={education.college.cgpa || 'Not specified'} />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.educationHeader}>12th Standard / Diploma</Text>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Institution" value={education.highSchool.institution || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Duration" value={`${education.highSchool.startYear} - ${education.highSchool.endYear}`} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Percentage" value={education.highSchool.percentage || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Board" value={education.highSchool.board || 'Not specified'} />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.educationHeader}>10th Standard</Text>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Institution" value={education.school.institution || 'Not specified'} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Duration" value={`${education.school.startYear} - ${education.school.endYear}`} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Percentage" value={education.school.percentage || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Board" value={education.school.board || 'Not specified'} />
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
    backgroundColor:'#f0f0f0',
    color: COLORS.darkGray,
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