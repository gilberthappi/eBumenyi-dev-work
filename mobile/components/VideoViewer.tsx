import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

export default function VideoCard({ uri }: { uri: string }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
  });

  return (
    <View style={styles.card}>
      <VideoView
        style={[styles.video, { width: width - 40 }]}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  video: {
    height: 220,
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  playButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
  },
  playText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
