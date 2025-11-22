import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Button, Flex, Text, IconButton, Box } from '@radix-ui/themes';
import { Play, Pause, X, Scissors, Trash2 } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import './VideoEditorModal.css';


interface VideoEditorModalProps {
	/** Whether the modal is currently open/visible */
	isOpen: boolean;
	/** Video clip data */
	videoClip: {
		id: string;
		videoUrl: string;
		duration: number;
		title?: string;
		trimEnd?: number;
	};
	/** Callback to close the modal */
	onClose: () => void;
	/** Callback when delete action is triggered */
	onDelete?: (clipId: string) => void;
	/** Callback when trim action is triggered (only end time, optional new video URL) */
	onTrim?: (clipId: string, endTime: number, newVideoUrl?: string) => void;
}

const VideoEditorModal: FC<VideoEditorModalProps> = ({
	isOpen,
	videoClip,
	onClose,
	onDelete,
	onTrim,
}) => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [actualDuration, setActualDuration] = useState(videoClip.duration || 0);
	const videoElementRef = useRef<HTMLVideoElement>(null);
	const [isTrimMode, setIsTrimMode] = useState(false);
	const [tempTrimEnd, setTempTrimEnd] = useState<number | undefined>(videoClip.trimEnd);
	
	// Calculate effective duration (accounting for trim end only)
	// Only use videoClip.trimEnd (applied trim), not tempTrimEnd (preview)
	const effectiveDuration = videoClip.trimEnd !== undefined 
		? videoClip.trimEnd 
		: actualDuration;

	// Close modal on ESC key
	useEffect(() => {
		if (!isOpen) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Reset video state when modal opens or video changes
	useEffect(() => {
		if (isOpen) {
			setIsPlaying(false);
			setCurrentTime(0);
			setTempTrimEnd(videoClip.trimEnd);
		}
	}, [isOpen, videoClip.id, videoClip.trimEnd]);


	const handlePlayPauseChange = useCallback((playing: boolean) => {
		setIsPlaying(playing);
	}, []);

	const handleTimeUpdate = useCallback((time: number) => {
		setCurrentTime(time);
	}, []);

	const handleDurationChange = useCallback((newDuration: number) => {
		// VideoPlayer reports effective duration (trimEnd if set, otherwise full duration)
		// Store it - this is what we'll use for display
		setActualDuration(newDuration);
	}, []);

	// Handle timeline seek (clamps to effective duration or preview trim end in trim mode)
	const handleSeek = useCallback((time: number) => {
		// In trim mode, allow seeking up to tempTrimEnd for preview
		// Otherwise, clamp to applied trimEnd or actualDuration
		const maxTime = isTrimMode 
			? (tempTrimEnd !== undefined ? tempTrimEnd : actualDuration)
			: (videoClip.trimEnd !== undefined ? videoClip.trimEnd : actualDuration);
		const clampedTime = Math.max(0, Math.min(time, maxTime));
		setCurrentTime(clampedTime);
	}, [isTrimMode, tempTrimEnd, videoClip.trimEnd, actualDuration]);

	const handlePlayPauseClick = () => {
		setIsPlaying(!isPlaying);
	};

	const handleDelete = () => {
		onDelete?.(videoClip.id);
		onClose();
	};

	const handleTrim = () => {
		if (isTrimMode) {
			// Apply trim - only end time
			// Store trim metadata - the video player will handle displaying correctly
			// The video will stop at trimEnd and display the correct duration
			if (tempTrimEnd !== undefined && tempTrimEnd > 0 && tempTrimEnd <= actualDuration) {
				onTrim?.(videoClip.id, tempTrimEnd);
			}
			setIsTrimMode(false);
		} else {
			// Enter trim mode - initialize with current trim end or full duration
			setTempTrimEnd(videoClip.trimEnd || actualDuration);
			setIsTrimMode(true);
		}
	};

	const handleTrimPointSet = (time: number) => {
		// Only allow setting trim end (must be between 0 and actualDuration)
		const clampedTime = Math.max(0, Math.min(time, actualDuration));
		setTempTrimEnd(clampedTime);
	};

	// Format time for display (MM:SS)
	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	};

	if (!isOpen) return null;

	return (
		<Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Dialog.Content 
				style={{ 
					maxWidth: '95vw',
					maxHeight: '95vh',
					width: '95vw',
					height: '95vh',
					padding: 0,
					background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
					fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
					overflow: 'hidden',
				}}
			>
				<Flex direction="column" style={{ height: '100%' }}>
					{/* Header */}
					<Flex 
						align="center" 
						justify="between" 
						px="6" 
						py="4"
						style={{
							background: 'rgba(255, 255, 255, 0.95)',
							backdropFilter: 'blur(10px)',
							borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
						}}
					>
						<Text size="5" weight="bold" style={{ 
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							fontFamily: "'Inter', sans-serif",
						}}>
							{videoClip.title || 'Video Editor'}
						</Text>
						<Dialog.Close>
							<IconButton 
								size="3" 
								variant="ghost" 
								style={{ cursor: 'pointer' }}
							>
								<X size={20} />
							</IconButton>
						</Dialog.Close>
					</Flex>

					{/* Body */}
					<Flex 
						direction="column" 
						gap="4" 
						p="6" 
						style={{ flex: 1, overflow: 'hidden' }}
					>
						{/* Video Preview */}
						<Box 
							style={{
								flex: 7,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								background: '#000',
								borderRadius: '16px',
								overflow: 'hidden',
								position: 'relative',
								boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
								maxWidth: '60%',
								margin: '0 auto',
								width: '100%',
							}}
						>
							<VideoPlayer
								videoUrl={videoClip.videoUrl}
								isPlaying={isPlaying}
								currentTime={currentTime}
								playbackRate={1.0}
								trimEnd={videoClip.trimEnd} // Only use applied trim, not preview
								onPlayPauseChange={handlePlayPauseChange}
								onTimeUpdate={(time) => {
									// In trim mode, allow full video playback for preview
									// Otherwise, clamp to applied trim
									const maxTime = isTrimMode 
										? actualDuration // Allow full playback in trim mode
										: (videoClip.trimEnd !== undefined ? videoClip.trimEnd : actualDuration);
									const clampedTime = Math.min(time, maxTime);
									setCurrentTime(clampedTime);
								}}
								onDurationChange={handleDurationChange}
								videoRef={videoElementRef}
							/>
						</Box>

						{/* Controls Container */}
						<Flex direction="column" gap="4" style={{ flex: 3 }}>
							{/* Toolbar */}
							<Flex 
								gap="2" 
								align="center" 
								justify="center"
								p="4"
								style={{
									background: 'rgba(255, 255, 255, 0.95)',
									backdropFilter: 'blur(10px)',
									borderRadius: '12px',
									boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
								}}
							>
								<Button 
									variant="soft" 
									size="3"
									onClick={handleTrim}
									color={isTrimMode ? 'blue' : undefined}
									style={{ cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
								>
									<Scissors size={18} />
									{isTrimMode ? 'Apply Trim' : 'Trim End'}
								</Button>
								<Button 
									variant="soft" 
									size="3"
									color="red"
									onClick={handleDelete}
									style={{ cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
								>
									<Trash2 size={18} />
									Delete
								</Button>
							</Flex>

							{/* Timeline */}
							<Box>
								<Timeline
									currentTime={currentTime}
									duration={actualDuration}
									onSeek={handleSeek}
									trimEnd={isTrimMode ? tempTrimEnd : videoClip.trimEnd}
									isTrimMode={isTrimMode}
									onTrimPointSet={handleTrimPointSet}
								/>
							</Box>

							{/* Playback Controls */}
							<Flex align="center" justify="center" gap="4">
								<IconButton
									size="4"
									onClick={handlePlayPauseClick}
									style={{ 
										cursor: 'pointer',
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										color: 'white',
										width: '64px',
										height: '64px',
										borderRadius: '50%',
										boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
									}}
								>
									{isPlaying ? <Pause size={24} /> : <Play size={24} />}
								</IconButton>
								<Text 
									size="4" 
									weight="medium"
									style={{ 
										fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
										color: '#1a1a1a',
									}}
									>
										{formatTime(currentTime)} / {formatTime(isTrimMode && tempTrimEnd !== undefined ? tempTrimEnd : effectiveDuration)}
									</Text>
							</Flex>
						</Flex>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export default VideoEditorModal;
