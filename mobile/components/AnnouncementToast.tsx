/**
 * Announcement Toast Component - iOS Style for Mobile
 * 
 * Beautiful announcement banner with iOS-inspired design for React Native
 * Features:
 * - Animated slide-down entrance
 * - Smooth progress indicator
 * - Action buttons
 * - Auto-dismiss timer
 * - Safe area aware
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

interface Announcement {
  id: string;
  title: string;
  body: string;
  segment: string;
  publishAt: string;
  validUntil?: string | null;
  createdById: string;
}

interface AnnouncementToastProps {
  announcement: Announcement;
  onDismiss: (announcementId: string) => void;
  onAction?: (announcementId: string, action: string) => void;
  autoHideDuration?: number; // milliseconds, 0 = no auto-hide
}

const { height: screenHeight } = Dimensions.get('window');

export const AnnouncementToast: React.FC<AnnouncementToastProps> = ({
  announcement,
  onDismiss,
  onAction,
  autoHideDuration = 8000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(1);
  const slideAnim = useMemo(() => new Animated.Value(-screenHeight), []);

  const handleDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onDismiss(announcement.id);
    });
  }, [slideAnim, onDismiss, announcement.id]);

  useEffect(() => {
    // Animate in
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    if (autoHideDuration <= 0 || !isVisible) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1 - elapsed / autoHideDuration);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoHideDuration, isVisible, handleDismiss]);

  const handleAction = (action: string) => {
    onAction?.(announcement.id, action);
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#3B82F6', '#1E40AF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.body} numberOfLines={3}>
            {announcement.body}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleAction('learn-more')}
          >
            <Text style={styles.primaryButtonText}>Learn More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleDismiss}
          >
            <Text style={styles.secondaryButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        {autoHideDuration > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

// All styles are defined in allStyles constant at the bottom of the file

/**
 * Announcements Modal - iOS Style for Mobile
 */

interface AnnouncementsCenterProps {
  announcements: Announcement[];
  isOpen: boolean;
  onClose: () => void;
  onDismiss: (announcementId: string) => void;
}

export const AnnouncementsCenter: React.FC<AnnouncementsCenterProps> = ({
  announcements,
  isOpen,
  onClose,
  onDismiss,
}) => {
  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1E40AF', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Announcements</Text>
              <Text style={styles.headerSubtitle}>
                {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.headerCloseIcon}>×</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Announcements List */}
        <ScrollView style={styles.listContainer}>
          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📢</Text>
              <Text style={styles.emptyStateText}>No announcements yet</Text>
            </View>
          ) : (
            announcements.map((announcement, index) => (
              <View key={announcement.id}>
                <View style={styles.announcementItem}>
                  <View style={styles.announcementBorder} />
                  <View style={styles.announcementContent}>
                    <Text style={styles.announcementTitle}>
                      {announcement.title}
                    </Text>
                    <Text style={styles.announcementBody} numberOfLines={3}>
                      {announcement.body}
                    </Text>
                    <View style={styles.announcementFooter}>
                      <Text style={styles.announcementDate}>
                        {new Date(announcement.publishAt).toLocaleDateString()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onDismiss(announcement.id)}
                        style={styles.dismissButton}
                      >
                        <Text style={styles.dismissButtonText}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {index < announcements.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.footerButton}
          >
            <Text style={styles.footerButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const allStyles = StyleSheet.create({
  // Toast container styles
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  content: {
    marginRight: 40,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerCloseIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  announcementItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  announcementBorder: {
    width: 4,
    backgroundColor: '#3B82F6',
    marginRight: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  announcementBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  dismissButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Export unified styles for use throughout component
export const styles = allStyles;