import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Search, MapPin, Phone, UserPlus } from 'lucide-react-native';
import { getMyGroupMembers } from '@/services/choGroup.api';
import { ICHOGroupMember } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

const PLACEHOLDER_AVATAR =
  'https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg';

export default function CHOGroupMembersScreen() {
  const router = useRouter();
  const { isDark, themeColors } = useTheme();
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cho-group-members'],
    queryFn: getMyGroupMembers,
  });

  const filtered = members.filter((m) =>
    m.student.user.fullNames.toLowerCase().includes(search.toLowerCase()),
  );

  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f9fafb' : '#1f2937';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const bgColor = isDark ? '#111827' : '#f8fafc';
  const inputBg = isDark ? '#374151' : '#f3f4f6';

  const renderMember = ({ item }: { item: ICHOGroupMember }) => {
    const u = item.student.user;
    return (
      <View style={[styles.memberCard, { backgroundColor: cardBg }]}>
        <Image
          source={{ uri: u.photo ?? PLACEHOLDER_AVATAR }}
          style={styles.avatar}
        />
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: textPrimary }]}>{u.fullNames}</Text>
          {u.phoneNumber && (
            <View style={styles.metaRow}>
              <Phone size={12} color={textMuted} />
              <Text style={[styles.metaText, { color: textMuted }]}>{u.phoneNumber}</Text>
            </View>
          )}
          {(u.district || u.sector) && (
            <View style={styles.metaRow}>
              <MapPin size={12} color={textMuted} />
              <Text style={[styles.metaText, { color: textMuted }]}>
                {[u.district, u.sector].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.joinedBadge, { backgroundColor: '#EFF1F8' }]}>
          <Text style={[styles.joinedText, { color: themeColors.primary }]}>
            {new Date(item.joinedAt).toLocaleDateString('rw-RW', {
              day: '2-digit',
              month: 'short',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.primary }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Abagize itsinda</Text>
          <TouchableOpacity
            onPress={() => router.push('/cho-group/invite')}
            style={styles.inviteButton}
          >
            <UserPlus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchWrapper, { backgroundColor: bgColor }]}>
          <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
            <Search size={16} color={textMuted} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Shakisha umunyamuryango..."
              placeholderTextColor={textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={themeColors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  {search ? 'Nta munyamuryango uhuye n\'ubushakashatsi' : 'Nta bagize itsinda bahari'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 12 },
  joinedBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  joinedText: { fontSize: 11, fontWeight: '500' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
