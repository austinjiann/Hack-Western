import { useEditor, useValue } from "tldraw";
import VideoEditorModal from "../video-editor/VideoEditorModal";
import { Spinner } from "@radix-ui/themes";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Play } from "lucide-react";

export const ArrowActionMenu = () => {
  const editor = useEditor();

  const info = useValue(
    "arrow info",
    () => {
      // Get all arrows on the canvas
      const arrows = editor
        .getCurrentPageShapes()
        .filter((s) => s.type === "arrow");

      // For now, show menu for all arrows with video data
      // You could modify this to show only selected ones if needed
      return arrows
        .map((shape) => {
          const shapeId = shape.id;

          const bounds = editor.getShapePageBounds(shapeId);
          if (!bounds) return null;

          const center = {
            x: bounds.x + bounds.w / 2,
            y: bounds.y + bounds.h / 2,
          };

          // Fixed size in page coordinates (will scale with zoom)
          const pageWidth = 480;
          const pageHeight = 270;

          // Get video metadata from arrow meta
          const videoUrl = shape.meta?.videoUrl as string | null;
          const status = shape.meta?.status as string | undefined;
          const timer = shape.meta?.timer as number | undefined;
          const duration = shape.meta?.duration as number | undefined;
          const trimEnd = shape.meta?.trimEnd as number | undefined;

          return {
            id: shapeId,
            x: center.x,
            y: center.y,
            width: pageWidth,
            height: pageHeight,
            videoUrl,
            status,
            timer,
            duration,
            trimEnd,
          };
        })
        .filter(Boolean);
    },
    [editor],
  );

  const [videoFrameUrls, setVideoFrameUrls] = useState<Record<string, string>>(
    {},
  );
  const [openModalId, setOpenModalId] = useState<string | null>(null);

  // Load video thumbnails for all arrows
  useEffect(() => {
    if (!info || !Array.isArray(info)) return;

    info.forEach((arrowInfo) => {
      if (!arrowInfo?.videoUrl || videoFrameUrls[arrowInfo.id]) return;

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = arrowInfo.videoUrl;

      const captureFrame = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setVideoFrameUrls((prev) => ({ ...prev, [arrowInfo.id]: dataUrl }));
      };

      video.addEventListener("loadeddata", () => {
        video.currentTime = Math.min(1, video.duration / 2);
      });

      video.addEventListener("seeked", captureFrame);
      video.load();
    });
  }, [info]);

  if (!info || !Array.isArray(info) || info.length === 0) return null;

  return (
    <>
      {info.map((arrowInfo) => {
        if (!arrowInfo) return null;

        const videoFrameUrl = videoFrameUrls[arrowInfo.id];

        // Show different UI based on status
        if (arrowInfo.status === "pending") {
          return (
            <div
              key={arrowInfo.id}
              style={{
                position: "absolute",
                top: arrowInfo.y - 40,
                left: arrowInfo.x,
                transform: "translate(-50%, -50%)",
                zIndex: 2000,
                pointerEvents: "auto",
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-center px-6 py-4 bg-white rounded-lg shadow-lg border-2 border-black"
                style={{ minWidth: "220px", whiteSpace: "nowrap" }}
              >
                <Spinner size="3" />
                <span className="ml-3 font-semibold text-xl">
                  Generating... {arrowInfo.timer || 0}s
                </span>
              </div>
            </div>
          );
        }

        if (arrowInfo.status === "error") {
          return (
            <div
              key={arrowInfo.id}
              style={{
                position: "absolute",
                top: arrowInfo.y - 40,
                left: arrowInfo.x,
                transform: "translate(-50%, -50%)",
                zIndex: 2000,
                pointerEvents: "auto",
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
              position: "absolute",
              top: arrowInfo.y - arrowInfo.height / 2 - 20,
              left: arrowInfo.x,
              transform: "translate(-50%, -100%)",
              zIndex: 2000,
              pointerEvents: "auto",
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: "relative",
                width: arrowInfo.width,
                height: arrowInfo.height,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
                cursor: "pointer",
              }}
              onClick={() => setOpenModalId(arrowInfo.id)}
            >
              {videoFrameUrl ? (
                <img
                  src={videoFrameUrl}
                  alt="video thumbnail"
                  draggable={false}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#e5e7eb",
                  }}
                >
                  <Spinner size="3" />
                </div>
              )}

              {/* Play button overlay */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: Math.min(Math.max(40, arrowInfo.width * 0.15), 80),
                  height: Math.min(Math.max(40, arrowInfo.width * 0.15), 80),
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  transition: "transform 0.2s ease",
                  pointerEvents: "none",
                }}
                className="hover:scale-110"
              >
                <Play
                  size={Math.min(Math.max(18, arrowInfo.width * 0.08), 36)}
                  fill="currentColor"
                  style={{ marginLeft: "10%" }}
                />
              </div>
            </div>

            {openModalId === arrowInfo.id &&
              createPortal(
                <VideoEditorModal
                  isOpen={openModalId === arrowInfo.id}
                  videoClip={{
                    id: arrowInfo.id,
                    videoUrl: arrowInfo.videoUrl || "",
                    duration: arrowInfo.duration || 5,
                    trimEnd: arrowInfo.trimEnd,
                  }}
                  onClose={() => setOpenModalId(null)}
                  onTrim={(_clipId, endTime, newVideoUrl) => {
                    const arrow = editor.getShape(arrowInfo.id);
                    if (arrow) {
                      editor.updateShapes([
                        {
                          id: arrowInfo.id,
                          type: "arrow",
                          meta: {
                            ...arrow.meta,
                            trimEnd: endTime,
                            videoUrl: newVideoUrl || arrowInfo.videoUrl || "",
                            duration: endTime,
                          },
                        },
                      ]);
                    }
                  }}
                  onDelete={() => {
                    editor.deleteShapes([arrowInfo.id]);
                    setOpenModalId(null);
                  }}
                />,
                document.body,
              )}
          </div>
        );
      })}
    </>
  );
};
