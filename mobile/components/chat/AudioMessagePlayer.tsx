import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Play, Pause, Check, CheckCheck } from 'lucide-react-native';
import { Waveform, PlayerState } from '@simform_solutions/react-native-audio-waveform';
import type { IWaveformRef } from '@simform_solutions/react-native-audio-waveform';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { downloadAsync, cacheDirectory, getInfoAsync } from 'expo-file-system/legacy';

// Module-level singleton: the IWaveformRef that is currently playing (or null).
// Awaiting its pausePlayer() before starting a new player prevents the native
// "Error: startPlay…" that fires when two players overlap.
let _playingWaveform: IWaveformRef | null = null;

interface AudioMessagePlayerProps {
  url: string;
  messageId: string;
  isSent: boolean;
  /** Message timestamp — shown inline with the duration */
  timestamp?: any;
  /** readCount > 0 → blue double-tick, 0 → grey single tick (sent only) */
  readCount?: number;
  /** Override container style — use to fill a wider parent (e.g. community cards) */
  containerStyle?: ViewStyle;
}

export function AudioMessagePlayer({ url, messageId, isSent, timestamp, readCount, containerStyle }: AudioMessagePlayerProps) {
  const { activeAudioId, setActiveAudio } = useAudioPlayerContext();

  // Ref mirror so callbacks (onWaveformLoaded) can read the latest value without re-creating
  const activeAudioIdRef = useRef(activeAudioId);
  useEffect(() => { activeAudioIdRef.current = activeAudioId; }, [activeAudioId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // pendingPlay: user tapped play before the waveform finished loading
  const [pendingPlay, setPendingPlay] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  const waveformRef = useRef<IWaveformRef>(null);
  const isPlayingRef = useRef(false);
  // Guard so onWaveformLoaded never triggers startPlayer more than once per load
  const autoPlayFiredRef = useRef(false);

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const fmtTime = (ts: any): string => {
    try {
      if (!ts) return '';
      const d = ts instanceof Date ? ts : new Date(ts);
      if (isNaN(d.getTime())) return '';
      const h = d.getHours(), m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
    } catch { return ''; }
  };

  // Auto-download when the message appears — so the real waveform is ready immediately.
  // Each player uses a messageId-keyed filename so every Waveform instance gets its
  // own native player. Sharing a URL-derived path causes the native layer to share
  // one player across both the original and reshared post, making both waveforms
  // animate simultaneously.
  useEffect(() => {
    let cancelled = false;
    const download = async () => {
      try {
        const rawExt = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
        const ext = ['m4a', 'mp3', 'wav', 'ogg', 'aac'].includes(rawExt) ? rawExt : 'm4a';
        const destUri = `${cacheDirectory}audio_${messageId}.${ext}`;
        const info = await getInfoAsync(destUri);
        if (cancelled) return;
        if (info.exists) {
          setLocalPath(destUri.replace('file://', ''));
          return;
        }
        const result = await downloadAsync(url, destUri);
        if (cancelled) return;
        if (result.status === 200) {
          setLocalPath(result.uri.replace('file://', ''));
        } else {
          setDownloadError(true);
        }
      } catch {
        if (!cancelled) setDownloadError(true);
      }
    };
    download();
    return () => { cancelled = true; };
  }, [url, messageId]);

  // Keep React UI in sync: if the context says another player is active, update our icon.
  // Actual audio stopping is handled by _playingWaveform in handlePlayPause / onWaveformLoaded.
  useEffect(() => {
    if (activeAudioId !== messageId && isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, [activeAudioId, messageId]);

  // Clean up module-level ref when this instance unmounts
  useEffect(() => {
    return () => {
      if (_playingWaveform === waveformRef.current) {
        _playingWaveform = null;
      }
      isPlayingRef.current = false;
    };
  }, []);

  /** Stop the globally active player and wait for it to finish before starting a new one. */
  const stopGlobalPlayer = useCallback(async () => {
    const prev = _playingWaveform;
    if (prev && prev !== waveformRef.current) {
      _playingWaveform = null;
      try { await prev.pausePlayer(); } catch {}
    }
  }, []);

  // Called by Waveform when the audio file finishes loading (loading = false means ready)
  const onWaveformLoaded = useCallback(async (loading: boolean) => {
    if (loading) return;
    setIsLoaded(true);
    // Only auto-start if the user already tapped play while the file was loading
    // AND this player is still the active one (guards against tapping two players quickly)
    if (pendingPlay && !autoPlayFiredRef.current && activeAudioIdRef.current === messageId) {
      autoPlayFiredRef.current = true;
      setPendingPlay(false);
      try {
        await stopGlobalPlayer();
        _playingWaveform = waveformRef.current;
        await waveformRef.current?.startPlayer();
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch {
        _playingWaveform = null;
      }
    }
  }, [pendingPlay, messageId, stopGlobalPlayer]);

  const handlePlayPause = useCallback(async () => {
    setActiveAudio(messageId);

    if (!isLoaded) {
      // File still loading — stop any active player and flag to auto-play when ready
      await stopGlobalPlayer();
      setPendingPlay(true);
      return;
    }

    if (isPlayingRef.current) {
      // Pause self
      _playingWaveform = null;
      try { await waveformRef.current?.pausePlayer(); } catch {}
      isPlayingRef.current = false;
      setIsPlaying(false);
      setActiveAudio(null);
    } else {
      // Stop whichever player is currently active at the native level, then start self
      await stopGlobalPlayer();
      _playingWaveform = waveformRef.current;
      try {
        await waveformRef.current?.startPlayer();
        isPlayingRef.current = true;
        setIsPlaying(true);
      } catch {
        _playingWaveform = null;
      }
    }
  }, [isLoaded, setActiveAudio, messageId, stopGlobalPlayer]);

  const barUnplayed = isSent ? 'rgba(0,0,0,0.18)' : '#CBD5E1';
  // Spinner on the play button only when user has tapped and we're still not ready
  const showSpinner = pendingPlay && !isLoaded && !downloadError;
  const dummyBars = useMemo(() => placeholderBars(messageId, BAR_COUNT), [messageId]);

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={handlePlayPause}
        style={[styles.playBtn, showSpinner && styles.playBtnLoading]}
        activeOpacity={0.75}
        disabled={showSpinner}
      >
        {showSpinner
          ? <ActivityIndicator size="small" color="#fff" />
          : isPlaying
            ? <Pause size={17} color="#fff" fill="#fff" />
            : <Play size={17} color="#fff" fill="#fff" />}
      </TouchableOpacity>

      <View style={styles.right}>
        {localPath && !downloadError ? (
          // Real waveform — mounted as soon as the file is cached, not gated on user tap
          <View style={styles.waveformFixed}>
            <Waveform
              mode="static"
              ref={waveformRef}
              path={localPath}
              candleSpace={2}
              candleWidth={3}
              waveColor={barUnplayed}
              scrubColor="#4D81D2"
              containerStyle={{ flex: 1 }}
              onChangeWaveformLoadState={onWaveformLoaded}
              onError={() => { setIsLoaded(true); setPendingPlay(false); }}
              onPlayerStateChange={(state) => {
                // When two Waveform instances share the same cached file the native
                // layer fires callbacks on both. Guard by _playingWaveform so only
                // the active instance updates its play/pause icon.
                if (_playingWaveform !== waveformRef.current && state !== PlayerState.stopped) return;
                const playing = state === PlayerState.playing;
                isPlayingRef.current = playing;
                setIsPlaying(playing);
                if (state === PlayerState.stopped) {
                  if (_playingWaveform === waveformRef.current) _playingWaveform = null;
                  setActiveAudio(null);
                  setPosition(0);
                  autoPlayFiredRef.current = false;
                }
              }}
              onCurrentProgressChange={(currentProgress, songDuration) => {
                // Use isPlayingRef (component-local, set synchronously) rather than
                // _playingWaveform (module-level, has a timing gap at play-start).
                if (isPlayingRef.current) {
                  setPosition(currentProgress);
                }
                if (songDuration > 0) setDuration(songDuration);
              }}
            />
          </View>
        ) : downloadError ? (
          <View style={styles.errorBar} />
        ) : (
          // Placeholder shown while file is downloading in background
          <View style={styles.placeholderWave}>
            {dummyBars.map((h, i) => (
              <View
                key={i}
                style={[styles.placeholderBar, { height: h, backgroundColor: barUnplayed }]}
              />
            ))}
          </View>
        )}
        {/* Duration + timestamp + read ticks — all on one line */}
        <View style={styles.bottomRow}>
          <Text style={[styles.timer, { color: isSent ? '#374151' : '#6b7280' }]}>
            {isPlaying ? fmt(position) : duration > 0 ? fmt(duration) : '0:00'}
          </Text>
          {timestamp ? (
            <Text style={[styles.msgTime, { color: isSent ? '#667781' : '#8696A0' }]}>
              {fmtTime(timestamp)}
            </Text>
          ) : null}
          {isSent && (
            (readCount ?? 0) > 0
              ? <CheckCheck size={14} color="#53BDEB" />
              : <Check size={14} color="#8696A0" />
          )}
        </View>
      </View>
    </View>
  );
}

/** Deterministic per-message waveform so each audio looks unique before download.
 *  Range 4–44 px gives a realistic voice-like silhouette at the new 48 px container height. */
function placeholderBars(id: string, count: number): number[] {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  return Array.from({ length: count }, () => Math.round(4 + rand() * 40));
}

const BAR_COUNT = 30;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // Don't center the whole column — align play button to waveform row only (see right/waveformRow)
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 2,
    minWidth: 190,
    maxWidth: 240,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4D81D2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    // Vertically center the button against the 48px waveform row: (48 - 38) / 2 = 5
    marginTop: 5,
  },
  playBtnLoading: {
    opacity: 0.7,
  },
  right: {
    flex: 1,
    gap: 2,
  },
  waveformFixed: {
    height: 48,
    justifyContent: 'center',
  },
  placeholderWave: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  placeholderBar: {
    width: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  errorBar: {
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timer: {
    fontSize: 10,
    fontWeight: '500',
  },
  msgTime: {
    fontSize: 10,
    marginLeft: 'auto' as any,
  },
});
