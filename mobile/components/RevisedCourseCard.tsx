import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';

interface CourseCardProps {
  course: {
    courseId: string;
    coverIcon?: string;
    title: string;
  };
  onPress: () => void;
  width?: number | `${number}%`;
  progress?: number;
  showCapIcon?: boolean;
}

const RevisedCourseCard: React.FC<CourseCardProps> = ({ course, onPress, width, progress, showCapIcon }) => {
  // Determine which icon to show
  const showCap = showCapIcon && progress === 100;
  return (
    <TouchableOpacity
      style={[styles.card, width !== undefined ? { width } : null]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {course.coverIcon && (
        <Image source={{ uri: course.coverIcon }} style={styles.cardImage} />
      )}
      <View style={styles.cardTopRow}>
        {typeof progress === 'number' && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
        {showCapIcon && (
        <View style={styles.iconWrap}>
          <Text style={showCap ? styles.capIcon : styles.bookIcon}>{showCap ? '🎓' : '📘'}</Text>
        </View>
        )}
      </View>
      <View style={styles.contentWrapper}>
        <Text style={styles.title} numberOfLines={2}>{course.title.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#EFF1F8',
    borderRadius: 12,
    padding: 0,
    paddingTop: 90,
    marginRight: 12,
    marginTop: 14,
    alignItems: 'center',
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 88,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    minHeight: 38,
    justifyContent: 'center',
  },
  cardTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  progressBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4D81D2',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4D81D2',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  capIcon: {
    fontSize: 18,
    color: '#4D81D2',
  },
  bookIcon: {
    fontSize: 18,
    color: '#4D81D2',
  },
  title: {
    fontSize: 10,
    textAlign: 'center',
    color: '#4D81D2',
    marginTop: 4,
    minHeight: 32,
    lineHeight: 16,
    includeFontPadding: false,
  },
});

export default RevisedCourseCard;
