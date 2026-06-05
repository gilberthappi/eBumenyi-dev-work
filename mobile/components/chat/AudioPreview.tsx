import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Pause, Trash2, Send } from 'lucide-react-native';
import { Waveform, PlayerState } from '@simform_solutions/react-native-audio-waveform';
import type { IWaveformRef } from '@simform_solutions/react-native-audio-waveform';

interface AudioPreviewProps {
  /** Local file URI recorded by expo-audio. */
  uri: string;
  isSending?: boolean;
  onDelete: () => void;
  onSend: () => void;
}

export function AudioPreview({ uri, isSending = false, onDelete, onSend }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef<IWaveformRef>(null);

  // Simform needs a plain path (no file:// scheme) for local files
  const path = uri.startsWith('file://') ? uri.slice('file://'.length) : uri;

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!isLoaded) return;
    if (isPlaying) {
      await waveformRef.current?.pausePlayer();
    } else {
      await waveformRef.current?.startPlayer();
    }
  };

  return (
    <View style={styles.container}>
      {/* Delete */}
      <TouchableOpacity onPress={onDelete} style={styles.trashBtn} activeOpacity={0.7} disabled={isSending}>
        <Trash2 size={22} color="#8696A0" />
      </TouchableOpacity>

      {/* Play / Pause — spinner while player is loading */}
      <TouchableOpacity
        onPress={handlePlayPause}
        style={[styles.playBtn, !isLoaded && styles.playBtnLoading]}
        activeOpacity={0.75}
        disabled={!isLoaded}
      >
        {!isLoaded
          ? <ActivityIndicator size="small" color="#fff" />
          : isPlaying
            ? <Pause size={18} color="#fff" fill="#fff" />
            : <Play size={18} color="#fff" fill="#fff" />}
      </TouchableOpacity>

      {/* Waveform + timer */}
      <View style={styles.middle}>
        <Waveform
          mode="static"
          ref={waveformRef}
          path={path}
          candleSpace={2}
          candleWidth={4}
          waveColor="#B0BEC5"
          scrubColor="#4D81D2"
          onChangeWaveformLoadState={(loading) => { if (!loading) setIsLoaded(true); }}
          onError={() => setIsLoaded(true)}
          onPlayerStateChange={(state) => setIsPlaying(state === PlayerState.playing)}
          onCurrentProgressChange={(currentProgress, songDuration) => {
            setPosition(currentProgress);
            if (songDuration > 0) setDuration(songDuration);
          }}
        />
        <Text style={styles.timer}>
          {isPlaying || position > 0 ? fmt(position) : duration > 0 ? fmt(duration) : '0:00'}
        </Text>
      </View>

      {/* Send */}
      <TouchableOpacity onPress={onSend} style={styles.sendBtn} activeOpacity={0.85} disabled={isSending}>
        {isSending
          ? <ActivityIndicator size="small" color="#fff" />
          : <Send size={20} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5DDD5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  trashBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4D81D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnLoading: {
    opacity: 0.7,
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  timer: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4D81D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
