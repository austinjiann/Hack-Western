import { useEditor, createShapeId, AssetRecordType, TLImageAsset } from 'tldraw'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export const VideoGenerationManager = () => {
    const editor = useEditor()
    const intervalRef = useRef<number | null>(null)

    useEffect(() => {
        intervalRef.current = setInterval(async () => {
            // Find all arrows with pending video generation jobs
            const arrows = editor.getCurrentPageShapes().filter(
                s => s.type === 'arrow' && s.meta?.jobId && s.meta?.status === 'pending'
            )

            for (const arrow of arrows) {
                const jobId = arrow.meta.jobId as string
                const backend_url = import.meta.env.VITE_BACKEND_URL || "";
                
                try {
                    const response = await fetch(`${backend_url}/api/jobs/video/${jobId}`)
                    if (!response.ok) {
                        // Show error toast
                        toast.error('Unable to Read Try Again')
                        
                        // Clear the interval
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                            intervalRef.current = null
                        }
                        
                        // Find and delete the arrow
                        editor.deleteShapes([arrow.id])
                        
                        // Find and delete the target frame
                        const bindings = editor.getBindingsInvolvingShape(arrow.id)
                        const endBinding = bindings.find((b: any) => b.fromId === arrow.id && b.props.terminal === 'end')
                        if (endBinding) {
                            const targetFrameId = (endBinding as any).toId
                            editor.deleteShapes([targetFrameId])
                        }
                        
                        continue
                    }

                    const data = await response.json()
                    
                    if (data.status === 'done' && data.video_url) {
                        // Find the target frame (arrow's end binding)
                        const bindings = editor.getBindingsInvolvingShape(arrow.id);
                        const endBinding = bindings.find((b: any) => b.fromId === arrow.id && b.props.terminal === 'end');
                        
                        if (endBinding) {
                            const targetFrameId = (endBinding as any).toId;
                            const targetFrame = editor.getShape(targetFrameId);
                            
                            if (targetFrame && targetFrame.type === 'aspect-frame') {
                                const frameW = (targetFrame.props as any).w || 960;
                                const frameH = (targetFrame.props as any).h || 540;
                                
                                // Update frame name
                                editor.updateShapes([{
                                    id: targetFrameId,
                                    type: 'aspect-frame',
                                    props: {
                                        ...targetFrame.props,
                                        name: 'Generated Frame',
                                    }
                                }]);

                                // Extract last frame from video and add it as an image
                                const videoUrl = data.video_url
                                const video = document.createElement('video')
                                video.crossOrigin = 'anonymous'
                                video.src = videoUrl
                                
                                video.onloadedmetadata = () => {
                                    video.currentTime = Math.max(0, video.duration - 0.1)
                                }
                                
                                video.onseeked = () => {
                                    const canvas = document.createElement('canvas')
                                    canvas.width = video.videoWidth
                                    canvas.height = video.videoHeight
                                    const ctx = canvas.getContext('2d')
                                    if (ctx) {
                                        ctx.drawImage(video, 0, 0)
                                        
                                        canvas.toBlob((blob) => {
                                            if (blob) {
                                                const reader = new FileReader()
                                                reader.onload = (e) => {
                                                    const dataUrl = e.target?.result as string
                                                    
                                                    const assetId = AssetRecordType.createId()
                                                    const asset: TLImageAsset = {
                                                        id: assetId,
                                                        type: 'image',
                                                        typeName: 'asset',
                                                        props: {
                                                            name: 'last-frame.png',
                                                            src: dataUrl,
                                                            w: video.videoWidth,
                                                            h: video.videoHeight,
                                                            mimeType: 'image/png',
                                                            isAnimated: false,
                                                        },
                                                        meta: {},
                                                    }
                                                    
                                                    editor.createAssets([asset])
                                                    
                                                    const scale = Math.min(frameW / video.videoWidth, frameH / video.videoHeight)
                                                    const scaledW = video.videoWidth * scale
                                                    const scaledH = video.videoHeight * scale
                                                    
                                                    const imageX = targetFrame.x + (frameW - scaledW) / 2
                                                    const imageY = targetFrame.y + (frameH - scaledH) / 2
                                                    
                                                    const imageShapeId = createShapeId()
                                                    editor.createShapes([{
                                                        id: imageShapeId,
                                                        type: 'image',
                                                        x: imageX,
                                                        y: imageY,
                                                        props: {
                                                            assetId,
                                                            w: scaledW,
                                                            h: scaledH,
                                                        }
                                                    }])
                                                }
                                                reader.readAsDataURL(blob)
                                            }
                                        }, 'image/png')
                                    }
                                }
                                
                                video.onerror = () => {
                                    console.error('Failed to load video for frame extraction')
                                }
                            }
                        }

                        // Update arrow meta to done status
                        editor.updateShapes([{
                            id: arrow.id,
                            type: 'arrow',
                            meta: {
                                ...arrow.meta,
                                status: 'done',
                                videoUrl: data.video_url
                            }
                        }])
                        
                    } else if (data.status === 'error') {
                        // Update to error status
                        editor.updateShapes([{
                            id: arrow.id,
                            type: 'arrow',
                            meta: {
                                ...arrow.meta,
                                status: 'error'
                            }
                        }])
                    } else {
                        // Update timer
                        const startTime = arrow.meta.startTime as number || Date.now()
                        const currentTime = Date.now()
                        const seconds = Math.floor((currentTime - startTime) / 1000)
                         
                        const currentTimer = arrow.meta.timer as number || 0
                        if (currentTimer !== seconds) {
                            editor.updateShapes([{
                                id: arrow.id,
                                type: 'arrow',
                                meta: {
                                    ...arrow.meta,
                                    timer: seconds
                                }
                            }])
                        }
                    }

                } catch (e) {
                    console.error("Error polling job", e)
                }
            }
        }, 2000) // Poll every 2s

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [editor])

    return null
}
