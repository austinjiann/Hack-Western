import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import './Timeline.css';

// Timeline component with draggable playhead
interface TimelineProps {
	/** Current playback time in seconds */
	currentTime: number;
	/** Total video duration in seconds */
	duration: number;
	/** Callback when user seeks to a new time (click or drag) */
	onSeek: (time: number) => void;
	/** Optional trim end time (for visual indicator) */
	trimEnd?: number;
	/** Whether trim mode is active (clicking sets trim end) */
	isTrimMode?: boolean;
	/** Callback when trim end is set (in trim mode) */
	onTrimPointSet?: (time: number) => void;
	/** Optional className for custom styling */
	className?: string;
}

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const Timeline: FC<TimelineProps> = ({
	currentTime,
	duration,
	onSeek,
	trimEnd,
	isTrimMode = false,
	onTrimPointSet,
	className = '',
}) => {
	const timelineRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Calculate time markers (every 10 seconds, plus start and end)
	const timeMarkers: number[] = [];
	if (duration > 0) {
		// Always show start marker
		timeMarkers.push(0);
		
		// Add markers every 10 seconds (reduced from 5)
		for (let time = duration/20; time < duration; time += duration/20) {
			timeMarkers.push(time);
		}
		
		// Always show end marker (if not already included)
		if (duration % 10 !== 0) {
			timeMarkers.push(duration);
		}
	}

	const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

	// Convert mouse X position to time value
	const getTimeFromPosition = (clientX: number): number => {
		const timeline = timelineRef.current;
		if (!timeline || duration === 0) return 0;

		// Get timeline's position and width relative to viewport
		const rect = timeline.getBoundingClientRect();
		const x = clientX - rect.left; // X position relative to timeline
		const percentage = Math.max(0, Math.min(1, x / rect.width)); // Clamp between 0 and 1
		
		return percentage * duration;
	};

	// Start dragging playhead
	const handlePlayheadMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	// Handle timeline click (seek or set trim end)
	const handleTimelineClick = (e: React.MouseEvent) => {
		if ((e.target as HTMLElement).classList.contains('timeline-playhead')) {
			return;
		}

		const time = getTimeFromPosition(e.clientX);
		
		if (isTrimMode && onTrimPointSet) {
			// Set trim end only
			onTrimPointSet(time);
		} else {
			onSeek(time);
		}
	};

	// Handle drag operations
	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const time = getTimeFromPosition(e.clientX);
			onSeek(time);
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, onSeek, duration]);

	// Calculate trim indicator positions
	const trimEndPosition = trimEnd !== undefined ? (trimEnd / duration) * 100 : null;

	return (
		<div 
			className={`timeline ${className} ${isTrimMode ? 'timeline-trim-mode' : ''}`}
			ref={timelineRef}
			onClick={handleTimelineClick}
		>
			<div className="timeline-track">
				{trimEndPosition !== null && (
					<>
						<div
							className="timeline-trim-region"
							style={{
								left: '0%',
								width: `${trimEndPosition}%`,
							}}
						/>
						<div
							className="timeline-trim-marker timeline-trim-end"
							style={{ left: `${trimEndPosition}%` }}
						>
							<div className="timeline-trim-handle" />
							<div className="timeline-trim-label">End</div>
						</div>
					</>
				)}

				<div
					className="timeline-playhead"
					style={{ left: `${playheadPosition}%` }}
					onMouseDown={handlePlayheadMouseDown}
				>
					<div className="timeline-playhead-line" />
					<div className="timeline-playhead-handle" />
				</div>
			</div>

			<div className="timeline-markers">
				{timeMarkers.map((time) => (
					<div
						key={time}
						className="timeline-marker"
						style={{ left: `${(time / duration) * 100}%` }}
					>
						<div className="timeline-marker-line" />
						<div className="timeline-marker-label">
							{formatTime(time)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default Timeline;
