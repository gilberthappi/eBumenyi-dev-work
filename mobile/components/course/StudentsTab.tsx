import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Image } from 'react-native';
import { Phone } from 'lucide-react-native';
import { getStudentsByCourse } from '@/services/course.api';
import { IStudentByCourseItem } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Props {
  courseId?: string;
}

export default function StudentsTab({ courseId }: Props) {
  const [students, setStudents] = useState<IStudentByCourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!courseId) return;
      setLoading(true);
      try {
        const resp = await getStudentsByCourse(courseId);
        const data = Array.isArray(resp?.data) ? resp.data : [];
        setStudents(data);
      } catch (e) {
        console.log('Failed to fetch students for course', courseId, e);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ padding: 16, paddingTop: 10, flex: 1 }}>
      {students.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#3363AD', textAlign: 'center', marginBottom: 12 }}>
            Nta banyeshuri
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
            Nta banyeshuri biyandikishije kuri iri somo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.studentId}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {item.avatar ? (
                  <Image
                    source={{ uri: item.avatar }}
                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#E8EEF9' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#3363AD', fontWeight: '700' }}>{(item.fullNames || 'U')[0]}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#3363AD' }}>{item.fullNames}</Text>
                  {/* <Text style={{ fontSize: 10, color: '#6B7280' }}>{item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : ''}</Text> */}
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>
                    {(item.district ?? '') + (item.district && item.sector ? ' / ' : '') + (item.sector ?? '')}
                  </Text>
                </View>

              <View style={{ alignItems: 'flex-end' }}>
                {/* phone call button */}
                <TouchableOpacity
                  onPress={() => {
                    const phone = item.phoneNumber?.trim();
                    if (!phone) {
                      console.log('No phone number for', item.fullNames);
                      return;
                    }
                    const url = `tel:${phone}`;
                    Linking.openURL(url).catch(err => console.log('Failed to open dialer', err));
                  }}
                  disabled={!item.phoneNumber}
                  style={{ backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Phone color={item.phoneNumber ? '#3363AD' : '#9CA3AF'} size={18} />
                </TouchableOpacity>
              </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
