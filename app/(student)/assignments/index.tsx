// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
// import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
// import Header from '@/components/shared/Header';
// import { Search, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
// import { router } from 'expo-router';

// // Mock assignments data
// const mockAssignments = [
//   {
//     id: '1',
//     name: 'Database Design Project',
//     dueDate: '2024-04-15',
//     course: 'Advanced Database Systems',
//     status: 'pending', // pending, submitted, graded
//     grade: null,
//   },
//   {
//     id: '2',
//     name: 'Algorithm Analysis',
//     dueDate: '2024-04-20',
//     course: 'Data Structures',
//     status: 'submitted',
//     grade: null,
//   },
//   {
//     id: '3',
//     name: 'Web Development Project',
//     dueDate: '2024-04-10',
//     course: 'Web Technologies',
//     status: 'graded',
//     grade: 'A',
//   },
// ];

// export default function StudentAssignmentsScreen() {
//   const [searchQuery, setSearchQuery] = useState('');

//   const filteredAssignments = mockAssignments.filter(
//     (assignment) =>
//       assignment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       assignment.course.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'pending':
//         return COLORS.warning;
//       case 'submitted':
//         return COLORS.success;
//       case 'graded':
//         return COLORS.primary;
//       default:
//         return COLORS.gray;
//     }
//   };

//   const getStatusText = (status: string) => {
//     switch (status) {
//       case 'pending':
//         return 'Submit Assignment';
//       case 'submitted':
//         return 'Submitted';
//       case 'graded':
//         return 'Graded';
//       default:
//         return status;
//     }
//   };

//   const handleAssignmentAction = (id: string) => {
//     router.push({
//       pathname: '/assignments/submit',
//       params: { id }
//     });
//   };

//   const renderAssignmentCard = ({ item }: { item: typeof mockAssignments[0] }) => (
//     <View style={styles.assignmentCard}>
//       <View style={styles.assignmentHeader}>
//         <View>
//           <Text style={styles.assignmentName}>{item.name}</Text>
//           <Text style={styles.courseName}>{item.course}</Text>
//         </View>
//         {item.grade && (
//           <View style={styles.gradeBadge}>
//             <Text style={styles.gradeText}>{item.grade}</Text>
//           </View>
//         )}
//       </View>

//       <View style={styles.dueDateContainer}>
//         <Calendar size={16} color={COLORS.gray} />
//         <Text style={styles.dueDate}>
//           Due: {new Date(item.dueDate).toLocaleDateString()}
//         </Text>
//         {new Date(item.dueDate) < new Date() && item.status === 'pending' && (
//           <View style={styles.overdueContainer}>
//             <AlertCircle size={16} color={COLORS.error} />
//             <Text style={styles.overdueText}>Overdue</Text>
//           </View>
//         )}
//       </View>

//       <TouchableOpacity
//         style={[
//           styles.actionButton,
//           { backgroundColor: getStatusColor(item.status) },
//           item.status === 'graded' && styles.disabledButton
//         ]}
//         onPress={() => handleAssignmentAction(item.id)}
//         disabled={item.status === 'graded'}
//       >
//         <Text style={styles.actionButtonText}>
//           {getStatusText(item.status)}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Header title="Assignments" />
      
//       <View style={styles.content}>
//         <View style={styles.searchContainer}>
//           <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search assignments..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             placeholderTextColor={COLORS.gray}
//           />
//         </View>

//         <FlatList
//           data={filteredAssignments}
//           renderItem={renderAssignmentCard}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//         />
//       </View>
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
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.white,
//     borderRadius: 8,
//     paddingHorizontal: SPACING.md,
//     marginBottom: SPACING.md,
//     ...SHADOWS.small,
//   },
//   searchIcon: {
//     marginRight: SPACING.sm,
//   },
//   searchInput: {
//     flex: 1,
//     fontFamily: FONT.regular,
//     fontSize: SIZES.md,
//     color: COLORS.darkGray,
//     paddingVertical: SPACING.md,
//   },
//   listContainer: {
//     paddingBottom: 100,
//   },
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
//     alignItems: 'flex-start',
//     marginBottom: SPACING.sm,
//   },
//   assignmentName: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.lg,
//     color: COLORS.darkGray,
//     marginBottom: 2,
//   },
//   courseName: {
//     fontFamily: FONT.regular,
//     fontSize: SIZES.sm,
//     color: COLORS.gray,
//   },
//   gradeBadge: {
//     backgroundColor: `${COLORS.primary}20`,
//     paddingHorizontal: SPACING.sm,
//     paddingVertical: SPACING.xs,
//     borderRadius: 12,
//   },
//   gradeText: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.sm,
//     color: COLORS.primary,
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
//   overdueContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginLeft: SPACING.md,
//   },
//   overdueText: {
//     fontFamily: FONT.medium,
//     fontSize: SIZES.sm,
//     color: COLORS.error,
//     marginLeft: SPACING.xs,
//   },
//   actionButton: {
//     borderRadius: 8,
//     paddingVertical: SPACING.sm,
//     alignItems: 'center',
//   },
//   actionButtonText: {
//     fontFamily: FONT.semiBold,
//     fontSize: SIZES.md,
//     color: COLORS.white,
//   },
//   disabledButton: {
//     opacity: 0.7,
//   },
// });
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import Header from '@/components/shared/Header';
import { Search, Calendar, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

// Mock assignments data
const mockAssignments = [
  {
    id: '1',
    name: 'Database Design Project',
    dueDate: '2024-04-15',
    course: 'Advanced Database Systems',
    status: 'Submit',
    grade: null,
    submittedFile: null,
    feedback: null,
  },
  {
    id: '2',
    name: 'Algorithm Analysis',
    dueDate: '2024-04-20',
    course: 'Data Structures',
    status: 'submitted',
    grade: null,
    submittedFile: 'analysis.pdf',
    feedback: null,
  },
  {
    id: '3',
    name: 'Web Development Project',
    dueDate: '2024-04-10',
    course: 'Web Technologies',
    status: 'graded',
    grade: 'A',
    submittedFile: 'web_project.pdf',
    feedback: 'Well structured with great use of components.',
  },
];

export default function StudentAssignmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssignments = mockAssignments.filter(
    (assignment) =>
      assignment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'submitted':
        return COLORS.success;
      case 'graded':
        return COLORS.primary;
      default:
        return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Submit';
      case 'submitted':
        return 'Submitted';
      case 'graded':
        return 'Graded';
      default:
        return status;
    }
  };

  const handleAssignmentAction = (assignment: typeof mockAssignments[0]) => {
    if (assignment.status === 'submitted') {
      router.push({
        pathname: '/assignments/resubmit',
        params: { id: assignment.id },
      });
    } else {
      router.push({
        pathname: '/assignments/submit',
        params: { id: assignment.id },
      });
    }
  };
  

  const renderAssignmentCard = ({ item }: { item: typeof mockAssignments[0] }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <View>
          <Text style={styles.assignmentName}>{item.name}</Text>
          <Text style={styles.courseName}>{item.course}</Text>
        </View>
        {item.grade && (
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{item.grade}</Text>
          </View>
        )}
      </View>

      <View style={styles.dueDateContainer}>
        <Calendar size={16} color={COLORS.gray} />
        <Text style={styles.dueDate}>
          Due: {new Date(item.dueDate).toLocaleDateString()}
        </Text>
        {new Date(item.dueDate) < new Date() && item.status === 'pending' && (
          <View style={styles.overdueContainer}>
            <AlertCircle size={16} color={COLORS.error} />
            <Text style={styles.overdueText}>Overdue</Text>
          </View>
        )}
      </View>

      {item.submittedFile && (
        <Text style={styles.metaInfo}>
          <Text style={styles.metaLabel}>Submitted File: </Text>
          {item.submittedFile}
        </Text>
      )}

      {item.feedback && (
        <Text style={styles.metaInfo}>
          <Text style={styles.metaLabel}>Feedback: </Text>
          {item.feedback}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: getStatusColor(item.status) },
          item.status === 'graded' && styles.disabledButton,
        ]}
        onPress={() => handleAssignmentAction(item)}
        disabled={item.status === 'graded'}
      >
        <Text style={styles.actionButtonText}>
          {getStatusText(item.status)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Assignments" />
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assignments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: SIZES.md,
    color: COLORS.darkGray,
    paddingVertical: SPACING.md,
  },
  listContainer: {
    paddingBottom: 100,
  },
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
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  assignmentName: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.lg,
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  courseName: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
  },
  gradeBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  gradeText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.sm,
    color: COLORS.primary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dueDate: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  overdueText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  metaInfo: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  metaLabel: {
    fontFamily: FONT.semiBold,
    color: COLORS.darkGray,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  actionButtonText: {
    fontFamily: FONT.semiBold,
    fontSize: SIZES.md,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.7,
  },
});