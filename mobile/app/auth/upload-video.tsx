import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity, Animated, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup } from '@/services/auth';
import Button from '@/components/Button';
import { handleResponse } from '@/utils/responseHandler';
import * as ImagePicker from 'expo-image-picker';
import VideoViewer from '@/components/VideoViewer';
import AudioRecorderPlayer from '@/components/AudioRecorderPlayer';
import { 
  Upload, 
  Video as VideoIcon,
  RotateCcw,
  CheckCircle,
  User,
  MapPin,
  Target,
  Clock,
  Camera,
  User2,
  Mic,
  Pencil,
} from 'lucide-react-native';
import { assets } from '@/theme';
import { useLanguage } from '@/contexts/LanguageContext';

const { height } = Dimensions.get('window');

// Define proper types that match ImagePickerAsset
interface VideoAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  duration?: number;
  width?: number;
  height?: number;
}

interface SignupFormData {
  [key: string]: string | number | boolean;
}

export default function UploadVideoScreen() {
  const router = useRouter();
  const { isDark, themeColors } = useTheme();
    const { t } = useLanguage();
  const [video, setVideo] = useState<VideoAsset | null>(null);
  const [formData, setFormData] = useState<SignupFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bioMethod, setBioMethod] = useState<'video' | 'audio' | 'text'>('video');
  const [bioText, setBioText] = useState('');
  const [audio, setAudio] = useState<string | undefined>(undefined);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('signupPayload');
      if (saved) setFormData(JSON.parse(saved));

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Uburenganzira', 
          'Uburenganzira bwa kamera burakenewe kugirango ukore amashusho.'
        );
      }
    })();

    const startAnimations = async () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startAnimations();

    // Cleanup on unmount
    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    };
  }, [fadeAnim, slideAnim]);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 120,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        // Convert ImagePickerAsset to our VideoAsset type
        const videoAsset: VideoAsset = {
          uri: selectedVideo.uri,
          fileName: selectedVideo.fileName || undefined,
          mimeType: selectedVideo.mimeType || undefined,
          duration: selectedVideo.duration ?? undefined,
          width: selectedVideo.width ?? undefined,
          height: selectedVideo.height ?? undefined,
        };
        
        setVideo(videoAsset);
        setUploadProgress(0);
      }
    } catch (error) {
      console.log('Video pick error:', error);
      Alert.alert('Ikosa', 'Ntago amashusho yakiriwe. Wongera ugerageze.');
    }
  };

  const captureVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        videoMaxDuration: 120,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedVideo = result.assets[0];
        // Convert ImagePickerAsset to our VideoAsset type
        const videoAsset: VideoAsset = {
          uri: capturedVideo.uri,
          fileName: capturedVideo.fileName || undefined,
          mimeType: capturedVideo.mimeType || undefined,
          width: capturedVideo.width,
          height: capturedVideo.height,
        };
        
        setVideo(videoAsset);
        setUploadProgress(0);
      }
    } catch (error) {
      console.log('Video capture error:', error);
      Alert.alert('Ikosa', 'Ntago amashusho yakiriwe. Wongera ugerageze.');
    }
  };

  const simulateUploadProgress = () => {
    // Clear any existing interval
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
    }

    uploadIntervalRef.current = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { // Stop at 90% until actual upload completes
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
          return 90;
        }
        const increment = Math.random() * 15 + 5; // 5-20% increments
        return Math.min(prev + increment, 90);
      });
    }, 200);
  };

  const handleSubmit = async () => {
    if (!formData) {
      Alert.alert('Ikosa', 'Suzuma ibyanditswe. Wongera utangire.');
      return;
    }
    // At least one of audio, video, or bio must be present
    if (!bioText && !audio && !video) {
      Alert.alert(t('error'), 'Shyiramo byibuze kimwe: Bio, Amajwi, cyangwa Amashusho.');
      return;
    }

    setLoading(true);
    simulateUploadProgress();

    try {
      const data = new FormData();
      
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          data.append(key, value);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          data.append(key, value.toString());
        }
      });
      // Append bio if present
      if (bioText) {
        data.append('bio', bioText);
      }
      // Append audio if present
      if (audio) {
        data.append('audio', audio);
      }
      // Append video file if present
      if (video) {
        data.append('video', {
          uri: video.uri,
          name: video.fileName || 'video_yo_kwiyandikisha.mp4',
          type: video.mimeType || 'video/mp4',
        } as any);
      }
      console.log(data);
      const res = await signup(data);
      const ok = handleResponse({ response: res });
      
      if (ok) {
        setUploadProgress(100);
        await AsyncStorage.removeItem('signupPayload');
        
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1200);
      } else {
        setUploadProgress(0);
      }
    } catch (err: any) {
      console.log('Upload error:', err);
      handleResponse({ response: err?.response ?? err });
      setUploadProgress(0);
    } finally {
      setLoading(false);
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
    }
  };


  const VideoRequirements = () => (
    <View style={styles.requirements}>
      <Text style={[styles.requirementsTitle, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
        Dukeneye:
      </Text>
      <View style={styles.requirementList}>
        {[
          { icon: User, text: 'Utubwire amazina yawe' },
          { icon: MapPin, text: 'Utubwire umudugudu ukoreramo' },
          { icon: Target, text: 'Utubwire impamyabumenyi yawe n\'ubumenyi usanganywe' },
          { icon: Target, text: 'Vuga icyo witeze muri iri somo' },
          { icon: Clock, text: 'Ukoresheje, inyandiko, amajwi cyangwa n’amashusho utarengeje Iminota 2' }
        ].map((item, index) => (
          <View key={index} style={styles.requirementItem}>
            <item.icon size={14} color={themeColors.primary} />
            <Text style={[styles.requirementText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
              {item.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const ActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
        onPress={pickVideo}
        activeOpacity={0.7}
      >
        <Upload size={18} color={isDark ? '#cbd5e1' : '#64748b'} />
        <Text style={[styles.actionText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
          Hitamo Amashusho
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
        onPress={captureVideo}
        activeOpacity={0.7}
      >
        <Camera size={18} color="white" />
        <Text style={[styles.actionText, { color: 'white' }]}>
          Kora Amashusho
        </Text>
      </TouchableOpacity>
    </View>
  );

const BioMethodSelector = () => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const iconSize = isNarrow ? 14 : 16;
  const btnPaddingV = isNarrow ? 6 : 8;
  const btnMinWidth = isNarrow ? 86 : 104;

  const renderButton = (method: 'text' | 'audio' | 'video', Icon: any, label: string) => {
    const active = bioMethod === method;
    return (
      <TouchableOpacity
        key={method}
        onPress={() => setBioMethod(method)}
        activeOpacity={0.8}
        style={[
          styles.bioButton,
          { minWidth: btnMinWidth, paddingVertical: btnPaddingV },
          { backgroundColor: active ? themeColors.primary : (isDark ? '#334155' : '#f1f5f9') },
        ]}
      >
        <Icon size={iconSize} color={active ? '#fff' : (isDark ? '#cbd5e1' : '#64748b')} style={styles.bioButtonIcon} />
        <Text style={[styles.bioButtonText, { color: active ? '#fff' : (isDark ? '#cbd5e1' : '#64748b'), fontSize: isNarrow ? 12 : 13 }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.bioSelectorContainer}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderButton('text', Pencil, 'Andika')}
      {renderButton('audio', Mic, 'Amajwi')}
      {renderButton('video', VideoIcon, 'Amashusho')}
    </ScrollView>
  );
};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 8}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}> 
        {/* Enhanced Header */}
        <LinearGradient
          colors={isDark 
            ? [themeColors.primary, '#1e1b4b', '#0f172a'] 
            : [themeColors.primary, `${themeColors.primary}ee`, `${themeColors.primary}cc`]
          }
          style={styles.header}
        >
          <Animated.View 
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.headerMain}>
              <View style={[styles.headerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}> 
                <User2 size={32} color="white" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Dufashe kubamenya neza</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Main Content - Responsive Scroll */}
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingHorizontal: 20, 
            paddingBottom: insets.bottom + 40 
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.mainContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View className='gap-3'>
            {/* Requirements */}
            <VideoRequirements />

            {/* Bio Method Selector */}
            <BioMethodSelector />
</View>
            {/* Bio Input Area */}
            {bioMethod === 'text' && (
              <View style={{ marginBottom: 4 }}>

                <View style={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0', padding: 12 }}>
                  <TextInput
                    style={{ color: isDark ? '#f8fafc' : '#1e293b', fontFamily: 'Inter-Regular', minHeight: 160, textAlignVertical: 'top' }}
                    placeholder="Andika hano..."
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    multiline
                    value={bioText}
                    onChangeText={setBioText}
                    maxLength={500}
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}
            {/* In your UploadVideoScreen component, replace the audio section with: */}
{bioMethod === 'audio' && (
  <View style={{ marginBottom: 4 }}>
    <AudioRecorderPlayer 
      value={audio} 
      onChange={uri => setAudio(uri ?? undefined)}
      themeColors={themeColors}
      isDark={isDark}
    />
  </View>
)}
            {bioMethod === 'video' && (
              <View style={styles.uploadArea}>
                {!video ? (
                  <View style={styles.uploadSection}>
                    <View style={[
                      styles.uploadCard,
                      { 
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#e2e8f0'
                      }
                    ]}>
                      <View style={[styles.uploadIcon, { backgroundColor: `${themeColors.primary}15` }]}>
                        <VideoIcon size={40} color={themeColors.primary} />
                      </View>
                      <View className='mb-4'>
                      <Text style={[styles.uploadTitle, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
                        Shyiramo Amashusho Yawe
                      </Text>
                      <Text style={[styles.uploadSubtitle, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
                        Hitamo cyangwa ukore amashusho nshya
                      </Text>
</View>
                    {/* Action Buttons */}
                    <ActionButtons />
                    </View>

                  </View>
                ) : (
                  <View style={styles.videoSection}>
                    {video && <VideoViewer uri={video.uri} />}

                    {/* Video Actions */}
                    <View style={styles.videoActions}>
                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                        onPress={pickVideo}
                        activeOpacity={0.7}
                      >
                        <RotateCcw size={16} color={isDark ? '#cbd5e1' : '#64748b'} />
                        <Text style={[styles.changeText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Hindura Amashusho</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: themeColors.primary }]}
                        onPress={captureVideo}
                        activeOpacity={0.7}
                      >
                        <Camera size={16} color="white" />
                        <Text style={[styles.recordText, { color: 'white' }]}>Kora Indi</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Progress Bar */}
            {uploadProgress > 0 && (
              <View style={styles.progressSection}>
                <View style={[styles.progressBar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}> 
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${uploadProgress}%`,
                        backgroundColor: themeColors.primary 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: isDark ? '#cbd5e1' : '#64748b' }]}> 
                  {Math.round(uploadProgress)}% Irikoherezwa
                  {uploadProgress === 100 && ' - Byakunze!'}
                </Text>
              </View>
            )}
          </Animated.View>
          
          {/* Submit Button always visible above nav bar */}
<View style={[styles.submitSection, {
  marginBottom: insets.bottom + 8,
}]}
>
  <Button
    title={
      loading ? "Kwiyandikisha..." : 
      uploadProgress === 100 ? "Byakunze!..." : 
      "Iyandikishe"
    }
    onPress={handleSubmit}
    variant="primary"
    style={styles.styledSubmitButton}
    loading={loading}
    disabled={loading || (!bioText && !audio && !video) || uploadProgress === 100}
    icon={uploadProgress === 100 ? <CheckCircle size={20} /> : <Image source={assets.loginIcon} style={{ width: 18, height: 18, tintColor: '#fff' }} />}
  />
  <TouchableOpacity
    style={styles.loginLink}
    onPress={() => router.back()}
    activeOpacity={0.7}
  >
    <Text style={[styles.loginText, { color: isDark ? '#cbd5e1' : '#334155' }]}> 
      {t('alreadyHaveAccount')}
      <Text style={{ color: isDark ? '#6366f1' : themeColors.primary, fontFamily: 'Inter-SemiBold' }}> {t('login')}</Text>
    </Text>
  </TouchableOpacity>
</View>
        </ScrollView>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: -40
  },
  header: {
    height: height * 0.22,
    paddingHorizontal: 20,
    paddingTop: height * 0.06,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 1,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 10,
  },
  requirements: {
    gap: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  requirementList: {
    gap: 12,
    paddingLeft: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  requirementText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 16,
  },
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 200,
  },
  uploadSection: {
    gap: 10,
  },
  uploadCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  videoSection: {
    gap: 16,
  },
  videoContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  thumbnailText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 5,
  },
  videoFileName: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  videoActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  recordText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  progressSection: {
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
submitSection: {
  alignItems: 'center',
},
styledSubmitButton: {
  width: '100%',
  borderRadius: 12,
  marginBottom: 14,
},
loginLink: {
  alignItems: 'center',
  marginTop: 2,
  paddingVertical: 4,
},
loginText: {
  fontSize: 15,
  fontFamily: 'Inter-Regular',
},
bioSelectorContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 8,
  flexWrap: 'nowrap',
},
bioSelectorWrap: {
  flexWrap: 'wrap',
},
bioButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 10,
  borderRadius: 12,
  marginHorizontal: 4,
},
bioButtonIcon: {
  marginRight: 6,
},
bioButtonText: {
  fontFamily: 'Inter-SemiBold',
},
});