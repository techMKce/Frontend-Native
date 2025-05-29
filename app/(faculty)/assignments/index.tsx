// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   Modal,
//   Platform,
// } from 'react-native';
// import { format } from 'date-fns';
// import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
// import Header from '@/components/shared/Header';
// import { Search, Plus, Edit2, Trash2, X } from 'lucide-react-native';
// import { router } from 'expo-router';
// import axios from 'axios';
// import DateTimePicker, {
//   DateTimePickerEvent,
// } from '@react-native-community/datetimepicker';
// import RNDateTimePicker from '@react-native-community/datetimepicker';

// // Debug flags
// const DEBUG_BYPASS_ALERT = false; // Bypasses delete confirmation
// const DEBUG_FORCE_ALERT = false; // Forces Alert.alert on web

// type Assignment = {
//   assignmentId: string;
//   title: string;
//   description?: string;
//   dueDate?: string;
//   file?: string;
//   link?: string;
//   courseId?: string;
// };

// export default function AssignmentsScreen() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [assignments, setAssignments] = useState<Assignment[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [modalType, setModalType] = useState<
//     'create' | 'edit' | 'delete' | null
//   >(null);
//   const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(
//     null
//   );
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [form, setForm] = useState({
//     courseId: '',
//     title: '',
//     description: '',
//     dueDate: null as Date | null,
//     file: null as {
//       name: string;
//       type: string;
//       uri: string;
//       base64?: string;
//     } | null,
//     link: '',
//     removeFile: false,
//   });
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const fetchAssignments = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get<{ assignments: Assignment[] }>(
//         'https://assignmentservice-2a8o.onrender.com/api/assignments/all',
//         { timeout: 10000 }
//       );
//       setAssignments(response.data.assignments);
//     } catch (error: any) {
//       Alert.alert('Error', 'Unable to load assignments.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAssignments();
//   }, []);

//   const handleCreateAssignment = () => {
//     setForm({
//       courseId: 'default-course',
//       title: '',
//       description: '',
//       dueDate: null,
//       file: null,
//       link: '',
//       removeFile: false,
//     });
//     setModalType('create');
//     setModalVisible(true);
//   };

//   const handleEditAssignment = async (assignmentId: string) => {
//     try {
//       const response = await axios.get(
//         `https://assignmentservice-2a8o.onrender.com/api/assignments/id?assignmentId=${assignmentId}`,
//         { timeout: 10000 }
//       );
//       const assignment = response.data.assignment;
//       setForm({
//         courseId: assignment.courseId || 'default-course',
//         title: assignment.title || '',
//         description: assignment.description || '',
//         dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
//         file: assignment.file
//           ? { name: 'Existing File', type: 'unknown', uri: assignment.file }
//           : null,
//         link: assignment.link || '',
//         removeFile: false,
//       });
//       setModalAssignmentId(assignmentId);
//       setModalType('edit');
//       setModalVisible(true);
//     } catch (error: any) {
//       Alert.alert('Error', 'Failed to load assignment details.');
//     }
//   };

//   const handleFilePick = () => {
//     if (Platform.OS === 'web' && fileInputRef.current) {
//       fileInputRef.current.click();
//     } else {
//       Alert.alert('Info', 'File picking is only supported on web.');
//     }
//   };

//   const handleWebFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         const base64 = reader.result as string;
//         setForm({
//           ...form,
//           file: {
//             name: file.name,
//             type: file.type || 'application/octet-stream',
//             uri: URL.createObjectURL(file),
//             base64,
//           },
//           removeFile: false,
//         });
//       };
//       reader.onerror = () => {
//         Alert.alert('Error', 'Failed to read file.');
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleRemoveFile = () => {
//     setForm({ ...form, file: null, removeFile: true });
//   };

//   const handleDateChange = (
//     event: DateTimePickerEvent,
//     selectedDate?: Date
//   ) => {
//     if (Platform.OS === 'android') {
//       setShowDatePicker(false);
//     } // Keep open for iOS, close for Android

//     if (event.type === 'set' && selectedDate) {
//       setForm({ ...form, dueDate: selectedDate });
//     }
//     // On Android, the picker will auto-dismiss on selection
//   };

//   const showDatePickerModal = () => {
//     setShowDatePicker(true);
//   };

//   const formatDateTime = (date: Date | null): string => {
//     if (!date) return '';
//     return format(date, "yyyy-MM-dd'T'HH:mm:00");
//   };

//   const handleDeleteAssignment = (assignmentId: string) => {
//     if (DEBUG_BYPASS_ALERT) {
//       performDelete(assignmentId);
//     } else if (Platform.OS === 'web' && !DEBUG_FORCE_ALERT) {
//       setModalAssignmentId(assignmentId);
//       setModalType('delete');
//       setModalVisible(true);
//     } else {
//       Alert.alert(
//         'Delete Assignment',
//         'Are you sure you want to delete this assignment?',
//         [
//           { text: 'Cancel', style: 'cancel' },
//           {
//             text: 'Delete',
//             style: 'destructive',
//             onPress: () => performDelete(assignmentId),
//           },
//         ],
//         { cancelable: true }
//       );
//     }
//   };

//   const performDelete = async (assignmentId: string) => {
//     try {
//       setDeletingId(assignmentId);
//       await axios.delete(
//         'https://assignmentservice-2a8o.onrender.com/api/assignments',
//         {
//           params: { assignmentId },
//           timeout: 10000,
//         }
//       );
//       setAssignments((prev) =>
//         prev.filter((assignment) => assignment.assignmentId !== assignmentId)
//       );
//       await fetchAssignments();
//       if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
//         Alert.alert('Success', 'Assignment deleted successfully.');
//       }
//     } catch (error: any) {
//       if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
//         Alert.alert(
//           'Error',
//           'Failed to delete assignment: ' +
//             (error.response?.data?.message || error.message)
//         );
//       }
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const performCreate = async (formData: {
//     courseId: string;
//     title: string;
//     description: string;
//     dueDate: Date | null;
//     file: any;
//     link: string;
//   }) => {
//     if (!formData.courseId.trim()) {
//       Alert.alert('Error', 'Course ID cannot be empty.');
//       return;
//     }
//     if (!formData.title.trim()) {
//       Alert.alert('Error', 'Title cannot be empty.');
//       return;
//     }
//     if (!formData.description.trim()) {
//       Alert.alert('Error', 'Description cannot be empty.');
//       return;
//     }
//     if (
//       formData.link &&
//       !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(formData.link)
//     ) {
//       Alert.alert('Error', 'Invalid URL format.');
//       return;
//     }

//     try {
//       const formDataPayload = new FormData();
//       formDataPayload.append('courseId', formData.courseId);
//       formDataPayload.append('title', formData.title);
//       formDataPayload.append('description', formData.description);
//       if (formData.dueDate)
//         formDataPayload.append('dueDate', formatDateTime(formData.dueDate));
//       formDataPayload.append('resourceLink', formData.link || '');
//       if (formData.file && formData.file.base64) {
//         const blob = new Blob(
//           [Buffer.from(formData.file.base64.split(',')[1], 'base64')],
//           { type: formData.file.type }
//         );
//         formDataPayload.append('file', blob, formData.file.name);
//       } else {
//         formDataPayload.append('file', new Blob([]), 'empty.txt');
//       }

//       await axios.post(
//         'https://assignmentservice-2a8o.onrender.com/api/assignments',
//         formDataPayload,
//         {
//           headers: { 'Content-Type': 'multipart/form-data' },
//           timeout: 10000,
//         }
//       );
//       await fetchAssignments();
//       Alert.alert('Success', 'Assignment created successfully.');
//     } catch (error: any) {
//       Alert.alert(
//         'Error',
//         'Failed to create assignment: ' +
//           (error.response?.data?.message || error.message)
//       );
//     }
//   };

//   const performEdit = async (
//     assignmentId: string,
//     formData: {
//       courseId: string;
//       title: string;
//       description: string;
//       dueDate: Date | null;
//       file: any;
//       link: string;
//       removeFile: boolean;
//     }
//   ) => {
//     if (!formData.title.trim()) {
//       Alert.alert('Error', 'Title cannot be empty.');
//       return;
//     }
//     if (
//       formData.link &&
//       !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(formData.link)
//     ) {
//       Alert.alert('Error', 'Invalid URL format.');
//       return;
//     }

//     try {
//       const formDataPayload = new FormData();
//       formDataPayload.append('assignmentId', assignmentId);
//       if (formData.courseId)
//         formDataPayload.append('courseId', formData.courseId);
//       if (formData.title) formDataPayload.append('title', formData.title);
//       if (formData.description)
//         formDataPayload.append('description', formData.description);
//       if (formData.dueDate)
//         formDataPayload.append('dueDate', formatDateTime(formData.dueDate));
//       if (formData.link) formDataPayload.append('resourceLink', formData.link);
//       if (formData.file && formData.file.base64) {
//         const blob = new Blob(
//           [Buffer.from(formData.file.base64.split(',')[1], 'base64')],
//           { type: formData.file.type }
//         );
//         formDataPayload.append('file', blob, formData.file.name);
//       }

//       await axios.put(
//         'https://assignmentservice-2a8o.onrender.com/api/assignments',
//         formDataPayload,
//         {
//           headers: { 'Content-Type': 'multipart/form-data' },
//           timeout: 10000,
//         }
//       );
//       setAssignments((prev) =>
//         prev.map((assignment) =>
//           assignment.assignmentId === assignmentId
//             ? {
//                 ...assignment,
//                 courseId: formData.courseId || assignment.courseId,
//                 title: formData.title,
//                 description: formData.description,
//                 dueDate: formData.dueDate
//                   ? formatDateTime(formData.dueDate)
//                   : assignment.dueDate,
//                 file: formData.removeFile
//                   ? null
//                   : formData.file?.uri || assignment.file,
//                 link: formData.link,
//               }
//             : assignment
//         )
//       );
//       await fetchAssignments();
//       if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
//         Alert.alert('Success', 'Assignment updated successfully.');
//       }
//     } catch (error: any) {
//       if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
//         Alert.alert(
//           'Error',
//           'Failed to update assignment: ' +
//             (error.response?.data?.message || error.message)
//         );
//       }
//     }
//   };

//   const handleModalConfirm = () => {
//     if (modalType === 'delete' && modalAssignmentId) {
//       performDelete(modalAssignmentId);
//     } else if (modalType === 'edit' && modalAssignmentId) {
//       performEdit(modalAssignmentId, form);
//     } else if (modalType === 'create') {
//       performCreate(form);
//     }
//     setModalVisible(false);
//     setModalAssignmentId(null);
//     setModalType(null);
//     setShowDatePicker(false);
//     setForm({
//       courseId: 'default-course',
//       title: '',
//       description: '',
//       dueDate: null,
//       file: null,
//       link: '',
//       removeFile: false,
//     });
//   };

//   const handleModalCancel = () => {
//     setModalVisible(false);
//     setModalAssignmentId(null);
//     setModalType(null);
//     setShowDatePicker(false);
//     setForm({
//       courseId: 'default-course',
//       title: '',
//       description: '',
//       dueDate: null,
//       file: null,
//       link: '',
//       removeFile: false,
//     });
//   };

//   const handleGradeSubmissions = (assignmentId: string) => {
//     router.push({
//       pathname: '/assignments/grade',
//       params: { id: assignmentId },
//     });
//   };

//   const filteredAssignments = assignments.filter((assignment) =>
//     assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <View style={styles.container}>
//       <Header title="Assignments" />
//       <View style={styles.content}>
//         <View style={styles.searchContainer}>
//           <View style={styles.searchInputContainer}>
//             <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Search assignments..."
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//               placeholderTextColor={COLORS.gray}
//             />
//           </View>
//           <TouchableOpacity
//             style={styles.createButton}
//             onPress={handleCreateAssignment}
//           >
//             <Plus size={20} color={COLORS.white} />
//             <Text style={styles.createButtonText}>Create New</Text>
//           </TouchableOpacity>
//         </View>

//         {loading ? (
//           <ActivityIndicator size="large" color={COLORS.primary} />
//         ) : (
//           <ScrollView style={styles.assignmentsList}>
//             {filteredAssignments.length === 0 ? (
//               <Text style={styles.noAssignmentsText}>
//                 No assignments found.
//               </Text>
//             ) : (
//               filteredAssignments.map((assignment) => (
//                 <View
//                   key={assignment.assignmentId}
//                   style={styles.assignmentCard}
//                 >
//                   <View style={styles.assignmentHeader}>
//                     <Text style={styles.assignmentTitle}>
//                       {assignment.title}
//                     </Text>
//                     <View style={styles.actionButtons}>
//                       <TouchableOpacity
//                         style={styles.iconButton}
//                         onPress={() =>
//                           handleEditAssignment(assignment.assignmentId)
//                         }
//                       >
//                         <Edit2 size={18} color={COLORS.primary} />
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={[
//                           styles.iconButton,
//                           deletingId === assignment.assignmentId &&
//                             styles.disabledButton,
//                         ]}
//                         onPress={() =>
//                           handleDeleteAssignment(assignment.assignmentId)
//                         }
//                         disabled={deletingId === assignment.assignmentId}
//                       >
//                         <Trash2 size={20} color={COLORS.error} />
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                   <View style={styles.assignmentDetails}>
//                     <View style={styles.detailRow}>
//                       <Text style={styles.detailLabel}>Due Date:</Text>
//                       <Text style={styles.detailValue}>
//                         {assignment.dueDate
//                           ? new Date(assignment.dueDate).toLocaleString()
//                           : 'Not set'}
//                       </Text>
//                     </View>
//                     <TouchableOpacity
//                       style={styles.gradeButton}
//                       onPress={() =>
//                         handleGradeSubmissions(assignment.assignmentId)
//                       }
//                     >
//                       <Text style={styles.gradeButtonText}>
//                         Grade Submissions
//                       </Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ))
//             )}
//           </ScrollView>
//         )}
//       </View>

//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={handleModalCancel}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             {modalType === 'delete' && (
//               <>
//                 <Text style={styles.modalTitle}>Delete Assignment</Text>
//                 <Text style={styles.modalMessage}>
//                   Are you sure you want to delete this assignment?
//                 </Text>
//                 <View style={styles.modalButtons}>
//                   <TouchableOpacity
//                     style={styles.modalButtonCancel}
//                     onPress={handleModalCancel}
//                   >
//                     <Text style={styles.modalButtonText}>Cancel</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={styles.modalButtonDelete}
//                     onPress={handleModalConfirm}
//                   >
//                     <Text style={styles.modalButtonText}>Delete</Text>
//                   </TouchableOpacity>
//                 </View>
//               </>
//             )}
//             {(modalType === 'create' || modalType === 'edit') && (
//               <>
//                 <Text style={styles.modalTitle}>
//                   {modalType === 'create'
//                     ? 'Create Assignment'
//                     : 'Edit Assignment'}
//                 </Text>
//                 <View style={styles.formGroup}>
//                   <Text style={styles.formLabel}>Course ID *</Text>
//                   <TextInput
//                     style={styles.formInput}
//                     value={form.courseId}
//                     onChangeText={(text) =>
//                       setForm({ ...form, courseId: text })
//                     }
//                     placeholder="Enter course ID"
//                     placeholderTextColor={COLORS.gray}
//                   />
//                 </View>
//                 <View style={styles.formGroup}>
//                   <Text style={styles.formLabel}>Title *</Text>
//                   <TextInput
//                     style={styles.formInput}
//                     value={form.title}
//                     onChangeText={(text) => setForm({ ...form, title: text })}
//                     placeholder="Enter assignment title"
//                     placeholderTextColor={COLORS.gray}
//                   />
//                 </View>
//                 <View style={styles.formGroup}>
//                   <Text style={styles.formLabel}>Description *</Text>
//                   <TextInput
//                     style={[styles.formInput, styles.formInputMultiline]}
//                     value={form.description}
//                     onChangeText={(text) =>
//                       setForm({ ...form, description: text })
//                     }
//                     placeholder="Enter assignment description"
//                     placeholderTextColor={COLORS.gray}
//                     multiline
//                     numberOfLines={4}
//                   />
//                 </View>
//                 <View style={styles.formGroup}>
//                   <Text style={styles.formLabel}>Due Date</Text>
//                   <TouchableOpacity
//                     style={styles.dateButton}
//                     onPress={showDatePickerModal}
//                   >
//                     <Text style={styles.dateButtonText}>
//                       {form.dueDate
//                         ? formatDateTime(form.dueDate)
//                         : 'Select date and time'}
//                     </Text>
//                   </TouchableOpacity>
//                   {showDatePicker && (
//                     <RNDateTimePicker
//                       value={form.dueDate || new Date()}
//                       mode="date"
//                       display={Platform.OS === 'ios' ? 'inline' : 'default'}
//                       onChange={handleDateChange}
//                       minimumDate={new Date()}
//                     />
//                   )}
//                 </View>
//                 <View style={styles.formGroup}>
//                   <Text style={styles.formLabel}>File</Text>
//                   <View style={styles.fileContainer}>
//                     {form.file ? (
//                       <View style={styles.filePreview}>
//                         <Text style={styles.fileName}>{form.file.name}</Text>
//                         <TouchableOpacity onPress={handleRemoveFile}>
//                           <X size={20} color={COLORS.error} />
//                         </TouchableOpacity>
//                       </View>
//                     ) : (
//                       <TouchableOpacity
//                         style={styles.fileButton}
//                         onPress={handleFilePick}
//                       >
//                         <Text style={styles.fileButtonText}>Choose File</Text>
//                       </TouchableOpacity>
//                     )}
//                     {Platform.OS === 'web' && (
//                       <input
//                         type="file"
//                         ref={(el: HTMLInputElement | null) => {
//                           fileInputRef.current = el;
//                         }}
//                         style={{ display: 'none' }}
//                         onChange={handleWebFileChange}
//                         accept="/"
//                       />
//                     )}
//                   </View>
//                 </View>
//                 <View style={styles.formGroup}>
//                   <Text style={styles.formLabel}>Resource Link</Text>
//                   <TextInput
//                     style={styles.formInput}
//                     value={form.link}
//                     onChangeText={(text) => setForm({ ...form, link: text })}
//                     placeholder="Enter URL (e.g., https://example.com)"
//                     placeholderTextColor={COLORS.gray}
//                     keyboardType="url"
//                   />
//                 </View>
//                 <View style={styles.modalButtons}>
//                   <TouchableOpacity
//                     style={styles.modalButtonCancel}
//                     onPress={handleModalCancel}
//                   >
//                     <Text style={styles.modalButtonText}>Cancel</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={styles.modalButtonSave}
//                     onPress={handleModalConfirm}
//                   >
//                     <Text style={styles.modalButtonText}>
//                       {modalType === 'create' ? 'Create' : 'Save'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               </>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.background },
//   content: { flex: 1, padding: SPACING.md },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: SPACING.sm,
//     marginBottom: SPACING.md,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.white,
//     borderRadius: 8,
//     ...SHADOWS.small,
//   },
//   searchIcon: { marginLeft: SPACING.md },
//   searchInput: {
//     flex: 1,
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//   },
//   createButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.primary,
//     borderRadius: 8,
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     gap: SPACING.xs,
//     ...SHADOWS.small,
//   },
//   createButtonText: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.sm,
//     color: COLORS.white,
//   },
//   assignmentsList: { flex: 1 },
//   assignmentCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: SPACING.md,
//     marginBottom: SPACING.md,
//     ...SHADOWS.small,
//   },
//   assignmentHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: SPACING.sm,
//   },
//   assignmentTitle: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.lg,
//     color: COLORS.darkGray,
//     flex: 1,
//   },
//   actionButtons: { flexDirection: 'row', gap: SPACING.sm },
//   iconButton: { padding: SPACING.md },
//   disabledButton: { opacity: 0.6 },
//   assignmentDetails: {
//     borderTopWidth: 1,
//     borderTopColor: COLORS.lightGray,
//     paddingTop: SPACING.sm,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: SPACING.sm,
//   },
//   detailLabel: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.sm,
//     color: COLORS.gray,
//     marginRight: SPACING.xs,
//   },
//   detailValue: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.sm,
//     color: COLORS.darkGray,
//   },
//   gradeButton: {
//     backgroundColor: COLORS.secondary,
//     borderRadius: 8,
//     paddingVertical: SPACING.sm,
//     alignItems: 'center',
//   },
//   gradeButtonText: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.md,
//     color: COLORS.white,
//   },
//   noAssignmentsText: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.gray,
//     textAlign: 'center',
//     marginTop: SPACING.lg,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1000,
//   },
//   modalContent: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: SPACING.lg,
//     width: '80%',
//     maxWidth: 400,
//     ...SHADOWS.medium,
//   },
//   modalTitle: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.lg,
//     color: COLORS.darkGray,
//     marginBottom: SPACING.sm,
//   },
//   modalMessage: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.md,
//     color: COLORS.gray,
//     marginBottom: SPACING.md,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: SPACING.sm,
//   },
//   modalButtonCancel: {
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: 8,
//     backgroundColor: COLORS.gray,
//   },
//   modalButtonDelete: {
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: 8,
//     backgroundColor: COLORS.error,
//   },
//   modalButtonSave: {
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//     borderRadius: 8,
//     backgroundColor: COLORS.primary,
//   },
//   modalButtonText: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.md,
//     color: COLORS.white,
//   },
//   formGroup: { marginBottom: SPACING.md },
//   formLabel: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.sm,
//     color: COLORS.darkGray,
//     marginBottom: SPACING.xs,
//   },
//   formInput: {
//     backgroundColor: COLORS.lightGray,
//     borderRadius: 8,
//     padding: SPACING.sm,
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//   },
//   formInputMultiline: { height: 100, textAlignVertical: 'top' },
//   fileContainer: { flexDirection: 'row', alignItems: 'center' },
//   fileButton: {
//     backgroundColor: COLORS.secondary,
//     borderRadius: 8,
//     paddingVertical: SPACING.sm,
//     paddingHorizontal: SPACING.md,
//   },
//   fileButtonText: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.sm,
//     color: COLORS.white,
//   },
//   filePreview: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.lightGray,
//     borderRadius: 8,
//     padding: SPACING.sm,
//     flex: 1,
//   },
//   fileName: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.sm,
//     color: COLORS.darkGray,
//     flex: 1,
//   },
//   dateButton: {
//     backgroundColor: COLORS.lightGray,
//     borderRadius: 8,
//     padding: SPACING.sm,
//   },
//   dateButtonText: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//   },
// });
import React, { useEffect, useState, useRef } from 'react';
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
import { format } from 'date-fns';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import axios from 'axios';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import RNDateTimePicker from '@react-native-community/datetimepicker';

// Debug flags
const DEBUG_BYPASS_ALERT = false; // Bypasses delete confirmation
const DEBUG_FORCE_ALERT = false; // Forces Alert.alert on web

type Assignment = {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate?: string;
  file?: string;
  link?: string;
  courseId?: string;
};

export default function AssignmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    'create' | 'edit' | 'delete' | null
  >(null);
  const [modalAssignmentId, setModalAssignmentId] = useState<string | null>(
    null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: null as Date | null,
    file: null as {
      name: string;
      type: string;
      uri: string;
      base64?: string;
    } | null,
    link: '',
    removeFile: false,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await axios.get<{ assignments: Assignment[] }>(
        'https://assignmentservice-2a8o.onrender.com/api/assignments/all',
        { timeout: 10000 }
      );
      setAssignments(response.data.assignments);
    } catch (error: any) {
      Alert.alert('Error', 'Unable to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = () => {
    setForm({
      courseId: 'default-course',
      title: '',
      description: '',
      dueDate: null,
      file: null,
      link: '',
      removeFile: false,
    });
    setModalType('create');
    setModalVisible(true);
  };

  const handleEditAssignment = async (assignmentId: string) => {
    try {
      const response = await axios.get(
        `https://assignmentservice-2a8o.onrender.com/api/assignments/id?assignmentId=${assignmentId}`,
        { timeout: 10000 }
      );
      const assignment = response.data.assignment;
      setForm({
        courseId: assignment.courseId || 'default-course',
        title: assignment.title || '',
        description: assignment.description || '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
        file: assignment.file
          ? { name: 'Existing File', type: 'unknown', uri: assignment.file }
          : null,
        link: assignment.link || '',
        removeFile: false,
      });
      setModalAssignmentId(assignmentId);
      setModalType('edit');
      setModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load assignment details.');
    }
  };

  const handleFilePick = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      Alert.alert('Info', 'File picking is only supported on web.');
    }
  };

  const handleWebFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setForm({
          ...form,
          file: {
            name: file.name,
            type: file.type || 'application/octet-stream',
            uri: URL.createObjectURL(file),
            base64,
          },
          removeFile: false,
        });
      };
      reader.onerror = () => {
        Alert.alert('Error', 'Failed to read file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setForm({ ...form, file: null, removeFile: true });
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    } // Keep open for iOS, close for Android

    if (event.type === 'set' && selectedDate) {
      setForm({ ...form, dueDate: selectedDate });
    }
    // On Android, the picker will auto-dismiss on selection
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDateTime = (date: Date | null): string => {
    if (!date) return '';
    return format(date, "yyyy-MM-dd'T'HH:mm:00");
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
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => performDelete(assignmentId),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const performDelete = async (assignmentId: string) => {
    try {
      setDeletingId(assignmentId);
      await axios.delete(
        'https://assignmentservice-2a8o.onrender.com/api/assignments',
        {
          params: { assignmentId },
          timeout: 10000,
        }
      );
      setAssignments((prev) =>
        prev.filter((assignment) => assignment.assignmentId !== assignmentId)
      );
      await fetchAssignments();
      if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
        Alert.alert('Success', 'Assignment deleted successfully.');
      }
    } catch (error: any) {
      if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
        Alert.alert(
          'Error',
          'Failed to delete assignment: ' +
            (error.response?.data?.message || error.message)
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const performCreate = async (formData: {
    courseId: string;
    title: string;
    description: string;
    dueDate: Date | null;
    file: any;
    link: string;
  }) => {
    if (!formData.courseId.trim()) {
      Alert.alert('Error', 'Course ID cannot be empty.');
      return;
    }
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title cannot be empty.');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description cannot be empty.');
      return;
    }
    if (
      formData.link &&
      !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(formData.link)
    ) {
      Alert.alert('Error', 'Invalid URL format.');
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('courseId', formData.courseId);
      formDataPayload.append('title', formData.title);
      formDataPayload.append('description', formData.description);
      if (formData.dueDate)
        formDataPayload.append('dueDate', formatDateTime(formData.dueDate));
      formDataPayload.append('resourceLink', formData.link || '');
      if (formData.file && formData.file.base64) {
        const blob = new Blob(
          [Buffer.from(formData.file.base64.split(',')[1], 'base64')],
          { type: formData.file.type }
        );
        formDataPayload.append('file', blob, formData.file.name);
      } else {
        formDataPayload.append('file', new Blob([]), 'empty.txt');
      }

      await axios.post(
        'https://assignmentservice-2a8o.onrender.com/api/assignments',
        formDataPayload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000,
        }
      );
      await fetchAssignments();
      Alert.alert('Success', 'Assignment created successfully.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to create assignment: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const performEdit = async (
    assignmentId: string,
    formData: {
      courseId: string;
      title: string;
      description: string;
      dueDate: Date | null;
      file: any;
      link: string;
      removeFile: boolean;
    }
  ) => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title cannot be empty.');
      return;
    }
    if (
      formData.link &&
      !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(formData.link)
    ) {
      Alert.alert('Error', 'Invalid URL format.');
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append('assignmentId', assignmentId);
      if (formData.courseId)
        formDataPayload.append('courseId', formData.courseId);
      if (formData.title) formDataPayload.append('title', formData.title);
      if (formData.description)
        formDataPayload.append('description', formData.description);
      if (formData.dueDate)
        formDataPayload.append('dueDate', formatDateTime(formData.dueDate));
      if (formData.link) formDataPayload.append('resourceLink', formData.link);
      if (formData.file && formData.file.base64) {
        const blob = new Blob(
          [Buffer.from(formData.file.base64.split(',')[1], 'base64')],
          { type: formData.file.type }
        );
        formDataPayload.append('file', blob, formData.file.name);
      }

      await axios.put(
        'https://assignmentservice-2a8o.onrender.com/api/assignments',
        formDataPayload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000,
        }
      );
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.assignmentId === assignmentId
            ? {
                ...assignment,
                courseId: formData.courseId || assignment.courseId,
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate
                  ? formatDateTime(formData.dueDate)
                  : assignment.dueDate,
                file: formData.removeFile
                  ? null
                  : formData.file?.uri || assignment.file,
                link: formData.link,
              }
            : assignment
        )
      );
      await fetchAssignments();
      if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
        Alert.alert('Success', 'Assignment updated successfully.');
      }
    } catch (error: any) {
      if (Platform.OS !== 'web' || DEBUG_FORCE_ALERT) {
        Alert.alert(
          'Error',
          'Failed to update assignment: ' +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const handleModalConfirm = () => {
    if (modalType === 'delete' && modalAssignmentId) {
      performDelete(modalAssignmentId);
    } else if (modalType === 'edit' && modalAssignmentId) {
      performEdit(modalAssignmentId, form);
    } else if (modalType === 'create') {
      performCreate(form);
    }
    setModalVisible(false);
    setModalAssignmentId(null);
    setModalType(null);
    setShowDatePicker(false);
    setForm({
      courseId: 'default-course',
      title: '',
      description: '',
      dueDate: null,
      file: null,
      link: '',
      removeFile: false,
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalAssignmentId(null);
    setModalType(null);
    setShowDatePicker(false);
    setForm({
      courseId: 'default-course',
      title: '',
      description: '',
      dueDate: null,
      file: null,
      link: '',
      removeFile: false,
    });
  };

  const handleGradeSubmissions = (assignmentId: string) => {
    router.push({
      pathname: '/assignments/grade',
      params: { id: assignmentId },
    });
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header title="Assignments" />
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
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAssignment}
          >
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <ScrollView style={styles.assignmentsList}>
            {filteredAssignments.length === 0 ? (
              <Text style={styles.noAssignmentsText}>
                No assignments found.
              </Text>
            ) : (
              filteredAssignments.map((assignment) => (
                <View
                  key={assignment.assignmentId}
                  style={styles.assignmentCard}
                >
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>
                      {assignment.title}
                    </Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                          handleEditAssignment(assignment.assignmentId)
                        }
                      >
                        <Edit2 size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.iconButton,
                          deletingId === assignment.assignmentId &&
                            styles.disabledButton,
                        ]}
                        onPress={() =>
                          handleDeleteAssignment(assignment.assignmentId)
                        }
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
                        {assignment.dueDate
                          ? new Date(assignment.dueDate).toLocaleString()
                          : 'Not set'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.gradeButton}
                      onPress={() =>
                        handleGradeSubmissions(assignment.assignmentId)
                      }
                    >
                      <Text style={styles.gradeButtonText}>
                        Grade Submissions
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'delete' && (
              <>
                <Text style={styles.modalTitle}>Delete Assignment</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete this assignment?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={handleModalCancel}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonDelete}
                    onPress={handleModalConfirm}
                  >
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {(modalType === 'create' || modalType === 'edit') && (
              <>
                <Text style={styles.modalTitle}>
                  {modalType === 'create'
                    ? 'Create Assignment'
                    : 'Edit Assignment'}
                </Text>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Course ID *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form.courseId}
                    onChangeText={(text) =>
                      setForm({ ...form, courseId: text })
                    }
                    placeholder="Enter course ID"
                    placeholderTextColor={COLORS.gray}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Title *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form.title}
                    onChangeText={(text) => setForm({ ...form, title: text })}
                    placeholder="Enter assignment title"
                    placeholderTextColor={COLORS.gray}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formInputMultiline]}
                    value={form.description}
                    onChangeText={(text) =>
                      setForm({ ...form, description: text })
                    }
                    placeholder="Enter assignment description"
                    placeholderTextColor={COLORS.gray}
                    multiline
                    numberOfLines={4}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={showDatePickerModal}
                  >
                    <Text style={styles.dateButtonText}>
                      {form.dueDate
                        ? formatDateTime(form.dueDate)
                        : 'Select date and time'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <RNDateTimePicker
                      value={form.dueDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>File</Text>
                  <View style={styles.fileContainer}>
                    {form.file ? (
                      <View style={styles.filePreview}>
                        <Text style={styles.fileName}>{form.file.name}</Text>
                        <TouchableOpacity onPress={handleRemoveFile}>
                          <X size={20} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.fileButton}
                        onPress={handleFilePick}
                      >
                        <Text style={styles.fileButtonText}>Choose File</Text>
                      </TouchableOpacity>
                    )}
                    {Platform.OS === 'web' && (
                      <input
                        type="file"
                        ref={(el: HTMLInputElement | null) => {
                          fileInputRef.current = el;
                        }}
                        style={{ display: 'none' }}
                        onChange={handleWebFileChange}
                        accept="/"
                      />
                    )}
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Resource Link</Text>
                  <TextInput
                    style={styles.formInput}
                    value={form.link}
                    onChangeText={(text) => setForm({ ...form, link: text })}
                    placeholder="Enter URL (e.g., https://example.com)"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="url"
                  />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonCancel}
                    onPress={handleModalCancel}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonSave}
                    onPress={handleModalConfirm}
                  >
                    <Text style={styles.modalButtonText}>
                      {modalType === 'create' ? 'Create' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  searchIcon: { marginLeft: SPACING.md },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  createButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.white,
  },
  assignmentsList: { flex: 1 },
  assignmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  assignmentTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    flex: 1,
  },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm },
  iconButton: { padding: SPACING.md },
  disabledButton: { opacity: 0.6 },
  assignmentDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginRight: SPACING.xs,
  },
  detailValue: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
  },
  gradeButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  gradeButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  noAssignmentsText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 400,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.sm,
  },
  modalMessage: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalButtonCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray,
  },
  modalButtonDelete: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.error,
  },
  modalButtonSave: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  formGroup: { marginBottom: SPACING.md },
  formLabel: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  formInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.sm,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  formInputMultiline: { height: 100, textAlignVertical: 'top' },
  fileContainer: { flexDirection: 'row', alignItems: 'center' },
  fileButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  fileButtonText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.white,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.sm,
    flex: 1,
  },
  fileName: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.darkGray,
    flex: 1,
  },
  dateButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  dateButtonText: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
});
