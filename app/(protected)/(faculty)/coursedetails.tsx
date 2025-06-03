import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, Linking, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // ✅ ADDED useRouter
import api from '@/service/api';

export default function Displaycourses() {
  const params = useLocalSearchParams();
  const router = useRouter(); // ✅ INIT ROUTER

  type Section = { id: string; [key: string]: any };
  const [getAxiosSection, setAxiosSection] = useState<Section[]>([]);
  const [showSection, setShowSection] = useState(true);
  const [showAss, setShowAss] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [showAddContentForm, setShowAddContentForm] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);

  useEffect(() => {
    api.get('https://6835376fcd78db2058c098e8.mockapi.io/api/course')
      .then(res => setAxiosSection(res.data))
      .catch(err => console.log(err));
  }, []);

  const idMatch = params.course ? JSON.parse(params.course as string).id : null;

  const course = {
    id: '1',
    name: 'Dummy Course',
    image: 'https://t3.ftcdn.net/jpg/03/22/69/00/240_F_322690073_C3HGQDDRUmwHrDgf28PIRtXWFeWyBaLD.jpg',
    description: 'This is a dummy course for demonstration purposes.',
    instructorName: 'John Doe',
    dept: 'Computer Science',
    duration: '10',
    credit: '3',
    sections: [
      { id: '1', title: 'Introduction', description: 'This is a dummy course for demonstration purposes.' },
      { id: '2', title: 'Section 2', description: 'This is a dummy course for demonstration purposes.' }
    ],
    content: {
      '1': {
        id: '1',
        videos: [
          { title: 'Intro Video 1', link: 'https://youtu.be/CEhVifRTPr0?si=fXnO74nPWpNFdrIE' },
          { title: 'Intro Video 2', link: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }
        ],
        pdfs: [
          { title: 'Sample PDF 1', link: 'https://www.africau.edu/images/default/sample.pdf' },
          { title: 'Sample PDF 2', link: 'https://www.africau.edu/images/default/sample.pdf' }
        ]
      },
      '2': {
        id: '2',
        videos: [
          { title: 'Section 2 Video', link: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }
        ],
        pdfs: [
          { title: 'Section 2 PDF', link: 'https://faculty.ksu.edu.sa/sites/default/files/blotting_1.pdf' }
        ]
      }
    }
  };

  if (idMatch !== null) {
    const matchedCourse = getAxiosSection.find((s) => s.id === idMatch);
    if (matchedCourse) {
      // Use matchedCourse if needed
    }
  }

  // 🔁 You can use router.push('/target-screen') where needed, for example after saving a section
  // router.push('/some/route');  <-- example usage

  return (
    <View style={styles.container}>
      <Text style={styles.courseTitle}>{course.name}</Text>
      <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: showSection ? '#007BFF' : '#fff',
            borderWidth: 1,
            borderColor: '#000',
            flex: 1,
          }]}
          onPress={() => { setShowSection(true); setShowAss(false); setShowReport(false); }}
        >
          <Text style={[styles.submitButtonText, { color: showSection ? '#fff' : '#000' }]}>Section</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: showAss ? '#007BFF' : '#fff',
            borderWidth: 1,
            borderColor: '#000',
            flex: 1,
            marginLeft: 10,
          }]}
          onPress={() => { setShowSection(false); setShowAss(true); setShowReport(false); setShowAddSectionForm(false); }}
        >
          <Text style={[styles.submitButtonText, { color: showAss ? '#fff' : '#000' }]}>Assignment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, {
            backgroundColor: showReport ? '#007BFF' : '#fff',
            borderWidth: 1,
            borderColor: '#000',
            flex: 1,
            marginLeft: 10,
          }]}
          onPress={() => { setShowSection(false); setShowAss(false); setShowReport(true); setShowAddSectionForm(false); }}
        >
          <Text style={[styles.submitButtonText, { color: showReport ? '#fff' : '#000' }]}>Report</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  courseTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  submitButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
  },
});