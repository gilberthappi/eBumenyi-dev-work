import { View, Text, StyleSheet, useWindowDimensions, TouchableWithoutFeedback, Image, Linking, TouchableOpacity, Modal } from 'react-native';
import { Check, CheckCheck, Film, FileText, FileSpreadsheet, Presentation, File, Paperclip } from 'lucide-react-native';
import { useState, useRef, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IMessage } from '@/types';
import { getMe } from '@/services/auth';
import { MessageContextMenu } from './MessageContextMenu';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { WhatsAppVideoMessage } from './WhatsAppVideoMessage';

interface MessageBubbleProps {
  message: IMessage;
  onEdit?: (message: IMessage) => void;
  onDelete?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
}


function formatMessageTime(timestamp: any): string {
  try {
    // Handle null/undefined
    if (!timestamp) {
      return 'Invalid time';
    }

    // Convert to Date if needed
    let dateObj: Date;
    if (typeof timestamp === 'string') {
      dateObj = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else {
      return 'Invalid time';
    }

    // Validate date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    console.warn('formatMessageTime error:', error);
    return 'Invalid time';
  }
}

function MessageBubbleComponent({ message, onEdit, onDelete, onLike }: MessageBubbleProps) {
  // If message is deleted, render nothing
  if ((message as any).isDeleted === true) {
    return null;
  }

  const { width } = useWindowDimensions();
  const responsiveStyles = getResponsiveStyles(width);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState('');
  const [videoError, setVideoError] = useState(false);
  const bubbleRef = useRef<View>(null);

  // Get current user ID
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getMe,
    staleTime: Infinity,
  });

  const isSent = message.senderId === currentUser?.id;
  const likeCount = (message as any).likeCount ?? message.likes ?? 0;
  const isLiked = likeCount > 0;

  // Pre-compute attachment type so both the content renderer and footer can use it
  const _attachments = (() => {
    let a = (message as any).attachments;
    if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = null; } }
    return Array.isArray(a) && a.length > 0 ? a[0] : null;
  })();
  const _attachmentUrl = _attachments?.url || ((message.content || '').startsWith('https://res.cloudinary.com') ? message.content : null);
  const isAudioMessage = message.type === 'audio' || _attachments?.type === 'audio' ||
    !!(_attachmentUrl && (_attachmentUrl.includes('.m4a') || _attachmentUrl.includes('.mp3') || _attachmentUrl.includes('.wav') || _attachmentUrl.includes('.ogg')));

  // Image/video messages get zero bubble padding — media fills edge-to-edge
  const _isImageMsg =
    message.type === 'image' ||
    _attachments?.type === 'image' ||
    !!(_attachmentUrl && /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(_attachmentUrl));
  const _isVideoMsg =
    message.type === 'video' ||
    _attachments?.type === 'video' ||
    !!(_attachmentUrl && /\.(mp4|mov|avi|mkv)$/i.test(_attachmentUrl));
  const isMediaMessage = _isImageMsg || _isVideoMsg;

  const handleLongPress = () => {
    if (bubbleRef.current) {
      bubbleRef.current.measure((x, y, width, bubbleHeight, pageX, pageY) => {
        // Position menu below the message, aligned to the right for sent, left for received
        const menuX = isSent ? pageX + width - 80 : pageX;
        const menuY = pageY - 8;
        setMenuPosition({ x: menuX, y: menuY });
        setShowMenu(true);
      });
    }
  };
  
  return (
    <View
      style={[
        styles.messageContainer,
        isSent ? styles.sentContainer : styles.receivedContainer,
      ]}>
      <TouchableWithoutFeedback onLongPress={handleLongPress}>
        <View
          ref={bubbleRef}
          style={[
            styles.bubble,
            { maxWidth: responsiveStyles.bubbleMaxWidth },
            isSent ? styles.sentBubble : styles.receivedBubble,
            isAudioMessage && styles.audioBubble,
            isMediaMessage && styles.mediaBubble,
          ]}>
          {(() => {
            // Detect attachment type from message
            let attachments = (message as any).attachments;
            if (typeof attachments === 'string') {
              try { attachments = JSON.parse(attachments); } catch { attachments = null; }
            }
            const firstAttachment = Array.isArray(attachments) && attachments.length > 0 ? attachments[0] : null;

            // Attachment URL: prefer firstAttachment.url, fall back to content if it's a Cloudinary URL
            const attachmentUrl: string | null =
              firstAttachment?.url ||
              ((message.content || '').startsWith('https://res.cloudinary.com') ? message.content : null);

            // Type detection — message.type is the authoritative source; attachment type is a fallback
            const isAudioType =
              message.type === 'audio' ||
              firstAttachment?.type === 'audio' ||
              !!(attachmentUrl && /\.(m4a|mp3|wav|ogg)$/i.test(attachmentUrl));

            const isVideoType =
              message.type === 'video' ||
              firstAttachment?.type === 'video' ||
              !!(attachmentUrl && /\.(mp4|mov|avi|mkv)$/i.test(attachmentUrl));

            // Image: trust message.type first, then attachment type, then URL extension
            // Cloudinary image URLs often have NO extension — rely on message.type / attachment.type
            const isImageType =
              message.type === 'image' ||
              firstAttachment?.type === 'image' ||
              !!(attachmentUrl && /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(attachmentUrl));

            // File: only if none of the above matched AND there is an attachment
            const isFileType =
              !isAudioType && !isVideoType && !isImageType &&
              (message.type === 'file' || !!firstAttachment);

            if (isAudioType) {
              const audioUrl = attachmentUrl || firstAttachment?.url;
              return <AudioMessagePlayer url={audioUrl || ''} messageId={message.id} isSent={isSent} timestamp={message.timestamp} readCount={(message as any).readCount} />;
            }

            if (isVideoType) {
              const videoUrl = attachmentUrl || firstAttachment?.url;
              
              if (videoUrl) {
                return (
                  <View style={[styles.mediaContainer, { height: 165 }]}>
                    {videoError ? (
                      <View style={styles.videoErrorContainer}>
                        <Film size={28} color="#9ca3af" />
                        <Text style={styles.videoErrorText}>Video itashobora gufunguwa</Text>
                      </View>
                    ) : (
                      <WhatsAppVideoMessage
                        uri={videoUrl}
                        bubbleWidth={220}
                        bubbleHeight={165}
                        onError={(error) => {
                          console.error('[MessageBubble] Video error:', error);
                          setVideoError(true);
                        }}
                      />
                    )}
                    {/* Timestamp overlay — bottom-right, WhatsApp style */}
                    <View style={[styles.mediaFooter, isSent ? styles.mediaFooterSent : styles.mediaFooterReceived]}>
                      <Text style={styles.mediaTimestamp}>
                        {message?.timestamp ? formatMessageTime(message.timestamp) : ''}
                      </Text>
                      {isSent && (
                        (message as any).readCount > 0
                          ? <CheckCheck size={13} color="#fff" />
                          : <Check size={13} color="rgba(255,255,255,0.8)" />
                      )}
                    </View>
                  </View>
                );
              }

              // Fallback: video link row (no URL available)
              const videoName = message.content || 'Video';
              const cleanVideoName = videoName.startsWith('http')
                ? decodeURIComponent(videoName.split('/').pop()?.split('?')[0] || 'Video')
                : videoName;

              return (
                <TouchableOpacity
                  onPress={() => videoUrl && Linking.openURL(videoUrl)}
                  activeOpacity={0.75}
                  style={styles.fileRow}
                >
                  <View style={[styles.fileIconBox, { backgroundColor: '#0f172a18' }]}>
                    <Film size={22} color="#374151" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={2}>{cleanVideoName}</Text>
                    <View style={styles.fileMeta}>
                      <View style={[styles.extBadge, { backgroundColor: '#374151' }]}>
                        <Text style={styles.extBadgeText}>VIDEO</Text>
                      </View>
                      <Text style={styles.fileHint}>Kanda gufungura</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            if (isImageType) {
              const imgUrl = attachmentUrl || firstAttachment?.url;
              return (
                <>
                  {/* Image fills bubble edge-to-edge, timestamp overlaid */}
                  <TouchableOpacity
                    onPress={() => {
                      setViewerImageUrl(imgUrl || '');
                      setImageViewerVisible(true);
                    }}
                    activeOpacity={0.9}
                    style={styles.mediaContainer}
                  >
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.mediaImage}
                      resizeMode="cover"
                    />
                    {/* Timestamp overlay bottom-right */}
                    <View style={[styles.mediaFooter, isSent ? styles.mediaFooterSent : styles.mediaFooterReceived]}>
                      <Text style={styles.mediaTimestamp}>
                        {message?.timestamp ? formatMessageTime(message.timestamp) : ''}
                      </Text>
                      {isSent && (
                        (message as any).readCount > 0
                          ? <CheckCheck size={13} color="#fff" />
                          : <Check size={13} color="rgba(255,255,255,0.8)" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Modal
                    visible={imageViewerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setImageViewerVisible(false)}
                    statusBarTranslucent
                  >
                    <View style={styles.viewerBg}>
                      <TouchableOpacity onPress={() => setImageViewerVisible(false)} style={styles.viewerClose}>
                        <Text style={styles.viewerCloseText}>✕</Text>
                      </TouchableOpacity>
                      <Image source={{ uri: viewerImageUrl }} style={styles.viewerImage} resizeMode="contain" />
                      <TouchableOpacity onPress={() => Linking.openURL(viewerImageUrl)} style={styles.viewerOpenBtn}>
                        <Text style={styles.viewerOpenText}>Fungura mu browser</Text>
                      </TouchableOpacity>
                    </View>
                  </Modal>
                </>
              );
            }

            if (isFileType) {
              const fileUrl = attachmentUrl || firstAttachment?.url;
              const rawName = message.content || (message as any).attachmentName || 'Dosiye';
              const cleanFileName = rawName.startsWith('http')
                ? decodeURIComponent(rawName.split('/').pop()?.split('?')[0] || 'Dosiye')
                : rawName;
              const ext = cleanFileName.split('.').pop()?.toUpperCase() || 'FILE';

              const getFileIcon = (extension: string) => {
                const e = extension.toLowerCase();
                if (e === 'pdf') return { icon: FileText, color: '#ef4444' };
                if (['doc', 'docx'].includes(e)) return { icon: FileText, color: '#2563eb' };
                if (['xls', 'xlsx'].includes(e)) return { icon: FileSpreadsheet, color: '#16a34a' };
                if (['ppt', 'pptx'].includes(e)) return { icon: Presentation, color: '#ea580c' };
                if (['txt', 'csv'].includes(e)) return { icon: File, color: '#6b7280' };
                return { icon: Paperclip, color: '#6b7280' };
              };

              const fileIcon = getFileIcon(ext);
              const FileIconComponent = fileIcon.icon;

              return (
                <TouchableOpacity
                  onPress={() => fileUrl && Linking.openURL(fileUrl)}
                  activeOpacity={0.75}
                  style={styles.fileRow}
                >
                  <View style={[styles.fileIconBox, { backgroundColor: `${fileIcon.color}18` }]}>
                    <FileIconComponent size={22} color={fileIcon.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={2}>{cleanFileName}</Text>
                    <View style={styles.fileMeta}>
                      <View style={[styles.extBadge, { backgroundColor: fileIcon.color }]}>
                        <Text style={styles.extBadgeText}>{ext}</Text>
                      </View>
                      <Text style={styles.fileHint}>Kanda gufungura</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <Text
                style={[
                  styles.messageText,
                  { fontSize: responsiveStyles.fontSize },
                  isSent ? styles.sentText : styles.receivedText,
                ]}
                numberOfLines={10}>
                {message.content || message.title || 'ubutumwa'}
              </Text>
            );
          })()}
          <View style={[styles.footer, (isAudioMessage || isMediaMessage) && styles.footerHidden]}>
            <Text
              style={[
                styles.timestamp,
                { fontSize: responsiveStyles.timestampSize },
                isSent ? styles.sentTimestamp : styles.receivedTimestamp,
              ]}>
              {message?.timestamp ? formatMessageTime(message.timestamp) : 'Invalid time'}
            </Text>
            {isSent && (
              <View style={styles.checkContainer}>
                {(message as any).readCount > 0 ? (
                  <CheckCheck size={responsiveStyles.iconSize} color="#53BDEB" />
                ) : (
                  <Check size={responsiveStyles.iconSize} color="#8696A0" />
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Like badge — show heart when liked */}
      {likeCount > 0 && (
        <View style={[styles.likeBadge, isSent ? styles.likeBadgeSent : styles.likeBadgeReceived]}>
          <Text style={styles.likeBadgeText}>❤️</Text>
        </View>
      )}

      <MessageContextMenu
        visible={showMenu}
        x={menuPosition.x}
        y={menuPosition.y}
        isSent={isSent}
        isLiked={isLiked}
        onEdit={() => {
          setShowMenu(false);
          onEdit?.(message);
        }}
        onDelete={() => {
          setShowMenu(false);
          onDelete?.(message.id);
        }}
        onLike={() => {
          setShowMenu(false);
          onLike?.(message.id);
        }}
        onClose={() => setShowMenu(false)}
      />
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

function getResponsiveStyles(width: number) {
  const isSmallScreen = width < 400;
  const isLargeScreen = width > 768;
  
  return {
    bubbleMaxWidth: isSmallScreen ? width * 0.85 : isLargeScreen ? width * 0.6 : width * 0.75,
    fontSize: isSmallScreen ? 14 : isLargeScreen ? 18 : 16,
    timestampSize: isSmallScreen ? 10 : isLargeScreen ? 12 : 11,
    iconSize: isSmallScreen ? 14 : 16,
  };
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  audioBubble: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  // Image/video: zero padding so media fills edge-to-edge, overflow hidden clips to border radius
  mediaBubble: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  sentBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 2,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    lineHeight: 20,
  },
  sentText: {
    color: '#000000',
  },
  receivedText: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  footerHidden: {
    display: 'none',
  },
  timestamp: {
    lineHeight: 16,
  },
  sentTimestamp: {
    color: '#667781',
  },
  receivedTimestamp: {
    color: '#8696A0',
  },
  checkContainer: {
    marginLeft: 2,
  },

  // ── Media (image / video) ────────────────────────────────────────────────
  mediaContainer: {
    width: 220,
    height: 220,
  },
  mediaImage: {
    width: 220,
    height: 220,
  },
  // Timestamp pill overlaid on bottom-right of media
  mediaFooter: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediaFooterSent: {
    right: 6,
  },
  mediaFooterReceived: {
    right: 6,
  },
  mediaTimestamp: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },

  // ── File attachment ──────────────────────────────────────────────────────
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
    maxWidth: 240,
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 17,
    marginBottom: 2,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  extBadge: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  extBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  fileHint: {
    fontSize: 10,
    color: '#6b7280',
  },

  // ── Image viewer modal ───────────────────────────────────────────────────
  viewerBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  viewerImage: { width: '100%', height: '80%' },
  viewerOpenBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  viewerOpenText: { color: '#fff', fontSize: 13 },

  // ── Like badge ───────────────────────────────────────────────────────────
  likeBadge: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  likeBadgeSent: {
    right: 8,
  },
  likeBadgeReceived: {
    left: 8,
  },
  likeBadgeText: {
    fontSize: 14,
  },
  videoErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 6,
    padding: 12,
  },
  videoErrorText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
