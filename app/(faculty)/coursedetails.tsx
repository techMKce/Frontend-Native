import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function Displaycourses() {
  const params = useLocalSearchParams();
  const [getAxiosSection, setAxiosSection] = useState([]);

  useEffect(() => {
    axios.get('https://6835376fcd78db2058c098e8.mockapi.io/api/course')
      .then(res => {
        setAxiosSection(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  const idMatch = params.course ? JSON.parse(params.course as string).id : null;

  const course = {
    id: '1',
    name: 'Dummy Course',
    image: 'https://via.placeholder.com/300',
    description: 'This is a dummy course for demonstration purposes.',
    sections: [
      {
        id: '1',
        title: 'Introduction',
        videos: [
          { title: 'Intro Video 1', link: 'https://youtu.be/CEhVifRTPr0?si=fXnO74nPWpNFdrIE' },
          { title: 'Intro Video 2', link: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
        ],
        pdfs: [
          { title: 'Sample PDF 1', link: 'https://www.africau.edu/images/default/sample.pdf' },
          { title: 'Sample PDF 2', link: 'https://www.africau.edu/images/default/sample.pdf' },
        ],
      },
      {
        id: '2',
        title: 'Section 2',
        videos: [
          { title: 'Section 2 Video', link: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
        ],
        pdfs: [
          { title: 'Section 2 PDF', link: 'https://faculty.ksu.edu.sa/sites/default/files/blotting_1.pdf' },
        ],
      },
    ],
  };

  if (idMatch !== null) {
    const matchedCourse = getAxiosSection.find((s) => s.id === idMatch);
    if (matchedCourse) {
        // course.sections = matchedCourse || [];
    }
  }

  const [showSection, setShowSection] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.courseTitle}>{course.name}</Text>
      <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: showSection ? '#007BFF' : '#fff',
              borderWidth: 1,
              borderColor: '#000',
              flex: 1,
            },
          ]}
          onPress={() => setShowSection(true)}
        >
          <Text style={[styles.submitButtonText, { color: showSection ? '#fff' : '#000' }]}>Section</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: !showSection ? '#007BFF' : '#fff',
              borderWidth: 1,
              borderColor: '#000',
              flex: 1,
              marginLeft: 10,
            },
          ]}
          onPress={() => setShowSection(false)}
        >
          <Text style={[styles.submitButtonText, { color: !showSection ? '#fff' : '#000' }]}>Assignment</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={showSection ? course.sections : course.assignments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View>
            <Image style={styles.image} source={{ uri: course.image }} />
            <Text style={styles.description}>{course.description}</Text>
          </View>
        }
        renderItem={({ item }) =>
          showSection ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{item.title}</Text>

              {/* Render multiple videos */}
              {item.videos?.map((video, index) => (
                <TouchableOpacity
                  key={`video-${index}`}
                  onPress={() => Linking.openURL(video.link)}
                  accessible
                  accessibilityRole="link"
                  accessibilityLabel={`Open Video: ${video.title}`}
                >
                  <Text style={{ color: 'blue', textDecorationLine: 'underline', marginBottom: 10 }}>
                  ▶️ {video.title} (Open Video)
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Render multiple PDFs */}
              {item.pdfs?.map((pdf, index) => (
                <TouchableOpacity
                  key={`pdf-${index}`}
                  onPress={() => Linking.openURL(pdf.link)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`Download PDF: ${pdf.title}`}
                >
                  <Text style={styles.downloadLink}>📄 {pdf.title} (Download)</Text>
                </TouchableOpacity>
              ))}
            </View>
          ):(<></>)
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    height: 200,
    width: '100%',
    borderRadius: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
  },
  video: {
    width: '100%',
    height: 200,
    marginTop: 5,
    marginBottom: 10,
  },
  downloadLink: {
    color: 'blue',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
});