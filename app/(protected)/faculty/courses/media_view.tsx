import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  StyleSheet,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface MediaCompProps {
  videos: any;
  pdfs: any;
  onDelete: (id: string) => void;
}

const MediaTabsComponent: React.FC<MediaCompProps> = ({
  videos = [],
  pdfs = [],
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('videos');

  const tabs = [
    { key: 'videos', title: 'Videos', icon: 'play-circle' },
    { key: 'pdfs', title: 'PDFs', icon: 'file-pdf-o' },
  ];

  const handleLinkPress = (link: string, title: any, type: string) => {
    if (link) {
      Linking.openURL(link).catch((err) => {
        console.error(`Failed to open ${type}:`, err);
      });
    }
  };

  const renderVideoItem = ({ item, index }) => (
    <TouchableOpacity
      key={`video-${index}`}
      onPress={() => handleLinkPress(item.content, item.contentType, 'video')}
      style={styles.mediaItem}
      onLongPress={() => onDelete(item.content_id)}
      accessible
      accessibilityRole="link"
      accessibilityLabel={`Open Video: ${item.contentType}`}
    >
      <View style={styles.mediaContent}>
        <FontAwesome name="play-circle" size={20} color="#007BFF" />
        <View style={styles.mediaTextContainer}>
          <Text style={styles.mediaTitle}>{item.contentType}</Text>
          <Text style={styles.mediaSubtitle}>Tap to play video</Text>
        </View>
        <FontAwesome name="external-link" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderPdfItem = ({ item, index }) => (
    <TouchableOpacity
      key={`pdf-${index}`}
      onPress={() => handleLinkPress(item.content, item.contentType, 'PDF')}
      onLongPress={() => onDelete(item.content_id)}
      style={styles.mediaItem}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Download PDF: ${item.contentType}`}
    >
      <View style={styles.mediaContent}>
        <FontAwesome name="file-pdf-o" size={20} color="#DC3545" />
        <View style={styles.mediaTextContainer}>
          <Text style={styles.mediaTitle}>{item.content}</Text>
          <Text style={styles.mediaSubtitle}>Tap to download</Text>
        </View>
        <FontAwesome name="download" size={16} color="#666" />
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

  const getCurrentData = () => {
    return activeTab === 'videos' ? videos : pdfs;
  };

  const getCurrentCount = () => {
    return getCurrentData().length;
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <FontAwesome
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? '#007BFF' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.title}
            </Text>
            {getCurrentCount() > 0 && activeTab === tab.key && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getCurrentCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
