import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {  Menu } from 'lucide-react-native';
import { ICourse } from '@/types';
import { CourseDrawer } from './CourseDrawer';

interface CourseHeaderProps {
  course: ICourse;
  currentPage: string;
}

export function CourseHeader({ course, currentPage }: CourseHeaderProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <View style={styles.header}>
        

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
          activeOpacity={0.7}
        >
          <Menu size={24} color="#3363AD" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {course.title}
          </Text>
          {/* <Text style={styles.pageIndicator}>{currentPage}</Text> */}
        </View>
      </View>

      <CourseDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        course={course}
        currentPage={currentPage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3363AD',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
});