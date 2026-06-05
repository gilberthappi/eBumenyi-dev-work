import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Animated } from 'react-native';
import { Send, Trash2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createFeedback, deleteFeedback, getFeedbackByCourse } from '@/services/feedback.api';

interface FeedbackItem {
  id: string | number;
  message: string;
  userFullName: string;
  avatar?: string | null;
  createdAt: string;
  isMine?: boolean;
}

interface Props {
  courseId?: string;
  slideId?: string;
  modalMode?: boolean;
  containerStyle?: any;
}

export default function FeedbackBox({ courseId, slideId, modalMode, containerStyle }: Props) {
  const [messages, setMessages] = useState<FeedbackItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const feedbacksQuery = useQuery<any[], Error>({
    queryKey: ['feedbacks', courseId],
    queryFn: async () => {
      if (!courseId) return [] as any[];
      const resp = await getFeedbackByCourse(courseId as string);
      return (resp && resp.data) ? resp.data : [];
    },
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!feedbacksQuery.data) return;
    const items: any[] = feedbacksQuery.data;
    const mapped = items.map((it: any) => ({
      id: it.id,
      message: it.message,
      userFullName: it.userFullName || 'Unknown',
      avatar: it.avatar,
      createdAt: it.createdAt,
      isMine: it.isMine
    } as FeedbackItem));
    setMessages(mapped);
  }, [feedbacksQuery.data]);

  const createMutation = useMutation<any, Error, any, unknown>({
    mutationFn: (payload: any) => createFeedback(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbacks', courseId] }),
    onError: (err: any) => console.log('createFeedback failed', err),
  });

  const deleteMutation = useMutation<any, Error, string, unknown>({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedbacks', courseId] }),
    onError: (err: any) => console.log('deleteFeedback failed', err),
  });

  // autoscroll
  useEffect(() => {
    const t = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages]);

  const send = () => {
    if (!newMessage.trim()) return;
    const now = Date.now();
    const item = {
      id: now,
      message: newMessage.trim(),
      userFullName: 'You',
      avatar: 'https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg',
      createdAt: new Date().toISOString(),
      isMine: true
    } as FeedbackItem;

    setMessages(prev => [...prev, item]);
    setNewMessage('');

    const activeSlideId = slideId || courseId;
    if (!activeSlideId) return;

    const payload = { slideId: activeSlideId as string, message: item.message, isPublished: true };
    createMutation.mutate(payload, {
      onError: () => {
        // optionally remove optimistic message
      }
    });
  };

  const confirmDelete = (id: string | number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    deleteMutation.mutate(String(id));
  };

  if (courseId && feedbacksQuery.isLoading) {
    return <LoadingSpinner message={'Gufungura ibitekerezo...'} />;
  }

  return (
    <View style={[{ flex: 1 }, containerStyle]}>      
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesContentContainer} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nta bitekerezo</Text>
            <Text style={styles.emptyStateText}>Tanga igitekerezo uko wakiriye isomo cyangwa ibitekerezo byawe.</Text>
          </View>
        ) : (
          messages.map((m) => (
            <View key={m.id} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {m.avatar ? (
                  <Image source={{ uri: m.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}><Text style={{ color: '#3363AD', fontWeight: '700' }}>{(m.userFullName || 'U')[0]}</Text></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ marginTop: 8 }}>{m.message}</Text>
                </View>
                {!m.isMine ? null : (
                  <TouchableOpacity onPress={() => confirmDelete(m.id)} style={{ padding: 8 }}>
                    <Trash2 size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputContainer}>
          <TextInput value={newMessage} onChangeText={setNewMessage} style={[styles.textInput, { marginRight: 8 }]} placeholder="Andika igitekerezo..." placeholderTextColor="#9CA3AF" multiline returnKeyType="send" onSubmitEditing={send} />
          <TouchableOpacity onPress={send} style={[styles.sendButton, !newMessage.trim() ? { backgroundColor: '#9CA3AF' } : undefined]} disabled={!newMessage.trim()}>
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
  messagesContentContainer: {
    padding: 10,
    paddingBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3363AD',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EEF9'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 8,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
    minHeight: 60,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3363AD',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 8,
  }
});
