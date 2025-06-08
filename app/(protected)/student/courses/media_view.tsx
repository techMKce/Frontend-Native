import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import api from '../../../../service/api';
// import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';

import * as IntentLauncher from 'expo-intent-launcher';

interface Content {
  content_id: string;
  content: string;
  document?: string;
  contentType?: string;
  id?: string;
  [key: string]: any;
}

interface MediaCompProps {
  contents?: Content[];
  onDelete?: (id: string) => void;
  viewOnly?: boolean;
}

const MediaTabsComponent: React.FC<MediaCompProps> = ({
  contents = [],
  onDelete,
  viewOnly = true,  // Default to viewOnly for students
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'pdfs'>('videos');
  const [downloading, setDownloading] = useState<string | null>(null);

  const videos = contents.filter((c) => c.content !== null);
  const pdfs = contents.filter((c) => c.content === null);

  const getCurrentData = () => (activeTab === 'videos' ? videos : pdfs);
  const getCurrentCount = () => getCurrentData().length;



const handleDownload = async (content: Content) => {
  if (!content.id) {
    Alert.alert('Error', 'Invalid content ID');
    return;
  }

  try {
    setDownloading(content.id);

    const fileName =
      content.content?.split('/').pop() || `document_${content.id}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // Check if file already exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists && fileInfo.size > 0) {
      // File exists, ask user what to do
      Alert.alert('PDF Ready', 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View',
          onPress: () => openPdf(fileUri, false),
        },
        {
          text: 'Save & Share',
          onPress: () => saveAndSharePdf(fileUri),
        },
      ]);
      return;
    }

    // Fetch from server
    const response = await api.get(
      `/course/section/content/download/${content.id}`,
      {
        responseType: 'blob',
      }
    );

    const contentType = response.headers['content-type'] || 'application/pdf';
    let base64Data;

    if (contentType.includes('text') || contentType.includes('json')) {
      const textData =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      if (textData.startsWith('data:')) {
        base64Data = textData.split(',')[1];
      } else if (/^[A-Za-z0-9+/=]+$/.test(textData.trim())) {
        base64Data = textData.trim();
      } else {
        throw new Error('Invalid data format received from server');
      }
    } else {
      base64Data = await blobToBase64(response.data);
    }

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const newFileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!newFileInfo.exists || newFileInfo.size === 0) {
      throw new Error('File was not created properly');
    }

    Alert.alert('PDF Downloaded', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'View',
        onPress: () => openPdf(fileUri, false),
      },
      {
        text: 'Save & Share',
        onPress: () => saveAndSharePdf(fileUri),
      },
    ]);
  } catch (error) {
    console.error('Download failed:', error);
    Alert.alert(
      'Error',
      'Failed to download file. Please check your internet connection and try again.'
    );
  } finally {
    setDownloading(null);
  }
};


  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (data:application/pdf;base64,)
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const openPdf = async (fileUri: string, permanent: boolean = false) => {
    try {
      if (Platform.OS === 'ios') {
        // iOS can handle PDFs natively
        const canOpen = await Linking.canOpenURL(fileUri);
        if (canOpen) {
          await Linking.openURL(fileUri);
        } else {
          // Fallback to WebBrowser
          await WebBrowser.openBrowserAsync(fileUri, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            showTitle: true,
            toolbarColor: '#007BFF',
            controlsColor: '#fff',
            enableBarCollapsing: true,
          });
        }
      } else {
        // On Android, try to use the intent system
        try {
          // First try WebBrowser which doesn't permanently store the file
          await WebBrowser.openBrowserAsync(fileUri);
        } catch (error) {
          // Fallback to intent system
          const cUri = await FileSystem.getContentUriAsync(fileUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: cUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          });
        }
      }
      
      // If the file is not meant to be permanent, clean it up after a delay
      if (!permanent) {
        // Give user time to view the file before cleaning up
        setTimeout(async () => {
          try {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists && !permanent) {
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
              console.log('Temporary file cleaned up:', fileUri);
            }
          } catch (cleanupError) {
            console.log('Failed to clean up temporary file:', cleanupError);
          }
        }, 300000); // Clean up after 5 minutes
      }
    } catch (error) {
      console.error('Failed to open PDF:', error);

      // Fallback: try to share the file instead
      Alert.alert(
        'Cannot Open PDF',
        'Unable to open PDF directly. Would you like to save and share it with another app?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save & Share', onPress: () => saveAndSharePdf(fileUri) },
        ]
      );
    }
  };

  const saveAndSharePdf = async (fileUri: string) => {
    try {
      // Save to media library first
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Download');
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      }
      
      // Then share
      await sharePdf(fileUri);
      Alert.alert('Success', 'PDF has been saved to your downloads folder');
    } catch (error) {
      console.error('Failed to save PDF:', error);
      Alert.alert('Error', 'Failed to save PDF to downloads');
      
      // Try sharing anyway
      sharePdf(fileUri);
    }
  };

  const sharePdf = async (fileUri: string) => {
    try {
      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Share PDF',
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share PDF');
    }
  };

  const renderVideoItem = ({ item }: { item: Content }) => (
    <TouchableOpacity
      onPress={() => {
        if (item.content) {
          Linking.openURL(item.content).catch(() => {
            Alert.alert('Error', 'Cannot open video link');
          });
        }
      }}
      // Remove onLongPress to prevent delete action
      style={styles.mediaItem}
      activeOpacity={0.7}
    >
      <View style={styles.mediaContent}>
        <View style={styles.iconContainer}>
          <FontAwesome name="play-circle" size={28} color="#007BFF" />
        </View>
        <View style={styles.mediaTextContainer}>
          <Text style={styles.mediaTitle} numberOfLines={2}>
            {item.contentType || 'Video Content'}
          </Text>
          <Text style={styles.mediaSubtitle}>Tap to play video</Text>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (item.content) {
              Linking.openURL(item.content).catch(() => {
                Alert.alert('Error', 'Cannot open video link');
              });
            }
          }}
        >
          <FontAwesome name="external-link" size={18} color="#007BFF" />
        </TouchableOpacity>
        {/* Remove delete button */}
      </View>
    </TouchableOpacity>
  );

  const renderPdfItem = ({ item }: { item: Content }) => (
    <TouchableOpacity
      onPress={() => handleDownload(item)}
      // Remove onLongPress to prevent delete action
      style={[
        styles.mediaItem,
        downloading === item.id && styles.mediaItemDownloading,
      ]}
      disabled={downloading === item.id}
      activeOpacity={0.7}
    >
      <View style={styles.mediaContent}>
        <View style={styles.iconContainer}>
          <FontAwesome
            name={downloading === item.id ? 'spinner' : 'file-pdf-o'}
            size={28}
            color="#DC3545"
          />
        </View>
        <View style={styles.mediaTextContainer}>
          <Text style={styles.mediaTitle} numberOfLines={2}>
            {item.document || item.contentType || 'PDF Document'}
          </Text>
          <Text style={styles.mediaSubtitle}>
            {downloading === item.id
              ? 'Downloading...'
              : 'Tap to download & view'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDownload(item)}
          disabled={downloading === item.id}
        >
          <FontAwesome
            name={downloading === item.id ? 'clock-o' : 'download'}
            size={18}
            color={downloading === item.id ? '#999' : '#28A745'}
          />
        </TouchableOpacity>
        {/* Remove delete button */}
      </View>
      {downloading === item.id && (
        <View style={styles.progressBar}>
          <View style={styles.progressIndicator} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <FontAwesome
        name={type === 'videos' ? 'video-camera' : 'file-pdf-o'}
        size={60}
        color="#E9ECEF"
      />
      <Text style={styles.emptyStateText}>
        No {type === 'videos' ? 'Videos' : 'PDFs'} Available
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {type === 'videos'
          ? 'Video content will appear here'
          : 'PDF documents will appear here'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
          onPress={() => setActiveTab('videos')}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="play-circle"
            size={20}
            color={activeTab === 'videos' ? '#007BFF' : '#6C757D'}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'videos' && styles.activeTabText,
            ]}
          >
            Videos
          </Text>
          {videos.length > 0 && (
            <View style={[styles.badge, activeTab === 'videos' && styles.activeBadge]}>
              <Text style={styles.badgeText}>{videos.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pdfs' && styles.activeTab]}
          onPress={() => setActiveTab('pdfs')}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="file-pdf-o"
            size={20}
            color={activeTab === 'pdfs' ? '#007BFF' : '#6C757D'}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'pdfs' && styles.activeTabText,
            ]}
          >
            PDFs
          </Text>
          {pdfs.length > 0 && (
            <View style={[styles.badge, activeTab === 'pdfs' && styles.activeBadge]}>
              <Text style={styles.badgeText}>{pdfs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {getCurrentCount() === 0 ? (
          renderEmptyState(activeTab)
        ) : (
          <FlatList
            data={getCurrentData()}
            keyExtractor={(item, index) =>
              `${activeTab}-${item.content_id || item.id || index}`
            }
            renderItem={
              activeTab === 'videos' ? renderVideoItem : renderPdfItem
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#E6F2FF',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C757D',
  },
  activeTabText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#6C757D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  activeBadge: {
    backgroundColor: '#007BFF',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  mediaItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  mediaItemDownloading: {
    borderLeftColor: '#007BFF',
    borderLeftWidth: 4,
  },
  mediaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mediaTextContainer: {
    flex: 1,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  mediaSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343A40',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressIndicator: {
    width: '30%', // This would be dynamic in a real implementation
    height: '100%',
    backgroundColor: '#007BFF',
    borderRadius: 2,
  },
});

export default MediaTabsComponent;
