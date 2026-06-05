import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { Send, MoreVertical, X } from 'lucide-react-native';
import { ICommentThread } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/auth';

interface CommentThreadProps {
  comments: ICommentThread[] | undefined;
  onClose: () => void;
  onAddComment: (text: string) => void;
  onEditComment?: (commentId: string, text: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isLoading?: boolean;
}

export function CommentThread({
  comments,
  onClose,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isLoading,
}: CommentThreadProps) {
  const [commentText, setCommentText] = React.useState('');
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getMe(),
    staleTime: Infinity,
  });

  const handleAddComment = () => {
    if (!commentText.trim()) {
      alert('ntabutumwa wanditse');
      return;
    }
    onAddComment(commentText);
    setCommentText('');
  };

  const handleCommentMenuPress = (comment: ICommentThread) => {
    const isCommentOwner = comment.userId === currentUser?.id;

    if (Platform.OS === 'ios') {
      const options = ['Oya'];
      const destructiveIndex: number[] = [];

      if (isCommentOwner) {
        options.push('Vugurura', 'Siba');
        destructiveIndex.push(2);
      }

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex.length > 0 ? destructiveIndex[0] : undefined,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1 && isCommentOwner) {
            setEditingCommentId(comment.id);
            setEditingText(comment.text);
          } else if (buttonIndex === 2 && isCommentOwner) {
            Alert.alert('Siba igitekerezo', 'urabyifuza?', [
              { text: 'Oya', style: 'cancel' },
              {
                text: 'Siba',
                style: 'destructive' as const,
                onPress: () => onDeleteComment?.(comment.id),
              },
            ]);
          }
        }
      );
    } else {
      Alert.alert('ibijyanye n igitekerezo', '', [
        ...(isCommentOwner ? [
          { text: 'Vugurura', onPress: () => {
            setEditingCommentId(comment.id);
            setEditingText(comment.text);
          } },
          { text: 'Siba', style: 'destructive' as const, onPress: () => onDeleteComment?.(comment.id) },
        ] : []),
        { text: 'Oya', style: 'cancel' as const },
      ]);
    }
  };

  const handleSaveEdit = () => {
    if (!editingText.trim()) {
      alert('ntabutumwa wanditse');
      return;
    }
    if (editingCommentId) {
      onEditComment?.(editingCommentId, editingText);
      setEditingCommentId(null);
      setEditingText('');
    }
  };

  const renderCommentItem = ({ item }: { item: ICommentThread }) => {
    const isCommentOwner = item.userId === currentUser?.id;

    return (
      <View style={styles.commentItem}>
        <Image
          source={{ uri: item.user?.photo }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>
              {item.user?.fullNames || 'Izina'}
            </Text>
            {isCommentOwner && (
              <TouchableOpacity onPress={() => handleCommentMenuPress(item)}>
                <MoreVertical size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
          <Text style={styles.commentTime}>{formatCommentTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ibitekerezo ({comments?.length || 0})</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      <FlatList
        data={comments || []}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id}
        style={styles.commentsList}
        contentContainerStyle={styles.commentsListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Ntagitekerezo. Tanga igitekerezo bwambere!</Text>
          </View>
        }
      />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Comment Input */}
      {editingCommentId ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            placeholder="Vugurura igitekerezo cyawe..."
            value={editingText}
            onChangeText={setEditingText}
            multiline
            maxLength={500}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={() => {
                setEditingCommentId(null);
                setEditingText('');
              }}
            >
              <Text style={styles.cancelButtonText}>Oya</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Bika</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Shiraho igitekerezo..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
            onPress={handleAddComment}
            disabled={!commentText.trim()}
          >
            <Send size={20} color={commentText.trim() ? '#4D81D2' : '#d1d5db'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function formatCommentTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}amezi`;
  } catch {
    return 'igihe kitazwi';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  editContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    maxHeight: 100,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4D81D2',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
