import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, Linking, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function Displaycourses() {
  const params = useLocalSearchParams();
  const [getAxiosSection, setAxiosSection] = useState([]);
  const [showSection, setShowSection] = useState(true);
  const [showAss, setShowAss] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [showAddContentForm, setShowAddContentForm] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');

  
  // State for video URLs in the add section form
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  // State for pdf URLs in the add section form
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  
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
  image: 'https://t3.ftcdn.net/jpg/03/22/69/00/240_F_322690073_C3HGQDDRUmwHrDgf28PIRtXWFeWyBaLD.jpg',
  description: 'This is a dummy course for demonstration purposes.',
  instructorName: 'John Doe',
  dept: 'Computer Science',
  duration: '10',
  credit: '3',

  // Section metadata (only title and description)
  sections: [
    {
      id: '1',
      title: 'Introduction',
      description: 'This is a dummy course for demonstration purposes.'
    },
    {
      id: '2',
      title: 'Section 2',
      description: 'This is a dummy course for demonstration purposes.'
    }
  ],

  // Content mapped by section ID (relates to course and sections)
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
        // course.sections = matchedCourse || [];
    }
  }



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
          onPress={() => {setShowSection(true); setShowAss(false); setShowReport(false);}}
        >
          <Text style={[styles.submitButtonText, { color: showSection ? '#fff' : '#000' }]}>Section</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: showAss ? '#007BFF' : '#fff',
              borderWidth: 1,
              borderColor: '#000',
              flex: 1,
              marginLeft: 10,
            },
          ]}
          onPress={() => {setShowSection(false); setShowAss(true); setShowReport(false);setShowAddSectionForm(false);} }
        >
          <Text style={[styles.submitButtonText, { color: showAss ? '#fff' : '#000' }]}>Assignment</Text>
        </TouchableOpacity>
         <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: showReport ? '#007BFF' : '#fff',
              borderWidth: 1,
              borderColor: '#000',
              flex: 1,
              marginLeft: 10,
            },
          ]}
          onPress={() => {setShowSection(false); setShowAss(false); setShowReport(true); setShowAddSectionForm(false)} }
        >
          <Text style={[styles.submitButtonText, { color: showReport ? '#fff' : '#000' }]}>Report</Text>
        </TouchableOpacity>
        
      </View>
      {showSection &&(<TouchableOpacity 
      onPress={() => setShowAddSectionForm(true)}
      style={{ borderWidth:1, backgroundColor:'green', alignItems:'center', padding:10, marginTop:10, borderRadius:8 }} >
          <Text style={[styles.submitButtonText, ]}>Add Section</Text>
        </TouchableOpacity>)}
      {showAddSectionForm && (
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 5 }}>
          <Text>Title</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, padding: 8 }}
            placeholder="Section Title"
            value={sectionTitle}
            onChangeText={setSectionTitle}
          />
          <Text>Description</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10, padding: 8 }}
            placeholder="Section Description"
            value={sectionDescription}
            onChangeText={setSectionDescription}
          />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#ccc',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                marginRight: 10,
                width: '35%',
                alignItems: 'center',
              }}
              onPress={() => {
                setShowAddSectionForm(false);
                setSectionTitle('');
                setSectionDescription('');
              }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#007BFF',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                width: '35%',
                alignItems: 'center',
              }}
              onPress={() => {
                // Save logic here
                setShowAddSectionForm(false);
                course.sections.push({
                  id: (course.sections.length + 1).toString(),
                  title: sectionTitle,
                  description: sectionDescription,
                });
                setSectionTitle('');
                setSectionDescription('');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showAddContentForm && (
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 5 }}>
          <Text>Video</Text>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 5,
                    padding: 8,
                    marginRight: 10,
                  }}
                  placeholder="Video URL"
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#007BFF',
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    if (videoUrl.trim()) {
                      setVideoUrls([...videoUrls, videoUrl.trim()]);
                      setVideoUrl('');
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
                </TouchableOpacity>
              </View>
              {videoUrls.map((url, idx) => (
                <Text key={idx} style={{ marginBottom: 5, color: 'gray' }}>
                  {url}
                </Text>
              ))}
            </View>
          <Text>Pdf</Text>
          <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 5,
                    padding: 8,
                    marginRight: 10,
                  }}
                  placeholder="Pdf URL"
                  value={pdfUrl}
                  onChangeText={setPdfUrl}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#007BFF',
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    if (pdfUrl.trim()) {
                      setPdfUrls([...pdfUrls, pdfUrl.trim()]);
                      setPdfUrl('');
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
                </TouchableOpacity>
              </View>
              {pdfUrls.map((url, idx) => (
                <Text key={idx} style={{ marginBottom: 5, color: 'gray' }}>
                  {url}
                </Text>
              ))}
            </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#ccc',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                marginRight: 10,
                width: '35%',
                alignItems: 'center',
              }}
              onPress={() => {
                setShowAddContentForm(false);
                setVideoUrls([]);
                setVideoUrl('');    
                setPdfUrls([]);
                setPdfUrl('');
              }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#007BFF',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
                width: '35%',
                alignItems: 'center',
              }}
              onPress={() => {
                // Save logic here
                setShowAddContentForm(false);
                course.sections.push({
                  id: (course.sections.length + 1).toString(),
                  title: sectionTitle,
                  description: sectionDescription,
                  videos: videoUrls.map((url) => ({ title: `Video ${url}`, link: url })),
                  pdfs: pdfUrls.map((url) => ({ title: `PDF ${url}`, link: url })),
                });
                setVideoUrls([]);
                setVideoUrl('');    
                setPdfUrls([]);
                setPdfUrl('');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={showSection ? course.sections : course.assignments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
            <View>
            <View style={{ position: 'relative' }}>
              <Image style={styles.image} source={{ uri: course.image }} />
              <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: 10,
                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              >
              <Text style={{ color: '#fff', fontWeight: 'bold', flex: 1 }}>
                {course.instructorName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                {/* Clock Icon */}
                <Text style={{ color: '#fff', marginRight: 3 }}>🕒</Text>
                <Text style={{ color: '#fff', marginRight: 10 }}>{course.duration}Weeks</Text>
                {/* File Icon */}
                <Text style={{ color: '#fff', marginRight: 3 }}>📄</Text>
                <Text style={{ color: '#fff' }}>{course.credit} credits</Text>
              </View>
              </View>
            </View>
            <Text style={styles.description}>{course.description}</Text>
            </View>
        }
        renderItem={({ item }) =>
          showSection ? (
            <View style={styles.sectionContainer}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View >
              <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddSectionForm(true);
                    setSectionTitle(item.title);
                    setSectionDescription(item.description);
                    setVideoUrls(item.videos.map((v) => v.link));
                    setPdfUrls(item.pdfs.map((p) => p.link));
                  }}
                  style={{ marginLeft: 10, backgroundColor: '#007BFF', padding: 5, borderRadius: 5 }}
                >
                  <Text style={{ color: '#fff' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const updatedSections = course.sections.filter((section) => section.id !== item.id);
                    course.sections.length = 0;
                    updatedSections.forEach((s) => course.sections.push(s));
                    console.log(course.sections);
                    // Optionally, force update if needed (using a state)
                  }}
                  style={{ marginLeft: 10, backgroundColor: 'red', padding: 5, borderRadius: 5 }}
                >
                  <Text style={{ color: '#fff' }}>Delete</Text>
                </TouchableOpacity>
              </View>
              </View>

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

              <TouchableOpacity style={[ styles.submitButton, ]} onPress={() => setShowAddContentForm(true)}>
                <Text style={styles.submitButtonText}>Add Content</Text>
              </TouchableOpacity>

              
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
    height: 130,
    width: '100%',
    borderRadius: 10,
    marginTop: 10,
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
    borderRadius: 8,
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