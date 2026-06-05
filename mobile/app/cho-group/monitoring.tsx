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
import { ChevronLeft, ChevronDown, ChevronUp, Search, BookOpen, CheckCircle } from 'lucide-react-native';
import { getGroupMonitoring } from '@/services/choGroup.api';
import { ICHOGroupMonitoringMember } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

const PLACEHOLDER_AVATAR =
  'https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg';

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    flex: 1,
  },
  fill: { height: '100%', borderRadius: 3 },
});

function MemberCard({ member, isDark, themeColors }: { member: ICHOGroupMonitoringMember; isDark: boolean; themeColors: any }) {
  const [expanded, setExpanded] = useState(false);
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f9fafb' : '#1f2937';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';

  const completedCourses = member.courseProgress.filter((c) => c.isCompleted).length;
  const avgProgress =
    member.courseProgress.length > 0
      ? Math.round(member.courseProgress.reduce((s, c) => s + c.progress, 0) / member.courseProgress.length)
      : 0;

  return (
    <View style={[styles.memberCard, { backgroundColor: cardBg }]}>
      {/* Card header */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: member.user.photo ?? PLACEHOLDER_AVATAR }} style={styles.avatar} />
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: textPrimary }]}>{member.user.fullNames}</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: '#EFF1F8' }]}>
              <BookOpen size={11} color={themeColors.primary} />
              <Text style={[styles.statBadgeText, { color: themeColors.primary }]}>
                {member.courseProgress.length} amasomo
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle size={11} color="#059669" />
              <Text style={[styles.statBadgeText, { color: '#059669' }]}>
                {completedCourses} yaheze
              </Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <ProgressBar value={avgProgress} color={themeColors.primary} />
            <Text style={[styles.progressPct, { color: themeColors.primary }]}>{avgProgress}%</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={18} color={textMuted} />
        ) : (
          <ChevronDown size={18} color={textMuted} />
        )}
      </TouchableOpacity>

      {/* Expanded: course-by-course breakdown */}
      {expanded && (
        <View style={[styles.expandedContent, { borderTopColor: isDark ? '#374151' : '#f3f4f6' }]}>
          {member.courseProgress.length === 0 ? (
            <Text style={[styles.noDataText, { color: textMuted }]}>Nta masomo atangiye</Text>
          ) : (
            member.courseProgress.map((cp) => (
              <View key={cp.courseId} style={styles.courseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseTitle, { color: textPrimary }]} numberOfLines={1}>
                    {cp.courseTitle}
                  </Text>
                  <View style={styles.courseProgressRow}>
                    <ProgressBar
                      value={cp.progress}
                      color={cp.isCompleted ? '#059669' : themeColors.primary}
                    />
                    <Text style={[styles.progressPct, { color: cp.isCompleted ? '#059669' : themeColors.primary }]}>
                      {Math.round(cp.progress)}%
                    </Text>
                  </View>
                </View>
                {cp.isCompleted && (
                  <View style={[styles.completedBadge]}>
                    <Text style={styles.completedBadgeText}>Yarangiye</Text>
                  </View>
                )}
              </View>
            ))
          )}

          {/* Recent test scores */}
          {member.recentTestAttempts.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: textMuted }]}>Amanota ya vuba aha</Text>
              <View style={styles.attemptsRow}>
                {member.recentTestAttempts.slice(0, 5).map((a) => (
                  <View key={a.id} style={[styles.scorePill, { backgroundColor: a.marks >= 70 ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.scoreText, { color: a.marks >= 70 ? '#059669' : '#DC2626' }]}>
                      {a.marks}%
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function CHOGroupMonitoringScreen() {
  const router = useRouter();
  const { isDark, themeColors } = useTheme();
  const [search, setSearch] = useState('');

  const { data: monitoring, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cho-group-monitoring'],
    queryFn: getGroupMonitoring,
  });

  const filtered = (monitoring?.members ?? []).filter((m) =>
    m.user.fullNames.toLowerCase().includes(search.toLowerCase()),
  );

  const bgColor = isDark ? '#111827' : '#f8fafc';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f3f4f6';
  const textPrimary = isDark ? '#f9fafb' : '#1f2937';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.primary }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gukurikirana itsinda</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary banner */}
        {monitoring && (
          <View style={[styles.summaryBanner, { backgroundColor: themeColors.primary }]}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{monitoring.totalMembers}</Text>
              <Text style={styles.summaryLabel}>Abagize</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>
                {monitoring.members.filter((m) => m.courseProgress.some((c) => c.isCompleted)).length}
              </Text>
              <Text style={styles.summaryLabel}>Baheze isomo</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>
                {monitoring.members.length > 0
                  ? Math.round(
                      monitoring.members.reduce((s, m) => {
                        const avg = m.courseProgress.length
                          ? m.courseProgress.reduce((a, c) => a + c.progress, 0) / m.courseProgress.length
                          : 0;
                        return s + avg;
                      }, 0) / monitoring.members.length,
                    )
                  : 0}%
              </Text>
              <Text style={styles.summaryLabel}>Intambwe nyayo</Text>
            </View>
          </View>
        )}

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
            keyExtractor={(item) => item.studentId}
            renderItem={({ item }) => (
              <MemberCard member={item} isDark={isDark} themeColors={themeColors} />
            )}
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
                  Nta makuru ahari
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
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  summaryItem: { alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 4 },
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
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statBadgeText: { fontSize: 11, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressPct: { fontSize: 11, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  expandedContent: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  courseTitle: { fontSize: 12, marginBottom: 4 },
  courseProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  completedBadgeText: { fontSize: 10, color: '#059669', fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  attemptsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scorePill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 12, fontWeight: '700' },
  noDataText: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
