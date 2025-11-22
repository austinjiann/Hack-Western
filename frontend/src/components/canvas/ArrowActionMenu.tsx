import { useEditor, useValue } from 'tldraw';
import VideoEditorModal from '../video-editor/VideoEditorModal';
import { Spinner } from '@radix-ui/themes';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play } from 'lucide-react';

export const ArrowActionMenu = () => {
  const editor = useEditor();

  const info = useValue(
    'arrow info',
    () => {
      const selected = editor.getSelectedShapeIds();
      if (selected.length !== 1) return null;

      const shapeId = selected[0];
      const shape = editor.getShape(shapeId);
      if (!shape || shape.type !== 'arrow') return null;

      const bounds = editor.getShapePageBounds(shapeId);
      if (!bounds) return null;

      const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
      const viewportPoint = editor.pageToViewport(center);

      // Calculate size based on zoom to scale with tldraw
      // Half frame size in page coordinates: 480x270
      const pageWidth = 480;
      const pageHeight = 270;
      
      // Convert page size to viewport size using zoom
      const zoom = editor.getZoomLevel();
      const viewportWidth = pageWidth * zoom;
      const viewportHeight = pageHeight * zoom;

      // Get video metadata from arrow meta
      const videoUrl = shape.meta?.videoUrl as string | null;
      const status = shape.meta?.status as string | undefined;
      const timer = shape.meta?.timer as number | undefined;
      const duration = shape.meta?.duration as number | undefined;
      const trimEnd = shape.meta?.trimEnd as number | undefined;

      return { 
        id: shapeId, 
        x: viewportPoint.x, 
        y: viewportPoint.y,
        width: viewportWidth,
        height: viewportHeight,
        videoUrl,
        status,
        timer,
        duration,
        trimEnd,
      };
    },
    [editor]
  );

  const [videoFrameUrl, setVideoFrameUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load video thumbnail
  useEffect(() => {
    if (!info?.videoUrl) return;
    
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = info.videoUrl;

    const captureFrame = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setVideoFrameUrl(dataUrl);
    };

    video.addEventListener('loadeddata', () => {
      // seek to 1s for thumbnail
      video.currentTime = Math.min(1, video.duration / 2);
    });

    video.addEventListener('seeked', captureFrame);

    video.load();

    return () => {
      video.removeEventListener('seeked', captureFrame);
      video.removeEventListener('loadeddata', () => {});
    };
  }, [info?.videoUrl]);

  if (!info) return null;

  // Show different UI based on status
  if (info.status === 'pending') {
    return (
      <div
        style={{
          position: 'absolute',
          top: info.y - 40,
          left: info.x,
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          pointerEvents: 'auto',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center px-4 py-2 bg-white rounded-lg shadow-lg border-2 border-black">
          <Spinner size="2" />
          <span className="ml-2 font-semibold">Generating... {info.timer || 0}s</span>
        </div>
      </div>
    );
  }

  if (info.status === 'error') {
    return (
      <div
        style={{
          position: 'absolute',
          top: info.y - 40,
          left: info.x,
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          pointerEvents: 'auto',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center px-4 py-2 bg-red-50 rounded-lg shadow-lg border-2 border-red-500">
          <span className="font-semibold text-red-600">Error ✗</span>
        </div>
      </div>
    );
  }

  // Only show play button if video is ready
  if (!info.videoUrl) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: info.y,
        left: info.x,
        transform: 'translate(-50%, -50%)',
        zIndex: 2000,
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div 
        style={{ 
          position: 'relative',
          width: info.width, 
          height: info.height, 
          borderRadius: 12, 
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(true)}
      >
        {videoFrameUrl ? (
          <img
            src={videoFrameUrl}
            alt="video thumbnail"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#e5e7eb',
          }}>
            <Spinner size="3" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: Math.min(Math.max(40, info.width * 0.15), 80),
            height: Math.min(Math.max(40, info.width * 0.15), 80),
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s ease',
            pointerEvents: 'none',
          }}
          className="hover:scale-110"
        >
          <Play 
            size={Math.min(Math.max(18, info.width * 0.08), 36)}
            fill="currentColor"
            style={{ marginLeft: '10%' }}
          />
        </div>
      </div>

      {isOpen && createPortal(
        <VideoEditorModal
          isOpen={isOpen}
          videoClip={{
            id: info.id,
            videoUrl: info.videoUrl || '',
            duration: info.duration || 5,
            trimEnd: info.trimEnd,
          }}
          onClose={() => setIsOpen(false)}
          onTrim={(_clipId, endTime, newVideoUrl) => {
            // Update arrow meta with new trim end and video URL if provided
            const arrow = editor.getShape(info.id);
            if (arrow) {
              editor.updateShapes([{
                id: info.id,
                type: 'arrow',
                meta: {
                  ...arrow.meta,
                  trimEnd: endTime,
                  videoUrl: newVideoUrl || info.videoUrl || '', // Use new URL if provided, otherwise keep existing
                  duration: endTime, // Update duration to trimmed length
                }
              }]);
            }
          }}
          onDelete={() => {
            editor.deleteShapes([info.id]);
            setIsOpen(false);
          }}
        />,
        document.body
      )}
    </div>
  );
};
