import { StyleSheet, Text, TextInput, View, ImageBackground, ScrollView, TouchableOpacity, Modal } from 'react-native'
import React, {useState} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Clock, FileText, Plus } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import Pdf from 'react-native-pdf';
import * as DocumentPicker from 'expo-document-picker';

const coursedetails = () => {
  const [showSheet, setShowSheet] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState('');

  // Toggle bar function
  const [activeTab, setActiveTab] = useState('Content');
  //Toggle bar function
  

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true });
    if (result.assets) {
      const names = result.assets.map(file => file.name);
      setPdfs(prev => [...prev, ...names]);
    }
  };

  const addLink = () => {
    if (currentLink.trim()) {
      setLinks(prev => [...prev, currentLink]);
      setCurrentLink('');
    }
  };

  const removeLink = (index: number) => {
  setLinks(prev => prev.filter((_, i) => i !== index));
};

const removePDF = (index: number) => {
  setPdfs(prev => prev.filter((_, i) => i !== index));
};

const SyllabusViewer = () => {
  const [showPdf, setShowPdf] = useState(false);

  // PDF Source (use a real file path or remote URL)
  const pdfSource = {
    uri: 'https://www.africau.edu/images/default/sample.pdf', // Replace with your actual URL or local path
    cache: true,
  };
}


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          <ImageBackground
            source={{ uri: 'https://t3.ftcdn.net/jpg/03/22/69/00/240_F_322690073_C3HGQDDRUmwHrDgf28PIRtXWFeWyBaLD.jpg' }}
            style={styles.image}
            resizeMode="cover"
          >
            <View style={styles.overlay}>
              <Text style={styles.courseName}>Introduction to Psychology</Text>
              <View style={styles.infoRow}>
                <Text style={styles.facultyName}>Dr. Sun Star</Text>
                <View style={styles.iconText}>
                  <Clock size={14} color="white" />
                  <Text style={styles.iconLabel}>15 weeks</Text>
                </View>
                <View style={styles.iconText}>
                  <FileText size={14} color="white" />
                  <Text style={styles.iconLabel}>4 Credits</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.contentBox}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Course Details</Text>
          </View>
          <Text style={styles.paragraph}>
            "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.syllabusBox}>
              <TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={20} color="#888" />
              <Text style={styles.syllabusText}>Syllabus</Text>
              </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={[styles.actionBtn]}
                onPress={() => setShowSheet(true)}
              >
                <Text style={[styles.actionText,]}>Add Resources</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.actionBtn]}
              >
                <Text style={[styles.actionText,]}>Add Assignments</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'Content' ? styles.activeTab : styles.inactiveTab,
        ]}
        onPress={() => setActiveTab('Content')}
      >
        <Text style={activeTab === 'Content' ? styles.activeText : styles.inactiveText}>
          Resourses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'Assignment' ? styles.activeTab : styles.inactiveTab,
        ]}
        onPress={() => setActiveTab('Assignment')}
      >
        <Text style={activeTab === 'Assignment' ? styles.activeText : styles.inactiveText}>
          Assignments
        </Text>
      </TouchableOpacity>
    </View>

    {/* Conditional Rendering */}
      {activeTab === 'Content' ? (
        <View style={styles.section}>
          {/* Place your content code here */}
          {(links.length === 0 && pdfs.length === 0) ? (
          <View>
            <LottieView
              source={require('../../assets/animations/empty2.json')}
              autoPlay
              loop
              style={{ width: '70%', height: 200, alignSelf: 'center'}}
            />
          </View>
        ) : (
          <View>
            {links.map((title, index) => (
              <View key={index} style={styles.contentCard}>
                <Text style={{ fontWeight: 'bold' }}>{title}</Text>
                <Text>{description}</Text>
              </View>
            ))}
            {pdfs.map((pdf, index) => (
              <View key={index} style={styles.contentCard}>
                <Text>{pdf}</Text>
              </View>
            ))}
          </View>
        )}
        </View>
      ) : (
        <View style={styles.section}>
          {/* Place your assignment code here */}
          <View>
            <LottieView
              source={require('../../assets/animations/empty3.json')}
              autoPlay
              loop
              style={{ width: '70%', height: 200, alignSelf: 'center',}}
            />
          </View>
        </View>
      )}

      </ScrollView>

      

      <Modal
        visible={showSheet}
        onRequestClose={() => setShowSheet(false)}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.sectionTitle}>Add New Resourses</Text>
              <Text style={{ marginTop: 20, fontWeight:'bold', }}>Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

              <Text style={{ marginTop: 15, fontWeight:'bold', }}>Description</Text>
              <TextInput
                style={styles.textArea}
                multiline
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
              />

              <Text style={{ marginTop: 15, fontWeight:'bold', }}>Add Link</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={currentLink}
                  onChangeText={setCurrentLink}
                  placeholder="https://example.com"
                />
                <TouchableOpacity onPress={addLink} style={{ marginLeft: 10 }}>
                  <Plus size={20} color="#007bff" />
                </TouchableOpacity>
              </View>

              {links.map((link, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={{ flex: 1 }}>{link}</Text>
                  <TouchableOpacity onPress={() => removeLink(index)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={{ marginTop: 15, fontWeight:'bold', }}>Upload PDFs</Text>
              <TouchableOpacity onPress={pickPDF} style={styles.uploadBox}>
                <Text style={{ color: '#555' }}>Tap to upload PDF</Text>
              </TouchableOpacity>

              {pdfs.map((pdf, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={{ flex: 1 }}>{pdf}</Text>
                  <TouchableOpacity onPress={() => removePDF(index)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowSheet(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => setShowSheet(false)}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default coursedetails;

const styles = StyleSheet.create({
  container: { flex: 1, marginHorizontal: 12 },
  image: { height: 140, justifyContent: 'flex-end', borderRadius: 8, overflow: 'hidden' },
  overlay: { padding: 12 },
  courseName: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  facultyName: { color: 'white', marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, },
  iconText: { flexDirection: 'row', alignItems: 'center' },
  iconLabel: { color: 'white', marginLeft: 4 },
  contentBox: { backgroundColor: '#fff', padding: 16, margin: 12, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  paragraph: { marginTop: 8, lineHeight: 20, color: '#555' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20, },
  syllabusBox: { flexDirection: 'row', alignItems: 'center' },
  syllabusText: { marginLeft: 6, color: '#888' },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { padding: 8, borderRadius: 8, backgroundColor: '#4a90e2' },
  actionText: { fontSize: 14, alignSelf: 'center', color: 'white' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contentCard: { padding: 12, margin: 12, backgroundColor: '#f5f5f5', borderRadius: 10 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { backgroundColor: 'white', padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 4,  marginRight: 3, height: 50 },
  textArea: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 4, height: 200, marginRight: 3, },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  removeText: { color: 'red', fontSize: 18, marginLeft: 10 },
  uploadBox: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10, height: 80, justifyContent: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 10, borderRadius: 8, backgroundColor: '#eee', flex: 1, marginRight: 8 },
  cancelText: { textAlign: 'center', color: '#555' },
  saveBtn: { padding: 10, borderRadius: 8, backgroundColor: '#007bff', flex: 1 },
  saveText: { textAlign: 'center', color: 'white' },
  editButton: {
    padding: 10,
    backgroundColor: 'blue',
    borderRadius: 5,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    marginHorizontal: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4a90e2',
  },
  inactiveTab: {
    backgroundColor: '#d3d3d3',
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inactiveText: {
    color: 'black',
  },

  section: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  sectionText: {
    fontSize: 16,
  },
});
