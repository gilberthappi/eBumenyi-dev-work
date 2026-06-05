import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Users, Check, X } from 'lucide-react-native';
import { getMyInvitations, respondToInvitation } from '@/services/choGroup.api';
import { ICHOGroupInvitation } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

const PLACEHOLDER_AVATAR =
  'https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg';

export default function InvitationsScreen() {
  const router = useRouter();
  const { isDark, themeColors } = useTheme();
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['cho-invitations-mine'],
    queryFn: getMyInvitations,
  });

  const { mutate: respond, isPending } = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondToInvitation(id, accept),
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ['cho-invitations-mine'] });
      queryClient.invalidateQueries({ queryKey: ['COURSE'] });
      Alert.alert(
        'Byagenze neza!',
        accept ? 'Wemeye ubutumire. Ubu uri mu itsinda.' : 'Waranze ubutumire.',
      );
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? 'Habaye ikosa. Ongera ugerageze.';
      Alert.alert('Ikosa', msg);
    },
  });

  const handleRespond = (invitation: ICHOGroupInvitation, accept: boolean) => {
    Alert.alert(
      accept ? 'Emeza ubutumire' : 'Anga ubutumire',
      accept
        ? `Urashaka kwinjira mu itsinda "${invitation.group?.name}"?`
        : `Urashaka gutura ubutumire bwa "${invitation.group?.name}"?`,
      [
        { text: 'Oya', style: 'cancel' },
        {
          text: accept ? 'Yego, injira' : 'Yego, anga',
          style: accept ? 'default' : 'destructive',
          onPress: () => respond({ id: invitation.id, accept }),
        },
      ],
    );
  };

  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textPrimary = isDark ? '#f9fafb' : '#1f2937';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const bgColor = isDark ? '#111827' : '#f8fafc';

  const renderInvitation = ({ item }: { item: ICHOGroupInvitation }) => {
    const cho = item.group?.cho?.user;
    return (
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        {/* Group icon */}
        <View style={[styles.groupIconWrapper, { backgroundColor: '#EFF1F8' }]}>
          <Users size={28} color={themeColors.primary} />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.groupName, { color: textPrimary }]}>
            {item.group?.name ?? 'Itsinda ritazwi'}
          </Text>

          {cho && (
            <View style={styles.choRow}>
              <Image
                source={{ uri: cho.photo ?? PLACEHOLDER_AVATAR }}
                style={styles.choAvatar}
              />
              <View>
                <Text style={[styles.choLabel, { color: textMuted }]}>CHO uyobora:</Text>
                <Text style={[styles.choName, { color: textPrimary }]}>{cho.fullNames}</Text>
                {cho.phoneNumber && (
                  <Text style={[styles.choPhone, { color: textMuted }]}>{cho.phoneNumber}</Text>
                )}
              </View>
            </View>
          )}

          <Text style={[styles.invitedAt, { color: textMuted }]}>
            Yoherejwe: {new Date(item.invitedAt).toLocaleDateString('rw-RW', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, { borderColor: '#ef4444' }]}
              onPress={() => handleRespond(item, false)}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <X size={16} color="#ef4444" />
              <Text style={[styles.rejectBtnText]}>Anga</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => handleRespond(item, true)}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.acceptBtnText}>Emera</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
          <Text style={styles.headerTitle}>Ubutumire bwanjye</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(item) => item.id}
            renderItem={renderInvitation}
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
                <Users size={56} color={isDark ? '#374151' : '#d1d5db'} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                  Nta butumire ahari
                </Text>
                <Text style={[styles.emptyText, { color: textMuted }]}>
                  Nta butumire ubuze none. Niba CHO yagutumiye, buzagaragara hano.
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
  list: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 12,
  },
  groupIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  cardContent: { gap: 10 },
  groupName: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  choRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  choAvatar: { width: 40, height: 40, borderRadius: 20 },
  choLabel: { fontSize: 11 },
  choName: { fontSize: 13, fontWeight: '600' },
  choPhone: { fontSize: 12 },
  invitedAt: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  rejectBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
