import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { Search, Plus, Edit2, Trash2, Link } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import FileUploader, { FileInfo } from '@/components/FileUploader';
import api from '@/service/api';
import { format } from 'date-fns/format';

// Debug flags
const DEBUG_BYPASS_ALERT = false;
const DEBUG_FORCE_ALERT = false;

type Assignment = {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate?: string;
  file?: string;
  link?: string;
  courseId?: string;
};

export default function CourseAssignmentsScreen() {
  const { id: courseId } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: null as Date | null,
    link: '',
  });
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    files: '',
  });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ assignments: Assignment[] }>(
        `/assignments/course/${courseId}`,
        { timeout: 10000 }
      );
      setAssignments(response.data.assignments);
    } catch (error: any) {
      Alert.alert('Error', 'Unable to load assignments: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      description: '',
      files: '',
    };

    if (!form.title.trim()) {
      newErrors.title = 'Title cannot be empty.';
      isValid = false;
    }
    if (!form.description.trim()) {
      newErrors.description = 'Description cannot be empty.';
      isValid = false;
    }
    if (files.length === 0) {
      newErrors.files = 'At least one file is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateAssignment = () => {
    setForm({
      title: '',
      description: '',
      dueDate: null,
      link: '',
    });
    setFiles([]);
    setErrors({
      title: '',
      description: '',
      files: '',
    });
    setModalType('create');
    setModalVisible(true);
  };

  const handleEditAssignment = async (assignmentId: string) => {
    try {
      const response = await api.get(
        `/assignments/id?assignmentId=${assignmentId}`,
        { timeout: 10000 }
      );
      const assignment = response.data.assignment;
      setForm({
        title: assignment.title || '',
        description: assignment.description || '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
        link: assignment.link || '',
      });
      setFiles(assignment.file ? [{ name: 'Existing File', uri: assignment.file, type: 'unknown' }] : []);
      setErrors({
        title: '',
        description: '',
        files: '',
      });
      setModalAssignmentId(assignmentId);
      setModalType('edit');
      setModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load assignment details: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setForm({ ...form, dueDate: selectedDate });
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDateTime = (date: Date | null): string => {
    if (!date) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm:ss");
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (DEBUG_BYPASS_ALERT) {
      performDelete(assignmentId);
    } else if (Platform.OS === 'web' && !DEBUG_FORCE_ALERT) {
      setModalAssignmentId(assignmentId);
      setModalType('delete');
      setModalVisible(true);
    } else {
      Alert.alert(
        'Delete Assignment',
        'Are you sure you want to delete this assignment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => performDelete(assignmentId) },
        ],
        { cancelable: true }
      );
    }
  };

  const performDelete = async (assignmentId: string) => {
    try {
      setDeletingId(assignmentId);
      const response = await api.delete('/assignments', {
        params: { assignmentId },
        timeout: 10000,
      });
      setAssignments((prev) => prev.filter((assignment) => assignment.assignmentId !== assignmentId));
      if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
        Alert.alert('Success', response.data.message || 'Assignment deleted successfully.');
      }
    } catch (error: any) {
      if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
        Alert.alert('Error', 'Failed to delete assignment: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const performCreate = async () => {
    if (!validateForm()) {
      return;
    }

    if (form.link && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(form.link)) {
      Alert.alert('Error', 'Invalid URL format.');
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('courseId', courseId as string);
      formDataPayload.append('title', form.title);
      formDataPayload.append('description', form.description);
      if (form.dueDate) {
        formDataPayload.append('dueDate', formatDateTime(form.dueDate));
      }
      formDataPayload.append('resourceLink', form.link || '');

      if (files.length > 0) {
        const file = files[0];
        formDataPayload.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type || 'application/octet-stream',
        } as any);
      }

      const response = await api.post('/assignments', formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });

      await fetchAssignments();
      Alert.alert('Success', response.data.message || 'Assignment created successfully.');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create assignment: ' + (error.response?.data?.message || error.message));
    }
  };

  const performEdit = async (assignmentId: string) => {
    if (!validateForm()) {
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('assignmentId', assignmentId);
      formDataPayload.append('title', form.title);
      formDataPayload.append('description', form.description);
      if (form.dueDate) {
        formDataPayload.append('dueDate', formatDateTime(form.dueDate));
      }
      formDataPayload.append('resourceLink', form.link || '');

      if (files.length > 0) {
        const file = files[0];
        formDataPayload.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type || 'application/octet-stream',
        } as any);
      }

      const response = await api.put('/assignments', formDataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });

      await fetchAssignments();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update assignment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleModalConfirm = () => {
    if (modalType === 'delete' && modalAssignmentId) {
      performDelete(modalAssignmentId);
    } else if (modalType === 'edit' && modalAssignmentId) {
      performEdit(modalAssignmentId);
    } else if (modalType === 'create') {
      performCreate();
    }
    setModalVisible(false);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalAssignmentId(null);
    setModalType(null);
    setShowDatePicker(false);
    setForm({ title: '', description: '', dueDate: null, link: '' });
    setFiles([]);
    setErrors({ title: '', description: '', files: '' });
  };

  const handleGradeSubmissions = (assignmentId: string) => {
    router.push({ pathname: './grade', params: { id: assignmentId } });
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateAssignment}>
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <ScrollView style={styles.assignmentsList}>
            {filteredAssignments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No assignments for this course yet</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={handleCreateAssignment}
                >
                  <Text style={styles.emptyStateButtonText}>Create First Assignment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredAssignments.map((assignment) => (
                <View key={assignment.assignmentId} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleEditAssignment(assignment.assignmentId)}
                      >
                        <Edit2 size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, deletingId === assignment.assignmentId && styles.disabledButton]}
                        onPress={() => handleDeleteAssignment(assignment.assignmentId)}
                        disabled={deletingId === assignment.assignmentId}
                      >
                        <Trash2 size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.assignmentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Due Date:</Text>
                      <Text style={styles.detailValue}>
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'Not set'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.gradeButton}
                      onPress={() => handleGradeSubmissions(assignment.assignmentId)}
                    >
                      <Text style={styles.gradeButtonText}>Grade Submissions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={handleModalCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'delete' && (
              <>
                <Text style={styles.modalTitle}>Delete Assignment</Text>
                <Text style={styles.modalMessage}>Are you sure you want to delete this assignment?</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButtonCancel} onPress={handleModalCancel}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButtonDelete} onPress={handleModalConfirm}>
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {(modalType === 'create' || modalType === 'edit') && (
              <>
                <Text style={styles.modalTitle}>{modalType === 'create' ? 'Create Assignment' : 'Edit Assignment'}</Text>
                <ScrollView>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title *</Text>
                    <TextInput
                      style={[styles.formInput, errors.title ? styles.inputError : null]}
                      value={form.title}
                      onChangeText={(text) => {
                        setForm({ ...form, title: text });
                        if (text.trim()) setErrors({ ...errors, title: '' });
                      }}
                      placeholder="Enter assignment title"
                      placeholderTextColor={COLORS.gray}
                    />
                    {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description *</Text>
                    <TextInput
                      style={[styles.formInput, styles.formInputMultiline, errors.description ? styles.inputError : null]}
                      value={form.description}
                      onChangeText={(text) => {
                        setForm({ ...form, description: text });
                        if (text.trim()) setErrors({ ...errors, description: '' });
                      }}
                      placeholder="Enter assignment description"
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Due Date</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={showDatePickerModal}>
                      <Text style={styles.dateButtonText}>
                        {form.dueDate ? formatDateTime(form.dueDate) : 'Select date and time'}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={form.dueDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Upload Files *</Text>
                    <FileUploader files={files} onFilesSelected={setFiles} />
                    {errors.files ? <Text style={styles.errorText}>{errors.files}</Text> : null}
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Resource Link</Text>
                    <View style={styles.linkInput}>
                      <Link size={20} color={COLORS.gray} />
                      <TextInput
                        style={styles.linkTextInput}
                        value={form.link}
                        onChangeText={(text) => setForm({ ...form, link: text })}
                        placeholder="Enter resource link"
                        placeholderTextColor={COLORS.gray}
                        keyboardType="url"
                      />
                    </View>
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalButtonCancel} onPress={handleModalCancel}>
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButtonSave} onPress={handleModalConfirm}>
                      <Text style={styles.modalButtonText}>{modalType === 'create' ? 'Create' : 'Save'}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.md },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 8, ...SHADOWS.small },
  searchIcon: { marginLeft: SPACING.md },
  searchInput: { flex: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, fontFamily: FONT.regular, fontSize: SIZES.md, color: COLORS.darkGray },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, gap: SPACING.xs, ...SHADOWS.small },
  createButtonText: { fontFamily: FONT.medium, fontSize: SIZES.sm, color: COLORS.white },
  assignmentsList: { flex: 1 },
  assignmentCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.small },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  assignmentTitle: { fontFamily: FONT.semiBold, fontSize: SIZES.lg, color: COLORS.darkGray, flex: 1 },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm },
  iconButton: { padding: SPACING.md },
  disabledButton: { opacity: 0.6 },
  assignmentDetails: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: SPACING.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  detailLabel: { fontFamily: FONT.medium, fontSize: SIZES.sm, color: COLORS.gray, marginRight: SPACING.xs },
  detailValue: { fontFamily: FONT.regular, fontSize: SIZES.sm, color: COLORS.darkGray },
  gradeButton: { backgroundColor: COLORS.secondary, borderRadius: 8, paddingVertical: SPACING.sm, alignItems: 'center' },
  gradeButtonText: { fontFamily: FONT.medium, fontSize: SIZES.md, color: COLORS.white },
  emptyState: { alignItems: 'center', marginTop: SPACING.lg },
  emptyStateText: { fontFamily: FONT.regular, fontSize: SIZES.md, color: COLORS.gray, marginBottom: SPACING.md },
  emptyStateButton: { backgroundColor: COLORS.primary, borderRadius: 8, padding: SPACING.md },
  emptyStateButtonText: { fontFamily: FONT.medium, fontSize: SIZES.md, color: COLORS.white },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.lg, width: '95%', maxWidth: 500, maxHeight: '90%' },
  modalTitle: { fontFamily: FONT.semiBold, fontSize: SIZES.lg, color: COLORS.darkGray, marginBottom: SPACING.sm },
  modalMessage: { fontFamily: FONT.medium, fontSize: SIZES.md, color: COLORS.gray, marginBottom: SPACING.md },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md },
  modalButtonCancel: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 8, backgroundColor: COLORS.gray },
  modalButtonDelete: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 8, backgroundColor: COLORS.error },
  modalButtonSave: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: 8, backgroundColor: COLORS.primary },
  modalButtonText: { fontFamily: FONT.medium, fontSize: SIZES.md, color: COLORS.white },
  formGroup: { marginBottom: SPACING.md },
  formLabel: { fontFamily: FONT.medium, fontSize: SIZES.sm, color: COLORS.darkGray, marginBottom: SPACING.xs },
  formInput: { backgroundColor: COLORS.lightGray, borderRadius: 8, padding: SPACING.sm, fontFamily: FONT.regular, fontSize: SIZES.md, color: COLORS.darkGray },
  formInputMultiline: { height: 100, textAlignVertical: 'top' },
  inputError: { borderWidth: 1, borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontFamily: FONT.regular, fontSize: SIZES.sm, marginTop: SPACING.xs },
  linkInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: SPACING.md },
  linkTextInput: { flex: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, fontFamily: FONT.regular, fontSize: SIZES.md, color: COLORS.darkGray },
  dateButton: { backgroundColor: COLORS.lightGray, borderRadius: 8, padding: SPACING.sm },
  dateButtonText: { fontFamily: FONT.regular, fontSize: SIZES.md, color: COLORS.darkGray },
});