import { StyleSheet, Text, TextInput, View, ImageBackground, ScrollView, TouchableOpacity, Modal } from 'react-native'
import React, {useState} from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AlignJustify, Clock, FileText, Pencil, Plus } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import * as DocumentPicker from 'expo-document-picker';



const coursedetails = () => {

const [showSheet, setShowSheet] = useState(false);
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [links, setLinks] = useState<string[]>([]);
const [currentLink, setCurrentLink] = useState('');
const [pdfs, setPdfs] = useState<string[]>([]);

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
  const updated = [...links];
  updated.splice(index, 1);
  setLinks(updated);
};

const removePDF = (index: number) => {
  const updated = [...pdfs];
  updated.splice(index, 1);
  setPdfs(updated);
};



  return (
    <SafeAreaView style={{ flex: 1 }}>
  <ScrollView style={{ flex: 1 }}>
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/2683360/pexels-photo-2683360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
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
  {/* Title and Edit button */}
  <View style={styles.headerRow}>
    <Text style={styles.sectionTitle}>Description</Text>
    <TouchableOpacity onPress={() => {/* handle edit */}} style={styles.editButton}>
      <Text style={{ color: '#007bff' }}>Edit</Text>
    </TouchableOpacity>
  </View>

  {/* Description paragraph */}
  <Text style={[styles.paragraph,]}>
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
  </Text>

  {/* Row: PDF icon with label, Add Section, Create Assignment */}
  <View style={styles.footerRow}>
    <View style={styles.syllabusBox}>
      <FileText size={18} color="#888" />
      <Text style={styles.syllabusText}>Syllabus</Text>
    </View>

    <View style={styles.actionButtons}>
      <TouchableOpacity
  style={[styles.actionBtn, { backgroundColor: '#eee' }]}
  onPress={() => setShowSheet(true)}
>
    <Text style={[styles.actionText, { color: '#333', marginLeft: 0 }]}>Add Content</Text>
    </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eee' }]}>
        <Text style={[styles.actionText, { color: '#333', marginLeft: 0 }]}> content</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#eee' }]}>
        <Text style={[styles.actionText, { color: '#333', marginLeft: 0 }]}> Assignment</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

<View>
    <LottieView
      source={require('../../assets/animations/empty1.json')}
      autoPlay
      loop
      style={{ width: '70%', height: 200, alignSelf: 'center', marginTop: 50 }}
      />
      <Text style={{alignSelf: 'center', marginTop: -30}}>No Content to show, Create one...</Text>
</View>
  </ScrollView>

  <Modal
  visible={showSheet}
  onRequestClose={() => setShowSheet(false)}
  transparent
  animationType="slide"
>

  <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
    <View style={{
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '90%', // or a specific height like 400
    }}>
    <ScrollView>
      <Text style={styles.sectionTitle}>Add New Content</Text>

      <Text style={{ marginTop: 10 }}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

      <Text style={{ marginTop: 10 }}>Description</Text>
      <TextInput style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 8,height: 200, textAlign: 'left'}} multiline value={description} onChangeText={setDescription} placeholder="Enter description" />

      <Text style={{ marginTop: 10 }}>Add Link</Text>
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
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text style={{ flex: 1 }}>{link}</Text>
          <TouchableOpacity onPress={() => removeLink(index)}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={{ marginTop: 10 }}>Upload PDFs</Text>
      <TouchableOpacity onPress={pickPDF} style={styles.uploadBox}>
        <Text style={{ color: '#555' }}>Tap to upload PDF</Text>
      </TouchableOpacity>

      {pdfs.map((pdf, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text style={{ flex: 1 }}>{pdf}</Text>
          <TouchableOpacity onPress={() => removePDF(index)}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
      <TouchableOpacity
      style={{
      flex: 1,
      backgroundColor: '#eee',
      paddingVertical: 14,
      borderRadius: 10,
      marginRight: 8,
      alignItems: 'center', 
    }}
    onPress={() => setShowSheet(false)}
    >
    <Text style={{ color: '#333', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
  </TouchableOpacity>

        <TouchableOpacity
    style={{
      flex: 1,
      backgroundColor: '#007bff',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginRight: 8,
    }}
    onPress={() => setShowSheet(false)}
  >
    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Save</Text>
  </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  </View>
</Modal>


</SafeAreaView>
  )
}

export default coursedetails

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 12,
  },

  image: {
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: 8,
    overflow: 'hidden',
  },

  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },

  courseName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  facultyName: {
    color: 'white',
    fontSize: 14,
    marginRight: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  iconLabel: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },

  contentBox: {
    backgroundColor: '#f8f8f8',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  editButton: {
    padding: 6,
  },

  paragraph: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
  },

  syllabusBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  syllabusText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },

  actionText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 4,
  },

//   inputBox: {
//   borderWidth: 1,
//   borderColor: '#ccc',
//   borderRadius: 8,
//   paddingHorizontal: 12,
//   paddingVertical: 10,
//   fontSize: 14,
//   backgroundColor: '#f9f9f9',
//   marginBottom: 10
// },

// modalOverlay: {
//   flex: 1,
//   backgroundColor: 'rgba(0,0,0,0.4)',
//   justifyContent: 'center',
//   alignItems: 'center',
//   padding: 16,
// },

// modalContent: {
//   backgroundColor: '#fff',
//   padding: 20,
//   borderRadius: 12,
//   width: '100%',
//   maxHeight: '90%',
//   shadowColor: '#000',
//   shadowOpacity: 0.1,
//   shadowOffset: { width: 0, height: 2 },
//   shadowRadius: 4,
//   elevation: 5,
// },

// modalLabel: {
//   fontSize: 14,
//   fontWeight: '600',
//   marginBottom: 4,
//   color: '#333',
// },

// inputBox: {
//   borderWidth: 1,
//   borderColor: '#ccc',
//   borderRadius: 8,
//   paddingHorizontal: 12,
//   paddingVertical: 10,
//   fontSize: 14,
//   backgroundColor: '#f9f9f9',
//   marginBottom: 10,
// },

// linkItem: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'space-between',
//   paddingVertical: 8,
//   borderBottomWidth: 1,
//   borderColor: '#eee',
// },

// deleteIcon: {
//   color: '#ff4d4d',
//   fontSize: 16,
//   marginLeft: 10,
// },

// uploadBox: {
//   borderWidth: 1,
//   borderColor: '#ccc',
//   borderStyle: 'dashed',
//   borderRadius: 8,
//   padding: 12,
//   alignItems: 'center',
//   justifyContent: 'center',
//   marginBottom: 12,
//   backgroundColor: '#f1f1f1',
// },

// modalFooter: {
//   flexDirection: 'row',
//   justifyContent: 'flex-end',
//   marginTop: 20,
//   gap: 10,
// },

// modalButton: {
//   paddingVertical: 10,
//   paddingHorizontal: 16,
//   borderRadius: 6,
// },

input: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 10,
  borderRadius: 6,
  marginTop: 4,
},

uploadBox: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  padding: 20,
  alignItems: 'center',
  marginTop: 10,
  height: 70,
},


});