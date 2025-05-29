import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONT, SIZES, SPACING, SHADOWS } from '@/constants/theme';
import { File, Upload, X } from 'lucide-react-native';

export type FileInfo = {
  uri: string;
  name: string;
  size?: number;
  type?: string;
  id?: string;
};

type FileUploaderProps = {
  onFilesSelected: (files: FileInfo[]) => void;
  files: FileInfo[];
};

const FileUploader = ({ onFilesSelected, files }: FileUploaderProps) => {
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(file => ({
          uri: file.uri,
          name: file.name || 'Unknown file',
          size: file.size,
          type: file.mimeType,
          id: Math.random().toString(36).substring(7)
        }));
        
        onFilesSelected([...files, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };
  
  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    onFilesSelected(updatedFiles);
  };
  
  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const renderFileItem = ({ item }: { item: FileInfo }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileIcon}>
        <File size={24} color={COLORS.primary} />
      </View>
      
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.fileSize}>
          {formatFileSize(item.size)}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFile(item.id || '')}
      >
        <X size={16} color={COLORS.gray} />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={pickDocument}
      >
        <Upload size={24} color={COLORS.primary} />
        <Text style={styles.uploadText}>Upload Assignment Files</Text>
      </TouchableOpacity>
      
      {files.length > 0 && (
        <View style={styles.filesContainer}>
          <FlatList
            data={files}
            renderItem={renderFileItem}
            keyExtractor={(item) => item.id || item.uri}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  uploadText: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.primary,
  },
  filesContainer: {
    marginTop: SPACING.md,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  fileIcon: {
    width: 40,
    height: 40,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  fileName: {
    fontFamily: FONT.medium,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  fileSize: {
    fontFamily: FONT.regular,
    fontSize: SIZES.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  separator: {
    height: SPACING.sm,
  },
});

export default FileUploader;