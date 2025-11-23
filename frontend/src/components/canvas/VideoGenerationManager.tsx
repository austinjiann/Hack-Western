import {
    useEditor,
    createShapeId,
    AssetRecordType,
    TLImageAsset,
} from "tldraw";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useGlobalContext } from "../../hooks/useGlobalContext";

export const VideoGenerationManager = () => {
    const editor = useEditor();
    const { updateSceneState, addClip, context } =
        useGlobalContext("global-context");
    const intervalsRef = useRef<Map<string, number>>(new Map());
    const completedJobsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Monitor for new arrows with pending jobs and start polling for them
        const checkInterval = setInterval(() => {
            const arrows = editor
                .getCurrentPageShapes()
                .filter(
                    (s) =>
                        s.type === "arrow" && 
                        s.meta?.jobId && 
                        s.meta?.status === "pending" &&
                        !completedJobsRef.current.has(s.meta.jobId as string)
                );

            for (const arrow of arrows) {
                const jobId = arrow.meta.jobId as string;
                
                // If we're already polling this job, skip it
                if (intervalsRef.current.has(jobId)) {
                    continue;
                }

                // Start a new interval for this specific job
                const backend_url = import.meta.env.VITE_BACKEND_URL || "";
                
                const pollInterval = setInterval(async () => {
                    try {
                        const response = await fetch(
                            `${backend_url}/api/jobs/video/${jobId}`
                        );
                        
                        // 404 is expected when job completes and gets cleaned up from Redis
                        if (response.status === 404) {
                            const intervalId = intervalsRef.current.get(jobId);
                            if (intervalId) {
                                clearInterval(intervalId);
                                intervalsRef.current.delete(jobId);
                            }
                            return;
                        }
                        
                        if (!response.ok) {
                            // Show error toast for actual errors (5xx, etc)
                            toast.error("Unexpected server error");

                            // Clear this job's interval
                            const intervalId = intervalsRef.current.get(jobId);
                            if (intervalId) {
                                clearInterval(intervalId);
                                intervalsRef.current.delete(jobId);
                            }

                            // Find and delete the arrow
                            const currentArrow = editor.getCurrentPageShapes().find(
                                s => s.type === "arrow" && s.meta?.jobId === jobId
                            );
                            
                            if (currentArrow) {
                                editor.deleteShapes([currentArrow.id]);

                                // Find and delete the target frame
                                const bindings = editor.getBindingsInvolvingShape(currentArrow.id);
                                const endBinding = bindings.find(
                                    (b: any) => b.fromId === currentArrow.id && b.props.terminal === "end"
                                );
                                if (endBinding) {
                                    const targetFrameId = (endBinding as any).toId;
                                    editor.deleteShapes([targetFrameId]);
                                }
                            }

                            return;
                        }

                        const data = await response.json();

                        // Get the current arrow (it may have been updated since we started)
                        const currentArrow = editor.getCurrentPageShapes().find(
                            s => s.type === "arrow" && s.meta?.jobId === jobId
                        );

                        if (!currentArrow) {
                            // Arrow was deleted, stop polling
                            const intervalId = intervalsRef.current.get(jobId);
                            if (intervalId) {
                                clearInterval(intervalId);
                                intervalsRef.current.delete(jobId);
                            }
                            return;
                        }

                        if (data.status === "done" && data.video_url) {
                            // Prevent any new intervals for this job
                            completedJobsRef.current.add(jobId);

                            // Stop polling this job immediately
                            const intervalId = intervalsRef.current.get(jobId);
                            if (intervalId) {
                                clearInterval(intervalId);
                                intervalsRef.current.delete(jobId);
                            }
                            
                            const doneMeta = {
                                ...currentArrow.meta,
                                status: "done",
                                videoUrl: data.video_url,
                            };

                            // Update arrow meta to done status
                            editor.updateShapes([
                                {
                                    id: currentArrow.id,
                                    type: "arrow",
                                    meta: doneMeta,
                                },
                            ]);

                            // Extract context from video (runs async after interval cleared)
                            (async () => {
                                try {
                                    const blob = await fetch(data.video_url).then((r) => r.blob());
                                    const fd = new FormData();
                                    fd.append("files", blob, "video.mp4");

                                    const sceneResp = await fetch(
                                        `${backend_url}/api/gemini/extract-context`,
                                        {
                                            method: "POST",
                                            body: fd,
                                        }
                                    );

                                    const responseText = await sceneResp.text();
                                    console.log(sceneResp.status, responseText);

                                    if (sceneResp.ok) {
                                        const latestArrow = editor.getShape(currentArrow.id);
                                        const latestMeta = (latestArrow?.meta as any) ?? doneMeta;
                                        try {
                                            const extracted = JSON.parse(responseText);
                                            updateSceneState(extracted);
                                            console.log("OKOKOKOIKOKOKOKOKOK", extracted);

                                            addClip({
                                                index: context?.clips.length ?? 0,
                                                clipUrl: data.video_url,
                                                lastFrameUrl: String(latestMeta.lastFrameUrl ?? ""),
                                                annotations: extracted,
                                                prompt: String(latestMeta.prompt ?? ""),
                                                modelParams: latestMeta.modelParams ?? {},
                                            });
                                        } catch (parseError) {
                                            console.error("Failed to parse response:", parseError);
                                        }
                                    }
                                } catch (extractError) {
                                    console.error("Failed to extract context:", extractError);
                                }
                            })();


                        // Find the target frame (arrow's end binding)
                                const bindings = editor.getBindingsInvolvingShape(currentArrow.id);
                        const endBinding = bindings.find(
                            (b: any) => b.fromId === currentArrow.id && b.props.terminal === "end"
                        );

                        if (endBinding) {
                            const targetFrameId = (endBinding as any).toId;
                            const targetFrame = editor.getShape(targetFrameId);

                            if (targetFrame && targetFrame.type === "aspect-frame") {
                                const frameW = (targetFrame.props as any).w || 960;
                                const frameH = (targetFrame.props as any).h || 540;

                                // Update frame name
                                editor.updateShapes([
                                    {
                                        id: targetFrameId,
                                        type: "aspect-frame",
                                        props: {
                                            ...targetFrame.props,
                                            name: "Generated Frame",
                                        },
                                    },
                                ]);

                                // Extract last frame from video and add it as an image
                                const videoUrl = data.video_url;
                                const video = document.createElement("video");
                                video.crossOrigin = "anonymous";
                                video.src = videoUrl;

                                video.onloadedmetadata = () => {
                                    video.currentTime = Math.max(0, video.duration - 0.1);
                                };

                                video.onseeked = () => {
                                    const canvas = document.createElement("canvas");
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        ctx.drawImage(video, 0, 0);

                                        canvas.toBlob((blob) => {
                                            if (blob) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => {
                                                    const dataUrl = e.target?.result as string;
                                                    const refreshedArrow = editor.getShape(currentArrow.id);
                                                    const refreshedMeta = (refreshedArrow?.meta as any) ?? doneMeta;
                                                    editor.updateShapes([
                                                        {
                                                            id: currentArrow.id,
                                                            type: "arrow",
                                                            meta: {
                                                                ...refreshedMeta,
                                                                lastFrameUrl: dataUrl,
                                                            },
                                                        },
                                                    ]);

                                                    const assetId = AssetRecordType.createId();
                                                    const asset: TLImageAsset = {
                                                        id: assetId,
                                                        type: "image",
                                                        typeName: "asset",
                                                        props: {
                                                            name: "last-frame.png",
                                                            src: dataUrl,
                                                            w: video.videoWidth,
                                                            h: video.videoHeight,
                                                            mimeType: "image/png",
                                                            isAnimated: false,
                                                        },
                                                        meta: {},
                                                    };

                                                    editor.createAssets([asset]);

                                                    const scale = Math.min(
                                                        frameW / video.videoWidth,
                                                        frameH / video.videoHeight
                                                    );
                                                    const scaledW = video.videoWidth * scale;
                                                    const scaledH = video.videoHeight * scale;

                                                    const imageX = targetFrame.x + (frameW - scaledW) / 2;
                                                    const imageY = targetFrame.y + (frameH - scaledH) / 2;

                                                    const imageShapeId = createShapeId();
                                                    editor.createShapes([
                                                        {
                                                            id: imageShapeId,
                                                            type: "image",
                                                            x: imageX,
                                                            y: imageY,
                                                            props: {
                                                                assetId,
                                                                w: scaledW,
                                                                h: scaledH,
                                                            },
                                                        },
                                                    ]);
                                                };
                                                reader.readAsDataURL(blob);
                                            }
                                        }, "image/png");
                                    }
                                };

                                video.onerror = () => {
                                    console.error("Failed to load video for frame extraction");
                                };
                            }
                        }
                    } else if (data.status === "error") {
                        // Stop polling and update to error status
                        completedJobsRef.current.add(jobId);
                        const intervalId = intervalsRef.current.get(jobId);
                        if (intervalId) {
                            clearInterval(intervalId);
                            intervalsRef.current.delete(jobId);
                        }
                        
                        editor.updateShapes([
                            {
                                id: currentArrow.id,
                                type: "arrow",
                                meta: {
                                    ...currentArrow.meta,
                                    status: "error",
                                },
                            },
                        ]);
                    } else {
                        // Update timer for pending status
                        const startTime = (currentArrow.meta.startTime as number) || Date.now();
                        const currentTime = Date.now();
                        const seconds = Math.floor((currentTime - startTime) / 1000);

                        const currentTimer = (currentArrow.meta.timer as number) || 0;
                        if (currentTimer !== seconds) {
                            editor.updateShapes([
                                {
                                    id: currentArrow.id,
                                    type: "arrow",
                                    meta: {
                                        ...currentArrow.meta,
                                        timer: seconds,
                                    },
                                },
                            ]);
                        }
                    }
                } catch (e) {
                    console.error("Error polling job", jobId, e);
                }
            }, 2000); // Poll this specific job every 2s
            
            // Store this interval
            intervalsRef.current.set(jobId, pollInterval);
        }
    }, 2000); // Check for new arrows every 2s

        return () => {
            // Clear the check interval
            if (checkInterval) {
                clearInterval(checkInterval);
            }
            // Clear all job-specific intervals
            intervalsRef.current.forEach((intervalId) => {
                clearInterval(intervalId);
            });
            intervalsRef.current.clear();
            completedJobsRef.current.clear();
        };
    }, [editor]);

    return null;
};
