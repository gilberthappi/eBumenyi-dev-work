import { useEffect, useCallback } from 'react';
import * as Updates from 'expo-updates';
import { AppState } from 'react-native';

export default function UpdateManager() {
  const checkForUpdates = useCallback(async () => {
    try {
      console.log('🔍 UpdateManager: Checking for updates...');
      
      const update = await Updates.checkForUpdateAsync();
      console.log('📦 Update available?', update.isAvailable);
      
      if (update.isAvailable) {
        console.log('✅ UPDATE FOUND! Manifest:', update.manifest);
        console.log('📥 Downloading update...');
        
        await Updates.fetchUpdateAsync();
        console.log('✅ Update downloaded! Reloading app...');
        
        // Wait 2 seconds then reload
        setTimeout(() => {
          Updates.reloadAsync();
        }, 2000);
      } else {
        console.log('✅ App is up to date');
      }
    } catch (error: any) {
      console.log('❌ Update error:', error.message);
      console.log('❌ Error details:', error);
    }
  }, []);

  const handleAppStateChange = useCallback((nextAppState: string) => {
    console.log('📱 App state changed:', nextAppState);
    if (nextAppState === 'active') {
      console.log('🔄 App came to foreground, checking for updates');
      setTimeout(() => {
        checkForUpdates();
      }, 1000);
    }
  }, [checkForUpdates]);

  useEffect(() => {
    console.log('🔄 UpdateManager: Component mounted');
    console.log('📱 Channel:', Updates.channel);
    console.log('📊 Runtime Version:', Updates.runtimeVersion);
    
    // Check for updates when app starts
    setTimeout(() => {
      checkForUpdates();
    }, 3000); // Wait 3 seconds after app opens
    
    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  return null;
}