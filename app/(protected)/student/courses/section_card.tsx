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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import FileUploader from '@/components/FileUploader'; // <-- adjust path as needed

// Define Content type if not imported
interface Content {
  content_id: string;
  contentType: 'Video' | 'Pdf';
  content: string;
  [key: string]: any;
}

interface SectionCardProps {
  section_id: number;          // Change from number to string
  course_id: number;    // Change from number to string
  title: string;
  desc: string;
  onrefresh: () => void;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section_id,   // Now matches backend
  course_id,    // Now matches backend
  title,
  desc,
  onrefresh
}) => {
  const [showAddContentForm, setShowAddContentForm] = useState(false);
  const [isUpdate, setUpdate] = useState(false);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [contentType, setContentType] = useState<'Video' | 'Pdf'>('Video');
  const [loading, setLoading] = useState(true);
  const [titleSec, setTitle] = useState(title);
  const [scription, setScript] = useState(desc);

  type FileInfo = {
    uri: string;
    name: string;
    type?: string;
  };
  const [documentFile, setDocumentFile] = useState<FileInfo | null>(null);

  useEffect(() => {
    fetchContentDetails();

  }, []);

  const fetchContentDetails = async () => {
  try {
    setLoading(true);
    // Make sure to include the section ID in the request

    const response = await api.get(`/course/section/content/details?id=${section_id}`);

    
    // Handle both array and object responses
    const responseData = response.data?.contents || response.data || [];
    
    // Ensure we always have an array and filter out any null/undefined items
    const validContents = Array.isArray(responseData) 
      ? responseData.filter(item => item !== null && item !== undefined)
      : [];
    
    setContents(validContents);

    console.log('Fetched contents:', validContents);
  } catch (error) {
    console.error('Error fetching content details:', error);
    showToast('Failed to load section contents', 'Error');
    setContents([]); // Reset to empty array on error
  } finally {
    setLoading(false);
  }
};

  const deleteContent = async (content_id: number) => {
  try {
    await api.delete('/course/section/content/delete', {
      data: content_id.toString() // Send as string
    });
      await fetchContentDetails();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('✅ Content deleted successfully!', 'Success');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to delete content', 'Error');
      console.log(error);
    } finally {
      setLoading(false);
      onrefresh();
    }
  };

  const addContent = async () => {
  try {
    setLoading(true);

    const formData = new FormData();
    formData.append('sectionId', section_id.toString());

    if (contentType === 'Video') {
      formData.append('contentUrl', contentUrl);
    } else if (documentFile) {
      formData.append('file', {
        uri: documentFile.uri,
        name: documentFile.name,
        type: documentFile.type || 'application/pdf',
      } as any);
    }
    

      const response = await api.post(
      '/course/section/content/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

      if (response.status === 200 || response.status === 201) {
        await fetchContentDetails();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('✅ Content added successfully!', 'Success');
        setShowAddContentForm(false);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to add content', 'Error');
      console.log(error);
    } finally {
      setLoading(false);
      setContentUrl('');
      setDocumentFile(null);
    }
  };

  const deleteSection = async (section_id: string) => {
    try {
      const response = await api.delete('/course/section/delete', {
        data: section_id // Already a string
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
      onrefresh();
    }
  };

  const updateSection = async () => {
  try {
    const requestBody = {
      section_id: section_id.toString(), // Ensure section_id is a string
      sectionTitle: titleSec,
      sectionDesc: scription,
      // Remove course object if not needed by backend
    };
      const response = await api.put('/course/section/update', requestBody);
      if (response.status >= 200 && response.status < 300) {
        // await fetchCourseDetails(); // <-- Remove this, not defined
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('✅ Section updated successfully!', 'Success');
        onrefresh(); // <-- Ensure refresh after update
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('❌ Failed to update section', 'Error');
      console.log(error);
    } finally {
      setLoading(false);
      setUpdate(false);
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
            {titleSec} 📝
          </Text>
          {scription && <Text style={styles.itemDescription}>{scription}</Text>}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => {
              setShowAddContentForm(true);
            }}
            disabled={loading}
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
              deleteSection(section_id);
            }}
            disabled={loading}
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : contents.length > 0 ? (
        <View style={{ minHeight: 300 }}>
          <MediaTabsComponent
            contents={contents}
            onDelete={(cntid) => deleteContent(Number(cntid))}
        />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome name="folder-open" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No Content Added</Text>
          <Text style={{ color: '#999', fontSize: 14, marginTop: 4 }}>
            Add videos or PDFs to get started
          </Text>
        </View>
      )}
      {showAddContentForm && (
        <View style={styles.addContentForm}>
          <View style={styles.contentTypeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                contentType === 'Video' && styles.activeTypeButton,
              ]}
              onPress={() => setContentType('Video')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  contentType === 'Video' && styles.activeTypeButtonText,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                contentType === 'Pdf' && styles.activeTypeButton,
              ]}
              onPress={() => setContentType('Pdf')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  contentType === 'Pdf' && styles.activeTypeButtonText,
                ]}
              >
                PDF
              </Text>
            </TouchableOpacity>
          </View>

          {contentType === 'Video' ? (
            <>
              <Text>Video URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter video URL"
                value={contentUrl}
                onChangeText={setContentUrl}
              />
            </>
          ) : (
            <>
              <Text>PDF Document</Text>
              <FileUploader
                files={documentFile ? [documentFile] : []}
                onFilesSelected={(files) => setDocumentFile(files[0])}
              />
            </>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddContentForm(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={addContent}
              disabled={loading || (contentType === 'Video' ? !contentUrl : !documentFile)}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Adding...' : 'Add Content'}
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
  addContentForm: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  contentTypeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#007BFF',
  },
  typeButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#6c757d',
  },
  submitButton: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default SectionCard;
