import type { FC } from 'react';
import { useRef, useEffect, useState } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
	/** URL to the video file */
	videoUrl: string;
	/** Whether video is currently playing */
	isPlaying: boolean;
	/** Current playback time in seconds (controlled by parent) */
	currentTime: number;
	/** Playback speed multiplier (1.0 = normal, 2.0 = 2x speed) */
	playbackRate: number;
	/** Optional trim end time in seconds (for client-side trimming) */
	trimEnd?: number;
	/** Callback when play/pause state changes */
	onPlayPauseChange: (isPlaying: boolean) => void;
	/** Callback when current time changes (fires frequently during playback) */
	onTimeUpdate: (time: number) => void;
	/** Callback when video duration is loaded */
	onDurationChange: (duration: number) => void;
	/** Callback when video is ready to play */
	onLoaded?: () => void;
	/** Optional className for custom styling */
	className?: string;
	/** Optional ref to expose video element */
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
	className = '',
	videoRef: externalVideoRef,
}) => {
	const internalVideoRef = useRef<HTMLVideoElement>(null);
	const videoRef = externalVideoRef || internalVideoRef;
	const [isLoaded, setIsLoaded] = useState(false);

	// Set crossOrigin before video loads (for CORS)
	useEffect(() => {
		const video = videoRef.current;
		if (video && !video.crossOrigin) {
			video.crossOrigin = 'anonymous';
		}
	}, []);

	// Sync playback state with video element
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.play().catch((error) => {
				console.error('Error playing video:', error);
				onPlayPauseChange(false);
			});
		} else {
			video.pause();
		}
	}, [isPlaying, onPlayPauseChange]);

	// Sync currentTime with video element (accounts for trim end and speed)
	useEffect(() => {
		const video = videoRef.current;
		if (!video || !isLoaded) return;

		let actualVideoTime = currentTime * playbackRate;
		
		// Clamp to trim end if specified (this is the effective duration)
		if (trimEnd !== undefined) {
			actualVideoTime = Math.min(trimEnd, actualVideoTime);
		}

		// Also clamp to video duration to prevent seeking beyond video
		actualVideoTime = Math.min(video.duration, actualVideoTime);

		const timeDifference = Math.abs(video.currentTime - actualVideoTime);
		if (timeDifference > 0.1) {
			video.currentTime = actualVideoTime;
		}
	}, [currentTime, isLoaded, trimEnd, playbackRate]);
	
	// Ensure video stops at trimEnd
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
		
		video.addEventListener('timeupdate', checkTrimEnd);
		return () => video.removeEventListener('timeupdate', checkTrimEnd);
	}, [isLoaded, trimEnd, onPlayPauseChange]);

	// Sync playbackRate with video element
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		video.playbackRate = playbackRate;
	}, [playbackRate]);

	const handleLoadedMetadata = () => {
		const video = videoRef.current;
		if (!video) return;

		setIsLoaded(true);
		// Report effective duration (trimEnd if specified, otherwise full duration)
		// This ensures the UI shows the correct duration
		const effectiveDuration = trimEnd !== undefined ? trimEnd : video.duration;
		onDurationChange(effectiveDuration);
		onLoaded?.();
	};
	
	// Update duration when trimEnd changes
	useEffect(() => {
		const video = videoRef.current;
		if (!video || !isLoaded) return;
		
		const effectiveDuration = trimEnd !== undefined ? trimEnd : video.duration;
		onDurationChange(effectiveDuration);
	}, [trimEnd, isLoaded, onDurationChange]);

	// Handle time update (convert to effective time, account for trim end and speed)
	const handleTimeUpdate = () => {
		const video = videoRef.current;
		if (!video) return;

		let actualTime = video.currentTime;
		
		// Clamp to trim end if specified
		if (trimEnd !== undefined) {
			if (actualTime >= trimEnd) {
				video.pause();
				onPlayPauseChange(false);
				actualTime = trimEnd; // Clamp to trim end
				// Report the effective time (which is trimEnd / playbackRate)
				const effectiveTime = trimEnd / playbackRate;
				onTimeUpdate(effectiveTime);
				return;
			}
		}

		// Convert to effective time (accounting for speed)
		// The effective time is just the actual time divided by playback rate
		// Since we're trimming from the start, the effective time equals actual time
		const effectiveTime = actualTime / playbackRate;
		onTimeUpdate(Math.max(0, effectiveTime));
	};

	const handlePlay = () => {
		onPlayPauseChange(true);
	};

	const handlePause = () => {
		onPlayPauseChange(false);
	};

	const handleEnded = () => {
		onPlayPauseChange(false);
		const video = videoRef.current;
		if (video) {
			video.currentTime = 0;
		}
	};

	return (
		<div className={`video-player ${className}`}>
			<video
				ref={videoRef}
				src={videoUrl}
				className="video-player-element"
				controls={false}
				preload="metadata"
				crossOrigin="anonymous"
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'contain',
				}}
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