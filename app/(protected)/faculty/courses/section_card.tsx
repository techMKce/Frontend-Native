import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ToastAndroid,
  Alert,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import api from '@/service/api';
import MediaTabsComponent from './media_view';
import * as Haptics from 'expo-haptics';

type Content = {
  content_id: string;
  contentType: string;
  content: string;
};

interface SectionCardProps {
  id: number;
  title: string;
  desc: string;
  courseId: number;
  onrefresh: () => void;
  // onDelete: (sectionId: number) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  id,
  title,
  desc,
  courseId,
  onrefresh,
}) => {
  const [showAddContentForm, setShowAddContentForm] = useState(false);
  const [isUpdate, setUpdate] = useState(false);
  const [contents, setContents] = useState<Content[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [titleSec, setTitle] = useState(title);
  const [scription, setScript] = useState(desc);

  useEffect(() => {
    fetchCourseDetails();
  }, []);

  const fetchCourseDetails = async () => {
    try {
      const response = await api.get(
        `/course/section/content/details?id=${id}`
      );
      console.log(id);
      console.log('<><><>M<><', response.data);
      setContents(response.data);
    } catch (error) {
      console.log('Error fetching content details:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (content_id: number) => {
    try {
      setLoading(true);

      const response = await api.delete('/course/section/content/delete', {
        data: JSON.stringify(content_id), // ✅ Send raw ID
        headers: {
          'Content-Type': 'application/json', // ✅ Required
        },
      });

      if (response.status === 200) {
        await fetchCourseDetails();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('✅ Content deleted successfully!', 'Success');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to delete content', 'Error');
      console.log(error);
    } finally {
      setLoading(false);
      onrefresh(); // Call the refresh function passed as a prop
    }
  };

  const addContent = async (
    contentType: string,
    content: string,
    section_id: number
  ) => {
    try {
      setLoading(true);
      const requestBody = {
        contentType,
        content,
        section: { section_id },
      };
      console.log('Request Body:', requestBody);
      const response = await api.post(
        '/course/section/content/add',
        requestBody
      );
      if (response.status === 200 || response.status === 201) {
        await fetchCourseDetails();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('✅ Content added successfully!', 'Success');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to add content', 'Error');
      console.log(error);
    } finally {
      setPdfUrl('');
      setVideoUrl('');
      setLoading(false);
    }
  };

  const deleteSection = async (section_id: number) => {
    try {
      setLoading(true);
      const response = await api.delete('/course/section/delete', {
        data: JSON.stringify(section_id), // ✅ send raw number as stringified body
        headers: {
          'Content-Type': 'application/json', // ✅ ensure content-type is correct
        },
      });
      if (response.status === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('✅ Section deleted successfully!', 'Success');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to delete section', 'Error');
      console.log(error);
    } finally {
      setLoading(false);
      onrefresh(); // Call the refresh function passed as a prop
    }
  };

  const updateSection = async () => {
    try {
      setLoading(true);
      const requestBody = {
        section_id: id,
        sectionTitle: titleSec,
        sectionDesc: scription,
        course: { course_id: courseId },
      };
      const response = await api.put('/course/section/update', requestBody);
      if (response.status >= 200 && response.status < 300) {
        await fetchCourseDetails();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('✅ Section updated successfully!', 'Success');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to update section', 'Error');
      console.log(error);
    } finally {
      setLoading(false);
      setUpdate(false);
      onrefresh(); // Call the refresh function passed as a prop
    }
  };

  const showToast = (message: string, title: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert(title, message);
    }
  };

  const filterContentByType = (
    contents: Content[],
    isVideo: boolean
  ): Content[] => {
    return contents.filter((item) =>
      isVideo ? item.contentType === 'Video' : item.contentType !== 'Video'
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text onPress={() => setUpdate(true)} style={styles.sectionTitle}>
            {title} 📝
          </Text>
          {desc && <Text style={styles.itemDescription}>{desc}</Text>}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => {
              setShowAddContentForm(true);
            }}
            disabled={loading} // Disable when loading
            style={{
              borderWidth: 2,
              borderColor: loading ? '#ccc' : '#007BFF',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: loading ? '#f5f5f5' : '#F8F9FF',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <FontAwesome
              name="plus-circle"
              color={loading ? '#ccc' : '#007BFF'}
              size={16}
            />
          </TouchableOpacity>
          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => {
              deleteSection(id);
            }}
            disabled={loading} // Disable when loading
            style={{
              borderColor: loading ? '#ccc' : '#DC3545',
              borderWidth: 2,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: loading ? '#f5f5f5' : '#FFF5F5',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <FontAwesome
              name="trash"
              color={loading ? '#ccc' : '#DC3545'}
              size={16}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Loading State or Media Tabs Component */}
      {loading ? (
        <View
          style={{
            height: 120,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e9ecef',
          }}
        >
          <ActivityIndicator size="large" color="#007BFF" />
          <Text
            style={{
              marginTop: 12,
              color: '#666',
              fontSize: 16,
              fontWeight: '500',
            }}
          >
            Loading content...
          </Text>
        </View>
      ) : contents.length > 0 ? (
        <View style={{ minHeight: 300 }}>
          <MediaTabsComponent
            onDelete={(cntid) => deleteContent(Number(cntid))}
            videos={filterContentByType(contents, true)}
            pdfs={filterContentByType(contents, false)}
          />
        </View>
      ) : (
        <View
          style={{
            height: 120,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e9ecef',
            borderStyle: 'dashed',
          }}
        >
          <FontAwesome name="folder-open" size={40} color="#ccc" />
          <Text
            style={{
              marginTop: 8,
              color: '#666',
              fontSize: 16,
              fontWeight: '500',
            }}
          >
            No Content Added
          </Text>
          <Text
            style={{
              color: '#999',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Add videos or PDFs to get started
          </Text>
        </View>
      )}
      {showAddContentForm && (
        <View
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: '#f9f9f9',
            borderRadius: 5,
          }}
        >
          {/* Video Form */}
          <Text>Video</Text>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
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
                  addContent('Video', videoUrl, id);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* PDF Form */}
          <Text>Pdf</Text>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
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
                // value={{}}
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
                  addContent('Pdf', pdfUrl, id);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: '#007BFF',
                paddingVertical: 8,
                paddingHorizontal: 15,
                borderRadius: 5,
                alignItems: 'center',
              }}
              onPress={() => {
                setShowAddContentForm(false);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Fininsh Adding
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isUpdate && (
        <View style={styles.updateForm}>
          <TextInput
            value={titleSec}
            onChangeText={setTitle}
            placeholder="Title"
            style={styles.input}
          />
          <TextInput
            value={scription}
            onChangeText={setScript}
            placeholder="Description"
            style={styles.input}
          />
          <TouchableOpacity onPress={updateSection} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Update Section</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    height: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#555',
  },
  iconButton: {
    borderWidth: 2,
    borderColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FF',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 8,
    color: '#888',
    fontSize: 14,
  },
  updateForm: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SectionCard;
