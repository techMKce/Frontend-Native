// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
// import Header from '@/components/shared/Header';
// import { useLocalSearchParams, router } from 'expo-router';
// import { Calendar, Upload, X, Download } from 'lucide-react-native';

// // Mock assignment data
// const mockAssignment = {
//   id: '1',
//   name: 'Database Design Project',
//   dueDate: '2024-04-15',
//   description: 'Design and implement a database schema for a university management system. Include entity-relationship diagrams and SQL scripts for table creation and sample data insertion.',
//   course: 'Advanced Database Systems',
//   status: 'submitted',
//   submission: {
//     fileName: 'database_design_v1.pdf',
//     submittedAt: '2024-04-10T15:30:00Z',
//   },
//   feedback: {
//     grade: 'A',
//     comment: 'Excellent work! Your database design is well-structured and properly normalized. The documentation is clear and comprehensive.',
//     gradedAt: '2024-04-12T10:15:00Z',
//   },
// };

// export default function SubmitAssignmentScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const [isSubmitted, setIsSubmitted] = useState(mockAssignment.status === 'submitted');

//   const handleUpload = () => {
//     // Implement file upload logic
//     console.log('Upload file');
//   };

//   const handleSubmit = () => {
//     setIsSubmitted(true);
//   };

//   const handleUnsubmit = () => {
//     setIsSubmitted(false);
//   };

//   const handleDownload = () => {
//     // Implement file download logic
//     console.log('Download file');
//   };

//   return (
//     <View style={styles.container}>
//       <Header title="Assignment Details" />
      
//       <ScrollView style={styles.content}>
//         <View style={styles.detailsCard}>
//           <Text style={styles.assignmentName}>{mockAssignment.name}</Text>
//           <Text style={styles.courseName}>{mockAssignment.course}</Text>
          
//           <View style={styles.dueDateContainer}>
//             <Calendar size={16} color={COLORS.gray} />
//             <Text style={styles.dueDate}>
//               Due: {new Date(mockAssignment.dueDate).toLocaleDateString()}
//             </Text>
//           </View>
          
//           <Text style={styles.description}>{mockAssignment.description}</Text>
//         </View>

//         <View style={styles.submissionCard}>
//           <Text style={styles.sectionTitle}>Submit Your Work</Text>
          
//           {isSubmitted ? (
//             <View style={styles.submittedFile}>
//               <View style={styles.fileInfo}>
//                 <Text style={styles.fileName}>{mockAssignment.submission.fileName}</Text>
//                 <Text style={styles.submissionDate}>
//                   Submitted: {new Date(mockAssignment.submission.submittedAt).toLocaleString()}
//                 </Text>
//               </View>
              
//               <View style={styles.fileActions}>
//                 <TouchableOpacity
//                   style={styles.iconButton}
//                   onPress={handleDownload}
//                 >
//                   <Download size={20} color={COLORS.primary} />
//                 </TouchableOpacity>
                
//                 <TouchableOpacity
//                   style={[styles.iconButton, styles.deleteButton]}
//                   onPress={handleUnsubmit}
//                 >
//                   <X size={20} color={COLORS.error} />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ) : (
//             <TouchableOpacity
//               style={styles.uploadButton}
//               onPress={handleUpload}
//             >
//               <Upload size={24} color={COLORS.primary} />
//               <Text style={styles.uploadText}>Upload Assignment</Text>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               isSubmitted && styles.unsubmitButton
//             ]}
//             onPress={isSubmitted ? handleUnsubmit : handleSubmit}
//           >
//             <Text style={[
//               styles.submitButtonText,
//               isSubmitted && styles.unsubmitButtonText
//             ]}>
//               {isSubmitted ? 'Unsubmit' : 'Submit Assignment'}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {mockAssignment.feedback && (
//           <View style={styles.feedbackCard}>
//             <Text style={styles.sectionTitle}>Feedback</Text>
            
//             <View style={styles.gradeContainer}>
//               <Text style={styles.gradeLabel}>Grade:</Text>
//               <View style={styles.gradeBadge}>
//                 <Text style={styles.gradeText}>{mockAssignment.feedback.grade}</Text>
//               </View>
//             </View>
            
//             <Text style={styles.feedbackComment}>{mockAssignment.feedback.comment}</Text>
            
//             <Text style={styles.gradedDate}>
//               Graded on: {new Date(mockAssignment.feedback.gradedAt).toLocaleString()}
//             </Text>
//           </View>
//         )}

//         <View style={{ height: 100 }} />
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   content: {
//     flex: 1,
//     padding: SPACING.md,
//   },
//   detailsCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: SPACING.lg,
//     marginBottom: SPACING.md,
//     ...SHADOWS.small,
//   },
//   assignmentName: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.lg,
//     color: COLORS.darkGray,
//     marginBottom: SPACING.xs,
//   },
//   courseName: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.gray,
//     marginBottom: SPACING.sm,
//   },
//   dueDateContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: SPACING.md,
//   },
//   dueDate: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.sm,
//     color: COLORS.gray,
//     marginLeft: SPACING.xs,
//   },
//   description: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//     lineHeight: 24,
//   },
//   submissionCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: SPACING.lg,
//     marginBottom: SPACING.md,
//     ...SHADOWS.small,
//   },
//   sectionTitle: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.lg,
//     color: COLORS.darkGray,
//     marginBottom: SPACING.md,
//   },
//   uploadButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: `${COLORS.primary}10`,
//     borderWidth: 1,
//     borderColor: COLORS.primary,
//     borderStyle: 'dashed',
//     borderRadius: 8,
//     padding: SPACING.lg,
//     marginBottom: SPACING.md,
//   },
//   uploadText: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.md,
//     color: COLORS.primary,
//     marginLeft: SPACING.sm,
//   },
//   submittedFile: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: COLORS.background,
//     borderRadius: 8,
//     padding: SPACING.md,
//     marginBottom: SPACING.md,
//   },
//   fileInfo: {
//     flex: 1,
//   },
//   fileName: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//     marginBottom: 2,
//   },
//   submissionDate: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.sm,
//     color: COLORS.gray,
//   },
//   fileActions: {
//     flexDirection: 'row',
//     gap: SPACING.sm,
//   },
//   iconButton: {
//     padding: SPACING.xs,
//   },
//   deleteButton: {
//     backgroundColor: `${COLORS.error}10`,
//     borderRadius: 4,
//   },
//   submitButton: {
//     backgroundColor: COLORS.primary,
//     borderRadius: 8,
//     padding: SPACING.md,
//     alignItems: 'center',
//   },
//   submitButtonText: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.md,
//     color: COLORS.white,
//   },
//   unsubmitButton: {
//     backgroundColor: COLORS.white,
//     borderWidth: 1,
//     borderColor: COLORS.error,
//   },
//   unsubmitButtonText: {
//     color: COLORS.error,
//   },
//   feedbackCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: SPACING.lg,
//     marginBottom: SPACING.md,
//     ...SHADOWS.small,
//   },
//   gradeContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: SPACING.md,
//   },
//   gradeLabel: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//     marginRight: SPACING.sm,
//   },
//   gradeBadge: {
//     backgroundColor: `${COLORS.primary}20`,
//     paddingHorizontal: SPACING.sm,
//     paddingVertical: SPACING.xs,
//     borderRadius: 12,
//   },
//   gradeText: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.md,
//     color: COLORS.primary,
//   },
//   feedbackComment: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//     lineHeight: 24,
//     marginBottom: SPACING.md,
//   },
//   gradedDate: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.sm,
//     color: COLORS.gray,
//     textAlign: 'right',
//   },
// });

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import * as DocumentPicker from 'expo-document-picker';
import { Calendar, Upload, X } from 'lucide-react-native';
import { router } from 'expo-router';
// Mock assignment data for display only
const mockAssignment = {
  name: 'Database Design Project',
  dueDate: '2024-04-15',
  description:
    'Design and implement a database schema for a university management system. Include ER diagrams and SQL scripts for table creation and sample data insertion.',
  course: 'Advanced Database Systems',
};

export default function SubmitAssignmentScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handlePick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled) setSelectedFile(res.assets[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    // → call your API/upload here
    setIsSubmitted(true);
  };

  const handleUnsubmit = () => {
    setSelectedFile(null);
    setIsSubmitted(false);
    setTimeout(() => {
      router.push('/(student)/assignments'); // Adjust this path as needed
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Header title="Submit Assignment" />

      <ScrollView style={styles.content}>
        {/* KEEP THIS DETAILS CARD */}
        <View style={styles.detailsCard}>
          <Text style={styles.assignmentName}>{mockAssignment.name}</Text>
          <Text style={styles.courseName}>{mockAssignment.course}</Text>

          <View style={styles.dueDateContainer}>
            <Calendar size={16} color={COLORS.gray} />
            <Text style={styles.dueDate}>
              Due: {new Date(mockAssignment.dueDate).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.description}>{mockAssignment.description}</Text>
        </View>

        {/* SUBMISSION CARD: only upload + submit */}
        <View style={styles.submissionCard}>
          <Text style={styles.sectionTitle}>Submission Assignment</Text>

          {!selectedFile ? (
            <TouchableOpacity style={styles.uploadButton} onPress={handlePick}>
              <Upload size={24} color={COLORS.primary} />
              <Text style={styles.uploadText}>Upload your file</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.submittedFile}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <TouchableOpacity style={styles.iconButton} onPress={handleUnsubmit}>
                <X size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedFile || isSubmitted) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={!selectedFile || isSubmitted}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitted ? 'Submitted' : 'Submit Assignment'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.md },

  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  assignmentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  courseName: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dueDate: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    lineHeight: 24,
  },

  submissionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: SPACING.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  uploadText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  submittedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  fileName: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
  },
  iconButton: {
    padding: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
});