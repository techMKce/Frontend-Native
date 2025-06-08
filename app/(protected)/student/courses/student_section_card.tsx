import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import api from '@/service/api';
import MediaTabsComponent from './media_view';

// Define Content type if not imported
interface Content {
  content_id: string;
  contentType: 'Video' | 'Pdf';
  content: string;
  [key: string]: any;
}

interface StudentSectionCardProps {
  section_id: number;
  course_id: number;
  title: string;
  desc: string;
  onrefresh: () => void;
  viewOnly: boolean;
}

const StudentSectionCard: React.FC<StudentSectionCardProps> = ({
  section_id,
  course_id,
  title,
  desc,
  onrefresh,
  viewOnly
}) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContentDetails();
  }, []);

  const fetchContentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/course/section/content/details?id=${section_id}`);
      
      // Handle both array and object responses
      const responseData = response.data?.contents || response.data || [];
      
      // Ensure we always have an array and filter out any null/undefined items
      const validContents = Array.isArray(responseData) 
        ? responseData.filter(item => item !== null && item !== undefined)
        : [];
      
      setContents(validContents);
    } catch (error) {
      console.error('Error fetching content details:', error);
      setContents([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      Alert.alert('Notice', message);
    } else {
      Alert.alert('Notice', message);
    }
  };

  // Students can't delete content
  const handleContentAction = () => {
    showToast("You don't have permission to manage content.");
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>
          {desc && <Text style={styles.itemDescription}>{desc}</Text>}
        </View>
      </View>
      
      {/* Loading State or Media Tabs Component */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : contents.length > 0 ? (
        <View style={styles.contentContainer}>
          <MediaTabsComponent
            contents={contents}
            onDelete={undefined} // Remove delete functionality for students entirely
            viewOnly={true} // Add viewOnly prop to control readonly mode in MediaTabsComponent
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome name="folder-open" size={40} color="#ccc" />
          <Text style={styles.emptyText}>No Content Available</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#555',
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
  contentContainer: {
    marginTop: 10,
    paddingBottom: 15,
  },
});

export default StudentSectionCard;
