import type { FC } from "react";
import { useRef, useEffect, useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  trimEnd?: number;
  onPlayPauseChange: (isPlaying: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onLoaded?: () => void;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const VideoPlayer: FC<VideoPlayerProps> = ({
  videoUrl,
  isPlaying,
  currentTime,
  playbackRate,
  trimEnd,
  onPlayPauseChange,
  onTimeUpdate,
  onDurationChange,
  onLoaded,
  className = "",
  videoRef: externalVideoRef,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !video.crossOrigin) {
      video.crossOrigin = "anonymous";
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => onPlayPauseChange(false));
    } else {
      video.pause();
    }
  }, [isPlaying, onPlayPauseChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    let actualVideoTime = currentTime * playbackRate;
    if (trimEnd !== undefined)
      actualVideoTime = Math.min(trimEnd, actualVideoTime);
    actualVideoTime = Math.min(video.duration, actualVideoTime);

    if (Math.abs(video.currentTime - actualVideoTime) > 0.1) {
      video.currentTime = actualVideoTime;
    }
  }, [currentTime, isLoaded, trimEnd, playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded || !trimEnd) return;

    const checkTrimEnd = () => {
      if (video.currentTime >= trimEnd) {
        video.pause();
        video.currentTime = trimEnd;
        onPlayPauseChange(false);
      }
    };

    video.addEventListener("timeupdate", checkTrimEnd);
    return () => video.removeEventListener("timeupdate", checkTrimEnd);
  }, [isLoaded, trimEnd, onPlayPauseChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoaded(true);
    const effectiveDuration = trimEnd !== undefined ? trimEnd : video.duration;
    onDurationChange(effectiveDuration);
    onLoaded?.();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    const effectiveDuration = trimEnd !== undefined ? trimEnd : video.duration;
    onDurationChange(effectiveDuration);
  }, [trimEnd, isLoaded, onDurationChange]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    let actualTime = video.currentTime;
    if (trimEnd !== undefined && actualTime >= trimEnd) {
      video.pause();
      onPlayPauseChange(false);
      actualTime = trimEnd;
      onTimeUpdate(trimEnd / playbackRate);
      return;
    }

    onTimeUpdate(Math.max(0, actualTime / playbackRate));
  };

  const handlePlay = () => onPlayPauseChange(true);
  const handlePause = () => onPlayPauseChange(false);
  const handleEnded = () => {
    onPlayPauseChange(false);
    const video = videoRef.current;
    if (video) video.currentTime = 0;
  };

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        controls={false}
        preload="metadata"
        crossOrigin="anonymous"
        className="w-full h-full object-contain block"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </div>
  );
};

export default VideoPlayer;
