import { VideoClip } from "../types/types";

/**
 * Merges multiple video clips into a single video blob
 * @param clips Array of video clips to merge
 * @param onProgress Optional progress callback (0-1)
 * @returns Promise resolving to the merged video blob
 */
export async function mergeVideosClient(
  clips: VideoClip[],
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  if (clips.length === 0) {
    throw new Error("No clips provided");
  }

  // Create a canvas for rendering videos
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Load all videos and get their dimensions
  const videos: HTMLVideoElement[] = [];
  let maxWidth = 0;
  let maxHeight = 0;

  for (const clip of clips) {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.src = clip.videoUrl;
    video.preload = "metadata";

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        maxWidth = Math.max(maxWidth, video.videoWidth);
        maxHeight = Math.max(maxHeight, video.videoHeight);
        resolve();
      };
      video.onerror = () =>
        reject(new Error(`Failed to load video: ${clip.videoUrl}`));
    });

    videos.push(video);
  }

  // Set canvas size to match the largest video
  canvas.width = maxWidth;
  canvas.height = maxHeight;

  // Create MediaRecorder to record the canvas
  const stream = canvas.captureStream(30); // 30 FPS
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp9", // Use webm for better browser support
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return new Promise<Blob>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      // Cleanup
      videos.forEach((v) => {
        v.pause();
        v.src = "";
      });
      resolve(blob);
    };

    mediaRecorder.onerror = () => {
      reject(new Error("MediaRecorder error"));
    };

    // Start recording
    mediaRecorder.start();

    // Process each clip sequentially
    let currentClipIndex = 0;

    const processClip = async (index: number) => {
      if (index >= clips.length) {
        // All clips processed, stop recording
        // Wait a bit for final frames
        setTimeout(() => {
          mediaRecorder.stop();
        }, 100);
        return;
      }

      const clip = clips[index];
      const video = videos[index];
      const trimEnd =
        clip.trimEnd !== undefined
          ? clip.trimEnd
          : clip.duration || video.duration;

      try {
        // Load and seek to start
        video.currentTime = 0;
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("error", onError);
            resolve();
          };
          const onError = () => {
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("error", onError);
            reject(new Error(`Failed to load video: ${clip.videoUrl}`));
          };
          video.addEventListener("canplay", onCanPlay);
          video.addEventListener("error", onError);

          // If already loaded, resolve immediately
          if (video.readyState >= 2) {
            setTimeout(() => resolve(), 0);
          }
        });

        // Play the video
        await video.play();

        const drawFrame = () => {
          const currentTime = video.currentTime;

          // Check if we've reached the trim end or video ended
          if (video.ended || currentTime >= trimEnd) {
            // Clip finished, move to next
            video.pause();
            currentClipIndex++;
            onProgress?.(currentClipIndex / clips.length);
            processClip(currentClipIndex).catch(reject);
            return;
          }

          // Draw current frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Continue drawing frames
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      } catch (error) {
        reject(error);
      }
    };

    // Start processing first clip
    processClip(0).catch(reject);
  });
}

/**
 * Converts a video blob to MP4 format using MediaRecorder
 * Note: This is a fallback - webm is more widely supported
 * @param blob Input video blob
 * @returns Promise resolving to MP4 blob (or original if conversion fails)
 */
export async function convertToMP4(blob: Blob): Promise<Blob> {
  // For now, return the webm blob
  // Full MP4 conversion would require ffmpeg.wasm or server-side processing
  return blob;
}

/**
 * Downloads a video blob as a file
 * @param blob Video blob to download
 * @param filename Optional filename (default: merged-video.webm)
 */
export function downloadVideo(
  blob: Blob,
  filename: string = "merged-video.webm",
) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
