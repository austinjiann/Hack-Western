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
      const allShapes = editor.getCurrentPageShapes();
      const arrows = allShapes.filter(shape => shape.type === 'arrow');
      
      return arrows.map(shape => {
        const bounds = editor.getShapePageBounds(shape.id);
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

        return { 
          id: shape.id, 
          x: viewportPoint.x, 
          y: viewportPoint.y,
          width: viewportWidth,
          height: viewportHeight,
          videoUrl,
          status,
          timer,
        };
      }).filter(Boolean);
    },
    [editor]
  );

  const [videoFrameUrl, setVideoFrameUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeArrowId, setActiveArrowId] = useState<string | null>(null);

  // Load video thumbnail
  useEffect(() => {
    if (!info || info.length === 0) return;
    
    info.forEach((arrowInfo) => {
      if (!arrowInfo?.videoUrl) return;
    
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = arrowInfo.videoUrl;

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
    });
  }, [info]);

  if (!info || info.length === 0) return null;

  return (
    <>
      {info.map((arrowInfo) => {
        if (!arrowInfo) return null;

        // Show different UI based on status
        if (arrowInfo.status === 'pending') {
          return (
            <div
              key={arrowInfo.id}
              style={{
                position: 'absolute',
                top: arrowInfo.y - 40,
                left: arrowInfo.x,
                transform: 'translate(-50%, -50%)',
                zIndex: 2000,
                pointerEvents: 'auto',
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center px-4 py-2 bg-white rounded-lg shadow-lg border-2 border-black">
                <Spinner size="2" />
                <span className="ml-2 font-semibold">Generating... {arrowInfo.timer || 0}s</span>
              </div>
            </div>
          );
        }

        if (arrowInfo.status === 'error') {
          return (
            <div
              key={arrowInfo.id}
              style={{
                position: 'absolute',
                top: arrowInfo.y - 40,
                left: arrowInfo.x,
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
        if (!arrowInfo.videoUrl) return null;

        return (
          <div
            key={arrowInfo.id}
            style={{
              position: 'absolute',
              top: arrowInfo.y,
              left: arrowInfo.x,
              transform: 'translate(-50%, -50%)',
              zIndex: 2000,
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div 
              style={{ 
                position: 'relative',
                width: arrowInfo.width, 
                height: arrowInfo.height, 
                borderRadius: 12, 
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
              }}
              onClick={() => {
                setActiveArrowId(arrowInfo.id);
                setIsOpen(true);
              }}
            >
              {videoFrameUrl ? (
                <img
                  src={videoFrameUrl}
                  alt="video thumbnail"
                  draggable={false}
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
                  width: Math.min(Math.max(40, arrowInfo.width * 0.15), 80),
                  height: Math.min(Math.max(40, arrowInfo.width * 0.15), 80),
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
                  size={Math.min(Math.max(18, arrowInfo.width * 0.08), 36)}
                  fill="currentColor"
                  style={{ marginLeft: '10%' }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {isOpen && activeArrowId && createPortal(
        <VideoEditorModal
          isOpen={isOpen}
          videoClip={{
            id: activeArrowId,
            videoUrl: info.find(a => a?.id === activeArrowId)?.videoUrl || '',
            duration: 5,
          }}
          onClose={() => {
            setIsOpen(false);
            setActiveArrowId(null);
          }}
        />,
        document.body
      )}
    </>
  );
};
