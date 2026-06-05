import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AudioPlayerContextType {
  /** ID of the audio message currently playing (null = nothing). */
  activeAudioId: string | null;
  /** Claim playback; automatically stops the previous player via the effect in each AudioMessagePlayer. */
  setActiveAudio: (id: string | null) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  activeAudioId: null,
  setActiveAudio: () => {},
});

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const setActiveAudio = useCallback((id: string | null) => {
    setActiveAudioId(id);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ activeAudioId, setActiveAudio }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext() {
  return useContext(AudioPlayerContext);
}
