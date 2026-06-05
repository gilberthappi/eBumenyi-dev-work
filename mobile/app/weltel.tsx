import React from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, PanResponder } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { buildWeltelLoginUrl } from '@/services/weltel.api';

export default function WelTelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    loginUrl?: string | string[];
    jwtKey?: string | string[];
  }>();

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const loaderTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const weltelUri = React.useMemo(() => {
    const loginUrlParam = Array.isArray(params.loginUrl)
      ? params.loginUrl[0]
      : params.loginUrl;
    if (loginUrlParam) {
      return loginUrlParam;
    }

    const jwtKey = Array.isArray(params.jwtKey) ? params.jwtKey[0] : params.jwtKey;
    if (jwtKey) {
      return buildWeltelLoginUrl(jwtKey);
    }

    return null;
  }, [params.loginUrl, params.jwtKey]);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    if (loaderTimeoutRef.current) {
      clearTimeout(loaderTimeoutRef.current);
      loaderTimeoutRef.current = null;
    }
  }, []);

  const goToSplashAuth = React.useCallback(() => {
    router.replace('/auth/splash-auth');
  }, [router]);

  const swipeToCloseResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 18 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderRelease: (_, gestureState) => {
          const strongVerticalSwipe =
            Math.abs(gestureState.dy) > 90 && Math.abs(gestureState.vy) > 0.35;
          if (strongVerticalSwipe) {
            goToSplashAuth();
          }
        },
      }),
    [goToSplashAuth],
  );

  React.useEffect(() => {
    if (!weltelUri) {
      setError('WelTel login link is missing. Open WelTel from the home screen again.');
      setIsLoading(false);
      return;
    }

    loaderTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 12000);

    return () => {
      if (loaderTimeoutRef.current) {
        clearTimeout(loaderTimeoutRef.current);
      }
    };
  }, [weltelUri]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {weltelUri ? (
          <WebView
            source={{ uri: weltelUri }}
            style={{ flex: 1 }}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => stopLoading()}
            onLoadEnd={() => stopLoading()}
            onLoadProgress={({ nativeEvent }) => {
              if (nativeEvent.progress >= 0.9) {
                stopLoading();
              }
            }}
            onError={(event) => {
              setError(event.nativeEvent.description || 'Failed to load WelTel');
              stopLoading();
            }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            useWebKit={true}
          />
        ) : null}
      </View>

      {isLoading && weltelUri && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.35)',
          }}
        >
          <ActivityIndicator size="large" color="#3363AD" />
        </View>
      )}

      {error && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom,
            left: 0,
            right: 0,
            padding: 12,
            backgroundColor: '#ef4444',
          }}
        >
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>{error}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        {...swipeToCloseResponder.panHandlers}
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom + 8, 14),
          alignSelf: 'center',
          width: 170,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(0,0,0,0.02)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 34,
            height: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(0,0,0,0.12)',
          }}
        />
      </View>
    </View>
  );
}
