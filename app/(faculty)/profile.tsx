import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import ProfileHeader from '@/components/shared/ProfileHeader';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, CalendarClock, User, MapPin, Briefcase } from 'lucide-react-native';
import api from '@/service/api';

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
  const { user, authProfile } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
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

  // Non-editable fields
  const nonEditableFields = ['name', 'email', 'facultyId', 'department'];

  const isFieldEditable = (field: string) => {
    return !nonEditableFields.includes(field);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const endpoint = `/profile/faculty/${authProfile?.profile.id}`;
      
      const response = await api.get(endpoint);
      const data = response.data;
      
      // Map backend data to frontend structure
      const mappedProfile: ProfileData = {
        id: data.id || '',
        name: data.name || user?.name || '',
        email: data.email || user?.email || '',
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
      };

      // Map work experiences (only allow one)
      const experiences = data.workExperiences?.slice(0, 1).map((exp: any, index: number) => ({
        id: index.toString(),
        organizationName: exp.organizationName || '',
        designation: exp.designation || '',
        startYear: exp.startYear || '',
        endYear: exp.endYear || '',
        description: exp.description || '',
        achievements: exp.achievements || '',
        researchDetails: exp.researchDetails || ''
      })) || [];

      setProfile(mappedProfile);
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
    if (!result.canceled) setProfile({ ...profile, profilePicture: result.assets[0].uri });
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    if (isFieldEditable(field)) {
      setProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleWorkExpChange = (index: number, field: keyof WorkExperience, value: string) => {
    const updated = [...workExperience];
    updated[index][field] = value;
    setWorkExperience(updated);
  };

  const addWorkExperience = () => {
    // Only add if no experience exists
    if (workExperience.length === 0) {
      setWorkExperience([{ 
        id: '1', 
        organizationName: '', 
        designation: '',
        startYear: '', 
        endYear: '', 
        description: '',
        achievements: '',
        researchDetails: ''
      }]);
    }
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
      setIsLoading(true);
      
      // Prepare data for API (only send first experience if multiple exist)
      const payload = {
        name: profile.name,
        email: profile.email,
        staffId: profile.facultyId,
        phoneNum: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        address: profile.address,
        department: profile.department,
        experience: profile.experience,
        designation: profile.designation,
        adharNum: profile.aadhaarNumber,
        bloodGroup: profile.bloodGroup,
        nationality: profile.nationality,
        image: profile.profilePicture,
        workExperiences: workExperience.slice(0, 1).map(exp => ({
          organizationName: exp.organizationName,
          designation: exp.designation,
          startYear: exp.startYear,
          endYear: exp.endYear,
          description: exp.description,
          achievements: exp.achievements,
          researchDetails: exp.researchDetails
        }))
      };

      const endpoint = `/profile/faculty/${authProfile?.profile.id}`;
      const response = await api.put(endpoint, payload);

      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEdit(false);
        fetchProfileData();
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
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        name={profile.name}
        role="Faculty"
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

          {[
            { label: 'Name', field: 'name' },
            { label: 'Faculty ID', field: 'facultyId' },
            { label: 'Email', field: 'email' },
            { label: 'Department', field: 'department' },
            { label: 'Experience', field: 'experience' },
            { label: 'Designation', field: 'designation' },
            { label: 'Mobile Number', field: 'phone' },
            { label: 'Date of Birth', field: 'dob' },
            { label: 'Address', field: 'address' },
            { label: 'Aadhaar Number', field: 'aadhaarNumber' },
            { label: 'Gender', field: 'gender' },
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
                value={profile[field] || ''}
                onChangeText={text => handleChange(field as keyof ProfileData, text)}
                editable={isFieldEditable(field)}
                multiline={field === 'experience'}
                numberOfLines={field === 'experience' ? 4 : 1}
              />
            </View>
          ))}

          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { marginBottom: SPACING.md }]}>Work Experience</Text>
            {workExperience.map((exp, idx) => (
              <View key={exp.id} style={[styles.infoCard, { marginBottom: SPACING.md }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.label}>Organization</Text>
                  <TouchableOpacity onPress={() => removeWorkExperience(idx)}>
                    <Text style={{ color: COLORS.red, fontWeight: 'bold' }}>Remove</Text>
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

            {workExperience.length === 0 && (
              <TouchableOpacity style={[styles.actionButton, { marginTop: 0 }]} onPress={addWorkExperience}>
                <Text style={styles.actionButtonText}>Add Work Experience</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={saveProfile}>
              <Text style={styles.actionButtonText}>Save Profile</Text>
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
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Name" value={profile.name} />
              <InfoRow icon={<Briefcase size={16} color={COLORS.gray} />} label="Faculty ID" value={profile.facultyId} />
              <InfoRow icon={<Mail size={16} color={COLORS.gray} />} label="Email" value={profile.email} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Department" value={profile.department} />
              <InfoRow icon={<Briefcase size={16} color={COLORS.gray} />} label="Experience" value={profile.experience} />
              <InfoRow icon={<Briefcase size={16} color={COLORS.gray} />} label="Designation" value={profile.designation} />
              <InfoRow icon={<Phone size={16} color={COLORS.gray} />} label="Mobile Number" value={profile.phone} />
              <InfoRow icon={<CalendarClock size={16} color={COLORS.gray} />} label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'} />
              <InfoRow icon={<MapPin size={16} color={COLORS.gray} />} label="Address" value={profile.address} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Aadhaar Number" value={profile.aadhaarNumber} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Gender" value={profile.gender} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Blood Group" value={profile.bloodGroup} />
              <InfoRow icon={<User size={16} color={COLORS.gray} />} label="Nationality" value={profile.nationality} />
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {workExperience.length === 0 ? (
              <Text style={{ fontStyle: 'italic', color: COLORS.gray, padding: SPACING.md }}>No work experience provided.</Text>
            ) : (
              workExperience.slice(0, 1).map(exp => (
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