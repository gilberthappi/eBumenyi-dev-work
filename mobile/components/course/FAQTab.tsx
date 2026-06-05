import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Linking
} from 'react-native';
import { Play, Pause, Send, Trash2, Clock, Check, Download } from 'lucide-react-native';
import ChatAudioRecorderPlayer from '@/components/ChatAudioRecorderPlayer';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFaq, getFaqByCourse, deleteFaq } from '@/services/faq.api';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ChatMessage {
  id: string | number;
  type: 'text' | 'voice' | 'faq';
  text?: string;
  voiceUri?: string;
  user: string;
  avatar?: string;
  timestamp: number;
  isOther?: boolean;
}

interface Props {
  courseId?: string;
  slideId?: string;
  modalMode?: boolean;
  containerStyle?: any;
}

const { height } = Dimensions.get('window');

export default function FAQTab({ courseId, slideId, modalMode, containerStyle }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | number | null>(null);
  const [currentPlayingUri, setCurrentPlayingUri] = useState<string | null>(null);
  
  // Use expo-audio hooks properly
  const player = useAudioPlayer(currentPlayingUri);
  const status = useAudioPlayerStatus(player);
  
  const [newMessage, setNewMessage] = useState('');
  const [recorderActive, setRecorderActive] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Improved auto-scroll to bottom
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);
  
  // React Query: fetch FAQs and provide mutation for creating new FAQs
  const queryClient = useQueryClient();
  
  const faqsQuery = useQuery<any[], Error>({
    queryKey: ['faqs', courseId],
    queryFn: async () => {
      if (!courseId) return [] as any[];
      const resp = await getFaqByCourse(courseId as string);
      return (resp && resp.data) ? resp.data : [];
    },
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });

  // Keep local messages in sync with server-backed faqs
  useEffect(() => {
    if (!faqsQuery.data) return;
    const items: any[] = faqsQuery.data;
    const mapped: ChatMessage[] = items.map((item: any) => {
      const msg = String(item.message || '');
      const isVoice = msg.startsWith('file://') || /\.(m4a|mp3|wav|aac|mp4)(\?|$)/i.test(msg) || /^https?:\/\/.+\.(m4a|mp3|wav|aac|mp4)(\?|$)/i.test(msg);
      return {
        id: item.id,
        type: isVoice ? 'voice' : 'text',
        text: isVoice ? undefined : msg,
        voiceUri: isVoice ? msg : undefined,
        user: item.userFullName || 'Unknown',
        avatar: item.avatar,
        timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
        isOther: !item.isMine
      } as ChatMessage;
    });
    setMessages(mapped);
  }, [faqsQuery.data]);

  const createFaqMutation = useMutation<any, Error, any, unknown>({
    mutationFn: (payload: any) => createFaq(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs', courseId] });
    },
    onError: (err: any) => {
      console.log('createFaq mutation failed', err);
    }
  });
  
  const deleteFaqMutation = useMutation<any, Error, string, unknown>({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: (_data, id) => {
      // optimistic remove already applied; ensure server list refreshed
      queryClient.invalidateQueries({ queryKey: ['faqs', courseId] });
    },
    onError: (err: any) => {
      console.log('deleteFaq failed', err);
      Alert.alert('Byanze', 'Ntibishoboye gukuraho ubutumwa, gerageza kongera.');
    }
  });

  // Show spinner while faqs for the course are being fetched
  // NOTE: placed after hooks to avoid conditional hook calls
  if (courseId && faqsQuery.isLoading) {
    return <LoadingSpinner message={"Gufungura ibibazo n'ibisubizo..."} />;
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const now = Date.now();
    const message: ChatMessage = {
      id: now,
      type: 'text',
      text: newMessage,
      user: 'You',
      avatar: "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg",
      timestamp: now,
      isOther: false
    };

    setMessages(prev => [...prev, message]);
    const textToSend = newMessage.trim();
    setNewMessage('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);

    const activeSlideId = slideId || courseId;
    if (!activeSlideId) return;

    // Use React Query mutation (optimistic UI already updated local messages)
    const payload = { slideId: activeSlideId as string, message: textToSend, isPublished: true };
    createFaqMutation.mutate(payload, {
      onError: (err: any) => {
        console.log('FAQ create text error', err);
        // optionally remove optimistic message or mark as failed
      }
    });
  };

  // Handler when AudioRecorderPlayer gives back an audio URI
  const handleRecordedAudio = async (uri: string | null) => {
    if (!uri) return;

    const id = Date.now();
    const voiceMessage: ChatMessage = {
      id,
      type: 'voice',
      voiceUri: uri,
      user: 'You',
      avatar: "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg",
      timestamp: Date.now(),
      isOther: false
    };

    setMessages(prev => [...prev, voiceMessage]);

    const activeSlideId = slideId || courseId;
    if (!activeSlideId) return;

    try {
      const fileExtension = uri.split('.').pop() || 'm4a';
      const mimeType = fileExtension === 'm4a' ? 'audio/mp4' : `audio/${fileExtension}`;
      
      const audioFile = {
        uri: uri,
        type: mimeType,
        name: `voice-message-${Date.now()}.${fileExtension}`,
      };

      const payload = {
        slideId: activeSlideId as string,
        message: audioFile,
        isPublished: true
      };

      // Use mutation to upload and create FAQ; update optimistic local message on success
      createFaqMutation.mutate(payload, {
        onSuccess: (res: any) => {
          const returnedUrl = (res as any)?.data?.url || (res as any)?.url || (res as any)?.message || null;
          if (returnedUrl) {
            setMessages(prev => prev.map(m => (m.id === id ? { ...m, voiceUri: returnedUrl } : m)));
          }
        },
        onError: (err: any) => {
          console.log('FAQ create audio error', err);
          // optionally remove optimistic message or indicate failure to user
        }
      });
    } catch (error) {
      console.log('FAQ create audio error', error);
    }
  };

  const togglePlayForMessage = async (message: ChatMessage) => {
    const uri = message.voiceUri;
    if (!uri) return;
    
    try {
      // If different URI selected, switch to new audio
      if (currentPlayingUri !== uri) {
        // Stop current playback if any
        if (player.playing) {
          await player.pause();
        }
        
        setCurrentPlayingUri(uri);
        setCurrentPlayingId(message.id);
        
        // Small delay to ensure URI is set before playing
        setTimeout(async () => {
          try {
            await player.play();
          } catch {
            console.log('play start error');
          }
        }, 100);
      } else {
        // Same URI - toggle play/pause
        if (player.playing) {
          await player.pause();
        } else {
          await player.play();
        }
      }
    } catch (e) {
      console.log('playback error', e);
    }
  };

  // Format timestamp for message time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format seconds as mm:ss for audio duration
  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLongPress = (message: ChatMessage) => {
    // Only allow delete for user's own messages (not others)
    if (message.isOther) return;

    Alert.alert(
      'Siba ubutumwa',
      'Urashaka gusiba ubu butumwa?',
      [
        { text: 'Oya', style: 'cancel' },
        { text: 'Siba', style: 'destructive', onPress: () => confirmDelete(message) }
      ]
    );
  };

  const confirmDelete = (message: ChatMessage) => {
    // Optimistic remove locally
    const id = message.id;
    setMessages(prev => prev.filter(m => m.id !== id));

    // If message came from server (string id), call delete mutation
    if (typeof message.id === 'string' || typeof message.id === 'number') {
      deleteFaqMutation.mutate(String(message.id));
    }
  };

  const handleDownload = async (message: ChatMessage) => {
    const uri = message.voiceUri;
    if (!uri) {
      Alert.alert('Nta fichier', 'Uyu butumwa nta fichier iboneka');
      return;
    }
    if (uri.startsWith('http')) {
      try {
        await Linking.openURL(uri);
      } catch (e) {
        console.log(e)
        Alert.alert('Ikosa', 'Ntashoboye gufungura link');
      }
    } else {
      Alert.alert('Ntabwo bikunda', 'Iri ari local file; fungura kuri device cyangwa tegereza izindi nzira');
    }
  };

  return (
    <>
      <View style={{flex: 1, minHeight: 0}}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContentContainer}
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          nestedScrollEnabled={true}
          onContentSizeChange={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 50);
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Ntabibazo byabajijwe</Text>
              <Text style={styles.emptyStateText}>
                Tangira ku bijyanye n&apos;iri somo. Baza ikibazo cyangwa ohereze ubutumwa bw&apos;ijwi.
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isCurrentlyPlaying = currentPlayingId === message.id;
              // reduce bubble width for short text messages so they look compact
              const textLen = message.type === 'text' && message.text ? message.text.trim().length : 0;
              // tiny: single char or '.', 'Ok' -> very narrow; small: short words like 'thanks'; medium: short sentence
              const isTiny = textLen > 0 && textLen <= 2;
              const isSmall = textLen > 2 && textLen <= 10;
              const isMedium = textLen > 10 && textLen <= 40;
              // For very short messages we want the bubble to shrink-to-fit instead of stretching
              // Cast alignSelfStyle to any to satisfy React Native StyleProp typing
              const alignSelfStyle = (message.isOther ? { alignSelf: 'flex-start' } : { alignSelf: 'flex-end' }) as any;
              const shrinkStyle = (isTiny || isSmall || isMedium) ? { flex: 0 } : { flex: 1 };
              const messageContentStyle = [
                styles.messageContent,
                shrinkStyle,
                isTiny ? styles.messageContentTiny : isSmall ? styles.messageContentSmall : isMedium ? styles.messageContentMedium : null,
                alignSelfStyle,
              ];
              
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.isOther ? styles.otherMessage : styles.userMessage
                  ]}
                >
                  <Image
                    source={{ uri: message.avatar }}
                    style={styles.avatar}
                  />
                  <View style={messageContentStyle}>
                    <View style={[
                      styles.messageBubbleInner,
                      message.isOther ? styles.otherBubble : styles.userBubble
                    ]}>
                      {message.type === 'voice' ? (
                        <TouchableOpacity 
                          style={styles.voiceMessage}
                          onPress={() => togglePlayForMessage(message)}
                          onLongPress={() => handleLongPress(message)}
                        >
                          {isCurrentlyPlaying && status.playing ? (
                            <Pause size={16} color="#FFFFFF" />
                          ) : (
                            <Play size={16} color="#FFFFFF" />
                          )}
                          <Text style={styles.voiceMessageText}>
                            {isCurrentlyPlaying ? 
                              `${formatAudioTime(status.currentTime)} / ${formatAudioTime(status.duration)}` : 
                              `Ubutumwa bw'ijwi`
                            }
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onLongPress={() => handleLongPress(message)} activeOpacity={0.8}>
                          <Text style={[
                            styles.messageText,
                            message.isOther ? styles.otherText : styles.userText
                          ]}>
                            {message.text}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {/* metadata row */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaLeft}>
                          <Clock size={10} color={message.isOther ? '#6B7280' : '#E5E7EB'} />
                          <Text style={[styles.metaText, message.isOther ? styles.otherTimestamp : styles.userTimestamp]}>{formatTime(message.timestamp)}</Text>
                        </View>

                        <View style={styles.metaRight}>
                          {!message.isOther && (
                            <Check size={12} color={message.isOther ? '#6B7280' : '#E5E7EB'} style={{marginRight: 6}} />
                          )}
                          {message.type === 'voice' && (
                            <TouchableOpacity onPress={() => handleDownload(message)} style={styles.iconBtn}>
                              <Download size={14} color={message.isOther ? '#6B7280' : '#E5E7EB'} />
                            </TouchableOpacity>
                          )}
                          {!message.isOther && (
                            <TouchableOpacity onPress={() => confirmDelete(message)} style={styles.iconBtn}>
                              <Trash2 size={14} color={message.isOther ? '#6B7280' : '#E5E7EB'} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                     </View>
                   </View>
                 </View>
               );
             })
          )}
        </ScrollView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{width: '100%'}}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            {!recorderActive && (
              <TextInput
                style={[styles.textInput, { marginRight: 8 }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Andika ubutumwa..."
                placeholderTextColor="#9CA3AF"
                multiline
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
            )}

            <View style={[styles.recorderWrapper, recorderActive && styles.recorderWrapperActive]}>
              <ChatAudioRecorderPlayer onChange={handleRecordedAudio} onActiveChange={setRecorderActive} />
            </View>

            {!recorderActive && (
              <TouchableOpacity 
                style={[styles.sendButton, !newMessage.trim() ? { backgroundColor: '#9CA3AF' } : undefined]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

// Your existing styles remain the same
const styles = StyleSheet.create({
  // ... keep all your existing styles exactly as they are
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  chatSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ebe8e5ff',
    overflow: 'hidden',
    height: height * 0.3,
    marginTop: 26,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContentContainer: {
    padding: 10,
    paddingBottom: 4,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessage: {
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageContent: {
    flex: 1,
    marginHorizontal: 4,
    maxWidth: '80%',
  },
  messageContentTiny: {
    maxWidth: '38%',
    flex: 0,
   },
   messageContentSmall: {
    maxWidth: '46%',
    flex: 0,
   },
   messageContentMedium: {
    maxWidth: '60%',
    flex: 0,
   },
  messageBubbleInner: {
    padding: 10,
    borderRadius: 16,
    marginBottom: 1,
  },
  userBubble: {
    backgroundColor: '#5184cfff',
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#111827',
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  voiceMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 8,
    textAlign: 'right',
    marginTop: 4,
  },
  userTimestamp: {
    color: '#E5E7EB',
  },
  otherTimestamp: {
    color: '#6B7280',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    marginLeft: -2
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4
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
  },
  recorderWrapper: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  recorderWrapperActive: {
    width: 280,
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
});