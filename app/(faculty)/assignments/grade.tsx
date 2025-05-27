import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';
const submissions = [
  { id: '1', name: 'Alex Johnson', roll: 'CS20001', date: 'May 25, 2025', action: 'Review' },
  { id: '2', name: 'Samantha Lee', roll: 'CS20002', date: 'May 26, 2025', action: 'Review' },
  { id: '3', name: 'Daniel Brown', roll: 'CS20003', date: 'May 26, 2025', action: 'Grade' },
  { id: '4', name: 'Emily Davis', roll: 'CS20004', date: 'May 27, 2025', action: 'Grade' },
  { id: '5', name: 'James Wilson', roll: 'CS20005', date: 'May 27, 2025', action: 'Grade' },
];

export default function GradeSubmissionsScreen() {
  const [search, setSearch] = useState('');

  const filtered = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Grade Submissions</Text>
      <Text style={styles.subheader}>Database Design Project</Text>

      <View style={styles.infoCard}>
        <View>
          <Text style={styles.label}>Due Date</Text>
          <Text style={styles.value}>May 30, 2025</Text>
        </View>
        <View>
          <Text style={styles.label}>Submissions</Text>
          <Text style={styles.value}>45</Text>
        </View>
        <View>
          <Text style={styles.label}>Graded</Text>
          <Text style={styles.value}>32 / 45</Text>
        </View>
        <TouchableOpacity style={styles.downloadBtn}>
          <Icon name="download-outline" size={16} color="#1D4E89" />
          <Text style={styles.downloadText}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search by student name or roll number..."
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <Icon name="person-circle-outline" size={36} color="#888" />
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.roll}>{item.roll}</Text>
            </View>
            <View style={styles.submittedOn}>
              <Icon name="time-outline" size={14} color="#555" />
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <TouchableOpacity
  style={styles.actionButton}
  onPress={() => {
    if (item.action === "Review") {
      router.push({ pathname: '/(faculty)/assignments/ViewGradedSubmissionScreen', params: { id: item.id } });
    } else  {
      router.push({ pathname: '/(faculty)/assignments/GradeSubmissionScreen', params: { id: item.id } });
    }
  }}
>
  <Icon name="document-text-outline" size={16} color="#fff" />
  <Text style={styles.actionText}>{item.action}</Text>
</TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F6F6' },
  header: { fontSize: 24, fontWeight: 'bold',marginBottom:8,
    marginTop:32, color: '#1D4E89' },
  subheader: { fontSize: 16, color: '#777', marginBottom: 12 },
  infoCard: {
    backgroundColor: '#E3E6E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 12, color: '#555' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 8,
    borderColor: '#1D4E89',
    borderWidth: 1,
  },
  downloadText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#1D4E89',
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  studentInfo: {
    flex: 2,
    marginLeft: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roll: {
    fontSize: 12,
    color: '#777',
  },
  submittedOn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
  actionButton: {
    backgroundColor: '#1D4E89',
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
});
