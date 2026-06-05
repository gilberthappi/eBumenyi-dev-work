import React, { useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidMeetingUrl } from '@/utils/deepLinking';

export default function MeetingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Extract meeting URL from params
  const meetingUrl = React.useMemo(() => {
    const meetingId = typeof params.meetingId === 'string' ? params.meetingId : null;
    const fullUrl = typeof params.fullUrl === 'string' ? params.fullUrl : null;

    if (fullUrl && isValidMeetingUrl(fullUrl)) {
      return fullUrl;
    }

    if (meetingId) {
      // Construct the full meeting URL
      return `https://meeting.ebumenyi.online/meeting/${meetingId}`;
    }

    return null;
  }, [params.meetingId, params.fullUrl]);

  // Validate meeting URL format
  const isValidMeetingUrl_check = React.useMemo(() => {
    if (!meetingUrl) return false;
    return isValidMeetingUrl(meetingUrl);
  }, [meetingUrl]);

  // Handle when invalid URL is detected
  useEffect(() => {
    if ((!meetingUrl || !isValidMeetingUrl_check) && meetingUrl) {
      setTimeout(() => {
        handleCloseMeeting();
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidMeetingUrl_check, meetingUrl]);

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    setError(error.nativeEvent.description || 'Failed to load meeting');
    setIsLoading(false);
  };

  const handleCloseMeeting = () => {
    Alert.alert(
      'Sohoka mu nama',
      'Urumva neza ko ushaka kwiva mu nama',
      [
        {
          text: 'Oya',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Sohoka',
          onPress: () => router.back(),
          style: 'destructive',
        },
      ]
    );
  };

  if (!meetingUrl || !isValidMeetingUrl_check) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header Bar with Close Button - Always visible */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 4,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
      </View>

      {/* WebView Container */}
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        {isValidMeetingUrl_check && meetingUrl && (
          <WebView
            source={{ uri: meetingUrl }}
            style={{ flex: 1 }}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            startInLoadingState={true}
            renderLoading={() => (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5',
                }}
              >
                <ActivityIndicator size="large" color="#3363AD" />
              </View>
            )}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            useWebKit={true}
            // Allow accessing microphone and camera
            onShouldStartLoadWithRequest={() => true}
          />
        )}
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <ActivityIndicator size="large" color="#3363AD" />
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: '#ff6b6b',
          }}
        >
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={{ color: '#fff', textAlign: 'center', fontSize: 14 }}>
              {error}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}