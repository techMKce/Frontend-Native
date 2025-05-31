import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '@/constants/theme';
import api from '@/service/api';

type TimetableItem = {
  id: string;
  date: string;
  course: string;
  session: string;
};

const ExamTimetableScreen = () => {
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const response = await api.get('/examsnative');
        const transformedData: TimetableItem[] = response.data.map((item: any, index: number) => ({
          id: `${index}`, // Create a unique ID using index
          date: item.date,
          course: item.courseName, // Map 'courseName' to 'course'
          session: item.session,
        }));
        setTimetable(transformedData);
      } catch (error) {
        console.error('Failed to fetch exam timetable:', error);
        Alert.alert('Error', 'Could not load timetable');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const handleDownloadPDF = async () => {
    const tableRows = timetable
      .map(item => `<tr><td>${item.date}</td><td>${item.course}</td><td>${item.session}</td></tr>`)
      .join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { width: 80px; height: 80px; margin-bottom: 10px; }
            h1 { font-size: 22px; margin: 0; }
            h2 { font-size: 18px; margin: 5px 0 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th {
              background-color:#1e40af;
              color: white;
              padding: 10px;
              text-align: center;
              font-weight: bold;
            }
            td {
              padding: 10px;
              text-align: center;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEO0BVBpiuKJgJIwF9Xe_Pu4gLagCNX44DXA&s" class="logo" />
            <h1>Karpagam Institutions</h1>
            <h2>Exam Timetable</h2>
          </div>
          <table>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Session</th>
            </tr>
            ${tableRows}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      const newPath = FileSystem.documentDirectory + 'Timetable.pdf';
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(newPath); // Share the moved file
    } catch (err) {
      Alert.alert('Error', 'PDF generation failed');
      console.error(err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Exam Timetable</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : timetable.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Date</Text>
            <Text style={styles.headerText}>Course</Text>
            <Text style={styles.headerText}>Session</Text>
          </View>
          {timetable.map(item => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.cell}>{item.date}</Text>
              <Text style={styles.cell}>{item.course}</Text>
              <Text style={styles.cell}>{item.session}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No exam timetable found.</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleDownloadPDF}>
        <Text style={styles.buttonText}>Download as PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ExamTimetableScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f4f4f4',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    textAlign: 'center',
  },
  table: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e6e6f0',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  headerText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
