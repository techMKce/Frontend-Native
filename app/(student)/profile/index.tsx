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
    startYear: string;
    endYear: string;
    cgpa: string;
  };
  highSchool: {
    institution: string;
    startYear: string;
    endYear: string;
    percentage: string;
  };
  school: {
    institution: string;
    startYear: string;
    endYear: string;
    percentage: string;
  };
}

export default function StudentProfileScreen() {
  const { user, authProfile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
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
    college: { institution: '', startYear: '', endYear: '', cgpa: '' },
    highSchool: { institution: '', startYear: '', endYear: '', percentage: '' },
    school: { institution: '', startYear: '', endYear: '', percentage: '' }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/students/${authProfile?.profile.id}`);
        const data = response.data;

        // Map backend data to frontend structure
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

        // Set education data if available from API
        if (data.education) {
          setEducation({
            college: {
              institution: data.education.college?.institution || '',
              startYear: data.education.college?.startYear || '',
              endYear: data.education.college?.endYear || '',
              cgpa: data.education.college?.cgpa || ''
            },
            highSchool: {
              institution: data.education.highSchool?.institution || '',
              startYear: data.education.highSchool?.startYear || '',
              endYear: data.education.highSchool?.endYear || '',
              percentage: data.education.highSchool?.percentage || ''
            },
            school: {
              institution: data.education.school?.institution || '',
              startYear: data.education.school?.startYear || '',
              endYear: data.education.school?.endYear || '',
              percentage: data.education.school?.percentage || ''
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

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Prepare payload matching backend expectations
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

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => showEdit ? handleSave() : setShowEdit(true)}
        >
          <Text style={styles.actionButtonText}>
            {showEdit ? 'Save Profile' : 'Edit Student Details'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setShowEducation(p => !p)}
        >
          <Text style={styles.secondaryButtonText}>
            {showEducation ? 'Hide Education' : 'View Education Details'}
          </Text>
        </TouchableOpacity>
      </View>

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

          {[
            { label: 'Name', field: 'name' },
            { label: 'Email', field: 'email' },
            { label: 'Roll Number', field: 'rollNumber' },
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
                onChangeText={text => handleChange(field as keyof ProfileData, text)}
              />
            </View>
          ))}
        </View>
      ) : (
        <>
          {/* Display Basic Info */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Roll Number" value={profile.rollNumber} />
              <InfoRow icon={<Mail size={16} color={COLORS.gray} />} label="Email" value={profile.email} />
              <InfoRow icon={<Phone size={16} color={COLORS.gray} />} label="Phone" value={profile.phone} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Gender" value={profile.gender || 'Not specified'} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Address" value={profile.address || 'Not specified'} />
            </View>
          </View>

          {/* Academic Info */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Academic Information</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="Department" value={profile.department || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Batch" value={profile.batch || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Father's Name" value={profile.fathersName || 'Not specified'} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Mother's Name" value={profile.mothersName || 'Not specified'} />
              <InfoRow icon={<GraduationCap size={16} color={COLORS.gray} />} label="First Graduate" value={profile.firstGraduate || 'Not specified'} />
            </View>
          </View>

          {/* Social Profiles */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Social Profiles</Text>
            <View style={styles.infoCard}>
              <InfoRow icon={<Github size={16} color={COLORS.gray} />} label="GitHub" value={profile.github ? `@${profile.github}` : 'Not provided'} />
              <InfoRow icon={<Linkedin size={16} color={COLORS.gray} />} label="LinkedIn" value={profile.linkedin ? `@${profile.linkedin}` : 'Not provided'} />
            </View>
          </View>
        </>
      )}

      {showEducation && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Education Details</Text>
          {Object.entries(education).map(([key, edu]) => (
            <View key={key} style={styles.infoCard}>
              <Text style={styles.infoLabel}>{edu.institution || 'Not specified'}</Text>
              <Text style={styles.infoValue}>
                {edu.startYear} - {edu.endYear}
              </Text>
              <Text style={styles.infoValue}>{edu.cgpa || edu.percentage || 'Not specified'}</Text>
            </View>
          ))}
        </View>
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginRight: 0,
  },
  actionButtonText: {
    color: COLORS.white,
    fontFamily: FONT.semiBold,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontFamily: FONT.semiBold,
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
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 8,
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
});