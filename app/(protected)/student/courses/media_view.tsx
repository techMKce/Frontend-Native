import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  StyleSheet,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Define Content type if not imported elsewhere
interface Content {
  content_id: string;
  content: string;
  document?: string;
  contentType?: string;
  [key: string]: any;
}

interface MediaCompProps {
  contents?: Content[];
  onDelete: (id: string) => void;
}

const MediaTabsComponent: React.FC<MediaCompProps> = ({
  contents = [],
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'pdfs'>('videos');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Strictly separate videos and pdfs based on file extension
  const videos = contents.filter(
    (item) =>
      item.content && /\.(mp4|mov|avi|wmv|webm)$/i.test(item.content)
  );

  const pdfs = contents.filter(
    (item) =>
      item.content && /\.pdf$/i.test(item.content)
  );

  const getCurrentData = () => (activeTab === 'videos' ? videos : pdfs);
  const getCurrentCount = () => getCurrentData().length;

  const handleDownload = async (content: Content) => {
    if (!content.document) {
      if (content.content) {
        Linking.openURL(content.content);
      }
      return;
    }

    try {
      setDownloading(content.content_id);

      const fileUri =
        FileSystem.documentDirectory +
        (content.content?.split('/').pop() || 'document.pdf');

      const downloadResumable = FileSystem.createDownloadResumable(
        content.content || '',
        fileUri
      );

      const { uri } = await downloadResumable.downloadAsync();

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const renderVideoItem = ({ item }: { item: Content }) => (
    <TouchableOpacity
      onPress={() => item.content && Linking.openURL(item.content)}
      onLongPress={() => onDelete(item.content_id)}
      style={styles.mediaItem}
    >
      <View style={styles.mediaContent}>
        <FontAwesome name="play-circle" size={20} color="#007BFF" />
        <View style={styles.mediaTextContainer}>
          <Text style={styles.mediaTitle}>{item.contentType || 'Video'}</Text>
          <Text style={styles.mediaSubtitle}>Tap to play video</Text>
        </View>
        <FontAwesome name="external-link" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderPdfItem = ({ item }: { item: Content }) => (
    <TouchableOpacity
      onPress={() => handleDownload(item)}
      onLongPress={() => onDelete(item.content_id)}
      style={styles.mediaItem}
      disabled={downloading === item.content_id}
    >
      <View style={styles.mediaContent}>
        <FontAwesome
          name={downloading === item.content_id ? 'spinner' : 'file-pdf-o'}
          size={20}
          color="#DC3545"
        />
        <View style={styles.mediaTextContainer}>
          <Text style={styles.mediaTitle}>
            {item.content ? item.content.split('/').pop() : 'PDF Document'}
          </Text>
          <Text style={styles.mediaSubtitle}>
            {downloading === item.content_id ? 'Downloading...' : 'Tap to view'}
          </Text>
        </View>
        <FontAwesome
          name={downloading === item.content_id ? 'spinner' : 'download'}
          size={16}
          color="#666"
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <FontAwesome
        name={type === 'videos' ? 'video-camera' : 'file-pdf-o'}
        size={50}
        color="#ccc"
      />
      <Text style={styles.emptyStateText}>
        No {type === 'videos' ? 'Videos' : 'PDFs'} Found
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {type === 'videos'
          ? 'Add some videos to get started'
          : 'Add some PDF documents to get started'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
          onPress={() => setActiveTab('videos')}
        >
          <FontAwesome
            name="play-circle"
            size={18}
            color={activeTab === 'videos' ? '#007BFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'videos' && styles.activeTabText,
            ]}
          >
            Videos
          </Text>
          {activeTab === 'videos' && getCurrentCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getCurrentCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pdfs' && styles.activeTab]}
          onPress={() => setActiveTab('pdfs')}
        >
          <FontAwesome
            name="file-pdf-o"
            size={18}
            color={activeTab === 'pdfs' ? '#007BFF' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'pdfs' && styles.activeTabText,
            ]}
          >
            PDFs
          </Text>
          {activeTab === 'pdfs' && getCurrentCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getCurrentCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {getCurrentCount() === 0 ? (
          renderEmptyState(activeTab)
        ) : (
          <FlatList
            data={getCurrentData()}
            keyExtractor={(item, index) => `${activeTab}-${index}`}
            renderItem={
              activeTab === 'videos' ? renderVideoItem : renderPdfItem
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    margin: 10,
  },
  listContent: {
    paddingVertical: 8,
  },
  mediaItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  mediaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaTextContainer: {
    flex: 1,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mediaSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default MediaTabsComponent;