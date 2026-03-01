import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditor } from '../state/EditorContext';
import { setCurrentTime, setDuration, setPlaying } from '../state/actions';
import { PlayerFactory, type VideoPlayerAdapter } from 'js-cloudimage-video-hotspot';

export function useVideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null!);
  const adapterRef = useRef<VideoPlayerAdapter | null>(null);
  const { state, dispatch } = useEditor();
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !state.videoUrl) {
      setPlayerReady(false);
      return;
    }

    // Destroy previous adapter
    if (adapterRef.current) {
      adapterRef.current.destroy();
      adapterRef.current = null;
      container.innerHTML = '';
    }

    const adapter = PlayerFactory.create({ src: state.videoUrl });
    adapterRef.current = adapter;

    const onTimeUpdate = () => dispatch(setCurrentTime(adapter.getCurrentTime()));
    const onDurationChange = () => dispatch(setDuration(adapter.getDuration() || 0));
    const onPlay = () => dispatch(setPlaying(true));
    const onPause = () => dispatch(setPlaying(false));
    const onLoaded = () => {
      setPlayerReady(true);
      dispatch(setDuration(adapter.getDuration() || 0));
    };

    adapter.on('timeupdate', onTimeUpdate);
    adapter.on('durationchange', onDurationChange);
    adapter.on('play', onPlay);
    adapter.on('pause', onPause);
    adapter.on('loadedmetadata', onLoaded);

    adapter.mount(container);

    return () => {
      adapter.off('timeupdate', onTimeUpdate);
      adapter.off('durationchange', onDurationChange);
      adapter.off('play', onPlay);
      adapter.off('pause', onPause);
      adapter.off('loadedmetadata', onLoaded);
      adapter.destroy();
      adapterRef.current = null;
      setPlayerReady(false);
    };
  }, [state.videoUrl, dispatch]);

  const play = useCallback(() => { adapterRef.current?.play(); }, []);
  const pause = useCallback(() => { adapterRef.current?.pause(); }, []);
  const seek = useCallback((time: number) => {
    adapterRef.current?.seek(time);
  }, []);
  const togglePlay = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    adapter.isPaused() ? adapter.play() : adapter.pause();
  }, []);

  return {
    containerRef,
    playerReady,
    videoUrl: state.videoUrl,
    currentTime: state.currentTime,
    duration: state.duration,
    playing: state.playing,
    play,
    pause,
    seek,
    togglePlay,
  };
}
