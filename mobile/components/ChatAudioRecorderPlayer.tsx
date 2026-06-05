import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { Mic, Play, Pause, Send, Trash2} from 'lucide-react-native';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, useAudioPlayer, setAudioModeAsync, AudioModule } from 'expo-audio';

interface Props {
  onChange?: (uri: string | null) => void;
  onActiveChange?: (active: boolean) => void;
  themeColors?: { primary?: string; secondary?: string };
  isDark?: boolean;
}

export default function ChatAudioRecorderPlayer({ onChange, onActiveChange, themeColors = { primary: '#3363AD' }, isDark = false }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const player = useAudioPlayer(audioUri);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordTime, setRecordTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const [showRecorder, setShowRecorder] = useState(false);

  // Notify parent when recorder popup or draft audio changes
  useEffect(() => {
    try {
      const active = showRecorder || !!audioUri || recorderState.isRecording;
      onActiveChange?.(active);
    } catch {
      // ignore
    }
  }, [showRecorder, audioUri, recorderState.isRecording, onActiveChange]);

  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert('Permission', 'Microphone permission is required to record audio');
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      } catch {
        console.log('Audio permission/setup error');
      }
    })();
  }, []);

  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      intervalRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } else {
      pulse.setValue(1);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setRecordTime(0);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [recorderState.isRecording, pulse]);

  useEffect(() => {
    setIsPlaying(player.playing);
    if (player.duration) {
      setDuration(Math.floor(player.duration));
    }
  }, [player.playing, player.duration]);

  useEffect(() => {
    if (isPlaying && duration > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startTimeRef.current = Date.now() - (accumulatedRef.current * 1000);
      intervalRef.current = setInterval(() => {
        const t = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (t <= duration) {
          setPlayTime(t);
        } else {
          setPlayTime(duration);
          setIsPlaying(false);
          accumulatedRef.current = 0;
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        }
      }, 250);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isPlaying, duration]);

  const startRecording = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setAudioUri(null);
      onChange?.(null);
    } catch (e) {
      console.log('startRecording error', e);
      Alert.alert('Recording Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setAudioUri(uri);
      setShowRecorder(true);
    } catch (e) {
      console.log('stopRecording error', e);
      Alert.alert('Recording Error', 'Could not stop recording');
    }
  };

  const sendRecorded = () => {
    if (!audioUri) return;
    try {
      onChange?.(audioUri);
    } catch (e) {
      console.log('sendRecorded error', e);
    }
    setAudioUri(null);
    setIsPlaying(false);
    setShowRecorder(false);
    setPlayTime(0);
    setDuration(0);
    accumulatedRef.current = 0;
  };

  const onPlayPause = async () => {
    if (!audioUri) return;
    try {
      if (player.playing) {
        // pausing: compute elapsed since we started playing and accumulate
        // use startTimeRef to calculate precise elapsed ms
        await player.pause();
        if (startTimeRef.current) {
          const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
          accumulatedRef.current = Math.floor((accumulatedRef.current || 0) + elapsedSec);
          setPlayTime(Math.floor(accumulatedRef.current));
        }
        setIsPlaying(false);
      } else {
        // starting/resuming
        // if already at end, reset
        if (playTime >= duration && duration > 0) {
          setPlayTime(0);
          accumulatedRef.current = 0;
        }
        await player.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('play error', e);
    }
  };

  const onDelete = () => {
    if (player.playing) player.pause();
    setAudioUri(null);
    setIsPlaying(false);
    accumulatedRef.current = 0;
  };


  const format = (s: number) => {
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const sec = Math.floor(s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  };

  const openRecorder = async () => {
    setShowRecorder(true);
    setTimeout(() => startRecording(), 100);
  };

  const cancelRecording = async () => {
    try {
      if (recorderState.isRecording) {
        await recorder.stop();
      }
    } catch (e) {
      console.log('cancelRecording stop error', e);
    }
    setAudioUri(null);
    onChange?.(null);
    setShowRecorder(false);
  };

  return (
    <View style={styles.container}>
      {/* Mic button - tap to open popup recorder */}
      {/* show mic only when there's no draft audio and not currently recording or previewing */}
      {!audioUri && !recorderState.isRecording && !showRecorder && (
        <View style={styles.holdButtonWrapper}>
          <TouchableOpacity activeOpacity={0.8} onPress={openRecorder}>
            {/* Mic button: no animation here, keep static */}
            <View style={[styles.holdButton, { backgroundColor: themeColors.primary }]}>
              <Mic size={18} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Recording/playback controls */}
      {(showRecorder || recorderState.isRecording || audioUri) && (
        <View style={[
          styles.playbackRow,
          isDark && styles.playbackRowDark
        ]}>
          <TouchableOpacity
            onPress={recorderState.isRecording ? stopRecording : onPlayPause}
            activeOpacity={0.9}
          >
            {/* Animate the play/pause button instead of the mic when recording */}
            <Animated.View style={[styles.playPause, { backgroundColor: themeColors.primary, transform: [{ scale: recorderState.isRecording ? pulse : 1 }] }]}> 
              {recorderState.isRecording ? (
                <Pause size={20} color="white" />
              ) : isPlaying ? (
                <Pause size={20} color="white" />
              ) : (
                <Play size={20} color="white" />
              )}
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.timeContainer}>
            <Text style={[
              styles.durationText,
              isDark && styles.durationTextDark
            ]}>
              {recorderState.isRecording
                ? format(recordTime)
                : isPlaying || playTime > 0
                  ? `${format(playTime)} / ${format(duration || Math.floor(player.duration || 0))}`
                  : format(duration || Math.floor(player.duration || 0))
              }
            </Text>
          </View>

          <View style={styles.actionsRight}>
            {audioUri ? (
              <>
                <TouchableOpacity 
                  onPress={sendRecorded} 
                  style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
                >
                  <Send size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { onDelete(); setShowRecorder(false); }} 
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </>
            ) : recorderState.isRecording ? (
              <TouchableOpacity 
                onPress={cancelRecording} 
                style={styles.deleteButton}
              >
                <Trash2 size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={startRecording} 
                style={[styles.recordButton, { backgroundColor: themeColors.primary }]}
              >
                <Mic size={18} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    minHeight: 52
  },
  
  holdButtonWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8
  },
  
  micButton: {
    padding: 4
  },
  
  holdButton: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  
  uploadBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  
  playbackRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minWidth: 280,
    flex: 1
  },
  
  playbackRowDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563'
  },
  
  playPause: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  
  timeContainer: {
    flex: 1,
    alignItems: 'center'
  },
  
  durationText: { 
    fontSize: 14, 
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center'
  },
  
  durationTextDark: {
    color: '#F9FAFB'
  },
  
  actionsRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8
  },
  
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  
  recordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  
  deleteButton: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent'
  }
});