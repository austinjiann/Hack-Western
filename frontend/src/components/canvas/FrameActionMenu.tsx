import { useEditor, useValue, TLShapeId, createShapeId, TLShapePartial, AssetRecordType, TLImageAsset } from 'tldraw'
import { Tooltip, Button, Flex, TextField } from "@radix-ui/themes";
import { Sparkles, Image as ImageIcon, Palette, Type, Banana, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from 'sonner';
import { useGlobalContext } from '../../hooks/useGlobalContext';

export const FrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
    const editor = useEditor();
    const { context } = useGlobalContext("global-context");
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState("");
    const [promptText, setPromptText] = useState("");
    const [isImproving, setIsImproving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    
    // Check if this specific shape is selected
    const isSelected = useValue(
        'is selected', 
        () => editor.getSelectedShapeIds().includes(shapeId), 
        [editor, shapeId]
    )

    const frame = useValue(
        'frame',
        () => editor.getShape(shapeId),
        [editor, shapeId]
    );

    if (!frame) return null
    
    // Show toolbar only when selected
    const showToolbar = isSelected;
    
    // Show text box when selected OR when it has content
    const showTextBox = isSelected || promptText.trim() !== "";

    const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const color = e.target.value;
        editor.updateShapes([{
            id: shapeId,
            type: 'aspect-frame',
            props: {
                ...frame.props,
                backgroundColor: color,
            },
        }]);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const file = e.target.files?.[0];
        if (!file || !frame) {
            // Reset the input if no file selected
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string;

            const img = new Image();
            img.onload = () => {
                const assetId = AssetRecordType.createId();

                const asset: TLImageAsset = {
                    id: assetId,
                    type: "image",
                    typeName: "asset",
                    props: {
                        name: file.name,
                        src: dataUrl,
                        w: img.width,
                        h: img.height,
                        mimeType: file.type,
                        isAnimated: false,
                    },
                    meta: {},
                };

                editor.createAssets([asset]);

                // Get frame dimensions
                const frameW = "w" in frame.props ? (frame.props.w as number) : 960;
                const frameH = "h" in frame.props ? (frame.props.h as number) : 540;
                
                // Scale image to fit within the frame (contain mode - maintain aspect ratio, fit entirely within frame)
                const scale = Math.min(frameW / img.width, frameH / img.height);
                const scaledW = img.width * scale;
                const scaledH = img.height * scale;
                
                // Center the image within the frame (using relative coordinates since it's a child)
                const x = (frameW - scaledW) / 2;
                const y = (frameH - scaledH) / 2;

                const imageShapeId = createShapeId();
                const shape: TLShapePartial = {
                    id: imageShapeId,
                    type: "image",
                    x,
                    y,
                    parentId: frame.id, // Make it a child of the frame (uses relative coordinates)
                    props: {
                        assetId,
                        w: scaledW,
                        h: scaledH,
                    },
                };

                editor.createShapes([shape]);
                
                // Reset the input after successful upload
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            };
            img.onerror = () => {
                console.error("Failed to load image");
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            };
            img.src = dataUrl;
        };
        reader.onerror = () => {
            console.error("Failed to read file");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };


    const handleImprove = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        const currentFrame = editor.getShape(shapeId);
        if (!currentFrame) return;

        setIsImproving(true);
        
        // Store loading state in frame meta so FrameShape can access it
        editor.updateShapes([{
            id: shapeId,
            type: 'aspect-frame',
            meta: {
                ...currentFrame.meta,
                isImproving: true,
            },
        }]);
        
        // Disable editor interactions while improving
        editor.updateInstanceState({ isReadonly: true });
        
        try {
            // Deselect the shape so the toolbar is not captured in the image
            editor.selectNone();

            // Get frame dimensions
            const frameW = "w" in currentFrame.props ? (currentFrame.props.w as number) : 960;
            const frameH = "h" in currentFrame.props ? (currentFrame.props.h as number) : 540;

            // Export frame as image (readonly prevents user interaction during export)
            const { blob } = await editor.toImage([shapeId], {
                format: 'png',
                scale: 1,
                background: true,
                padding: 0,
            });
            
            // Reselect the shape
            editor.select(shapeId);
            
            // Disable readonly now that export is done - we need to be able to delete/create shapes
            editor.updateInstanceState({ isReadonly: false });
            
            if (!blob) {
                toast.error("Failed to export frame as image");
                return;
            }

            const backend_url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

            const formData = new FormData();
            formData.append("image", blob, "frame.png");

            // Call the improve image API (nanobanana)
            const response = await fetch(`${backend_url}/api/gemini/image`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to improve image");
            }

            const result = await response.json();
            
            if (!result.image_bytes) {
                throw new Error("No image data returned from server");
            }

            // Handle bytes from backend - convert to base64
            let imageDataUrl: string;
            const imageBytes = result.image_bytes;
            
            let base64String: string;
            
            try {
                if (Array.isArray(imageBytes)) {
                    // Backend sent bytes as array of numbers, convert to base64
                    const bytes = new Uint8Array(imageBytes);
                    // Convert bytes to base64
                    const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
                    base64String = btoa(binaryString);
                } else if (typeof imageBytes === 'string') {
                    // Check if it's already a data URL
                    if (imageBytes.startsWith('data:image/')) {
                        // Extract just the base64 part
                        const commaIndex = imageBytes.indexOf(',');
                        if (commaIndex !== -1) {
                            base64String = imageBytes.substring(commaIndex + 1);
                        } else {
                            base64String = imageBytes;
                        }
                    } else {
                        // It's already a base64 string
                        base64String = imageBytes;
                    }
                    // First, just remove whitespace
                    let cleanedBase64 = base64String.replace(/[\s\r\n\t]/g, '');
                    
                    // Check if it's base64url (contains _ or -) and convert to standard base64
                    if (cleanedBase64.includes('_') || cleanedBase64.includes('-')) {
                        // Convert base64url to standard base64: - becomes +, _ becomes /
                        cleanedBase64 = cleanedBase64.replace(/-/g, '+').replace(/_/g, '/');
                        // Fix padding (base64url doesn't use = padding, but standard base64 does)
                        const paddingNeeded = (4 - (cleanedBase64.length % 4)) % 4;
                        if (paddingNeeded > 0) {
                            cleanedBase64 += '='.repeat(paddingNeeded);
                        }
                    }
                    
                    // Try to decode it as-is first
                    let canDecode = false;
                    try {
                        // Test if it can be decoded
                        atob(cleanedBase64.substring(0, Math.min(100, cleanedBase64.length)));
                        // If we get here, at least the start is valid
                        canDecode = true;
                    } catch (e) {
                        // Will clean below
                    }
                    
                    // If initial test passed, try the full string with padding fix
                    if (canDecode) {
                        // Fix padding if needed
                        const paddingNeeded = (4 - (cleanedBase64.length % 4)) % 4;
                        if (paddingNeeded > 0 && paddingNeeded < 4) {
                            cleanedBase64 += '='.repeat(paddingNeeded);
                        }
                        // Try full decode
                        try {
                            atob(cleanedBase64);
                            base64String = cleanedBase64;
                        } catch (e) {
                            canDecode = false;
                        }
                    }
                    
                    // Only clean invalid characters if decode failed
                    if (!canDecode) {
                        // Find invalid characters and their positions (sample first 1000 chars)
                        const invalidChars = new Set<string>();
                        const invalidPositions: number[] = [];
                        for (let i = 0; i < Math.min(1000, cleanedBase64.length); i++) {
                            const char = cleanedBase64[i];
                            if (!/[A-Za-z0-9+/=]/.test(char)) {
                                invalidChars.add(char);
                                invalidPositions.push(i);
                            }
                        }
                        
                        // Remove invalid characters
                        let testBase64 = cleanedBase64.replace(/[^A-Za-z0-9+/=]/g, '');
                        const removedCount = cleanedBase64.length - testBase64.length;
                        
                        // Fix padding
                        const paddingNeeded = (4 - (testBase64.length % 4)) % 4;
                        if (paddingNeeded > 0 && paddingNeeded < 4) {
                            testBase64 += '='.repeat(paddingNeeded);
                        }
                        
                        // Test if this cleaned version can decode (test first chunk)
                        try {
                            const testChunk = testBase64.substring(0, Math.min(10000, testBase64.length));
                            atob(testChunk);
                            // If chunk test passes, try full decode
                            try {
                                atob(testBase64);
                                base64String = testBase64;
                            } catch (fullError) {
                                // Use it anyway - might work for image loading
                                base64String = testBase64;
                            }
                        } catch (e) {
                            throw new Error(`Could not create valid base64 from response. Removed ${removedCount} invalid characters.`);
                        }
                    }
                    
                } else {
                    throw new Error(`Invalid image data format: ${typeof imageBytes}. Expected array of bytes or base64 string.`);
                }
                
                // Validate base64 string format
                if (!base64String || base64String.length === 0) {
                    throw new Error("Base64 string is empty after processing");
                }
                
                // Use data URL (consistent with other image handling in the codebase)
                // First validate the base64 can decode
                try {
                    // Test decode to ensure it's valid
                    atob(base64String);
                    imageDataUrl = `data:image/png;base64,${base64String}`;
                } catch (decodeError) {
                    throw new Error("Invalid base64 string - cannot decode image data");
                }
                
            } catch (error) {
                throw new Error(`Failed to process image data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Validate the image loads correctly before creating the asset
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                const timeout = setTimeout(() => {
                    reject(new Error("Image load timeout - the image data may be corrupted"));
                }, 10000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error("Failed to load improved image - invalid image data"));
                };
                img.src = imageDataUrl;
            });

            // Get actual image dimensions
            const img = new Image();
            await new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.src = imageDataUrl;
            });

            // Create image asset from improved image
            const assetId = AssetRecordType.createId();
            const asset: TLImageAsset = {
                id: assetId,
                type: "image",
                typeName: "asset",
                props: {
                    name: "improved-frame.png",
                    src: imageDataUrl,
                    w: img.width || frameW,
                    h: img.height || frameH,
                    mimeType: "image/png",
                    isAnimated: false,
                },
                meta: {},
            };

            // Get child shapes to replace BEFORE creating new asset
            const childIds = editor.getSortedChildIdsForParent(shapeId);

            // Create new image shape with improved image
            const imageShapeId = createShapeId();
            const scale = Math.min(frameW / img.width, frameH / img.height);
            const scaledW = img.width * scale;
            const scaledH = img.height * scale;
            const imageX = (frameW - scaledW) / 2;
            const imageY = (frameH - scaledH) / 2;

            const imageShape: TLShapePartial = {
                id: imageShapeId,
                type: "image",
                parentId: shapeId,
                x: imageX,
                y: imageY,
                props: {
                    assetId,
                    w: scaledW,
                    h: scaledH,
                },
            };

            // Delete existing children first (before creating new asset/shape)
            if (childIds.length > 0) {
                editor.deleteShapes(childIds);
            }
            
            // Create new asset
            editor.createAssets([asset]);
            
            // Create new image shape
            editor.createShapes([imageShape]);

            setIsImproving(false);
            // Clear loading state from frame meta
            editor.updateShapes([{
                id: shapeId,
                type: 'aspect-frame',
                meta: {
                    ...editor.getShape(shapeId)?.meta,
                    isImproving: false,
                },
            }]);
            editor.updateInstanceState({ isReadonly: false });
        } catch (error) {
            toast.error(`Failed to improve frame: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsImproving(false);
            // Clear loading state from frame meta
            const errorFrame = editor.getShape(shapeId);
            if (errorFrame) {
                editor.updateShapes([{
                    id: shapeId,
                    type: 'aspect-frame',
                    meta: {
                        ...errorFrame.meta,
                        isImproving: false,
                    },
                }]);
            }
            editor.updateInstanceState({ isReadonly: false });
        }
    };

    const handleNameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentName = "name" in frame.props ? (frame.props.name as string) : "16:9 Frame";
        setNameValue(currentName);
        setIsEditingName(true);
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.stopPropagation();
        editor.updateShapes([{
            id: shapeId,
            type: 'aspect-frame',
            props: {
                ...frame.props,
                name: nameValue || "16:9 Frame",
            },
        }]);
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setIsEditingName(false);
        setNameValue("");
    };

    const handleGenerate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        const currentFrame = editor.getShape(shapeId);
        if (!currentFrame) return;

        // Deselect the shape so the toolbar is not captured in the image
        editor.selectNone();

        // Get frame dimensions
        const frameW = "w" in currentFrame.props ? (currentFrame.props.w as number) : 960;
        const frameH = "h" in currentFrame.props ? (currentFrame.props.h as number) : 540;

        const { blob } = await editor.toImage([shapeId], {
            format: 'png',
            scale: 1,
            background: true,
            padding: 0,
        });
        
        // Reselect the shape
        editor.select(shapeId);
        
        const backend_url = import.meta.env.VITE_BACKEND_URL || "";

        const formData  = new FormData();
      
        formData.append("custom_prompt", promptText);
        formData.append("global_context", JSON.stringify(context?.sceneState ?? {}));
        console.log("TEST HUEIHGIUEWHUIGIUH", JSON.stringify(context?.sceneState ?? {}));
        formData.append("files", blob)

        try {
            const response = await fetch(`${backend_url}/api/jobs/video`,{
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to generate video");
            }

            const jsonObj = await response.json();
            if (jsonObj.job_id === undefined) {
                throw Error("Server did not return job id")
            }

            const jobId = jsonObj.job_id;
            const pageId = editor.getCurrentPageId();

            // Create a new frame to the right
            const newFrameId = createShapeId();
            const gap = 2000;
            const newFrameX = currentFrame.x + frameW + gap;
            const newFrameY = currentFrame.y;

            editor.createShapes([{
                id: newFrameId,
                type: 'aspect-frame',
                x: newFrameX,
                y: newFrameY,
                parentId: pageId,
                props: {
                    w: frameW,
                    h: frameH,
                    name: 'Generating...',
                }
            }]);

            // Create an arrow connecting the frames
            const arrowId = createShapeId();
            editor.createShapes([{
                id: arrowId,
                type: 'arrow',
                parentId: pageId,
                props: {
                    start: { x: currentFrame.x + frameW, y: currentFrame.y + frameH / 2 },
                    end: { x: newFrameX, y: newFrameY + frameH / 2 },
                }
            }]);

            // Bind arrow to frames
            editor.createBinding({
                type: 'arrow',
                fromId: arrowId,
                toId: shapeId,
                props: {
                    terminal: 'start',
                    isPrecise: true,
                }
            });

            editor.createBinding({
                type: 'arrow',
                fromId: arrowId,
                toId: newFrameId,
                props: {
                    terminal: 'end',
                    isPrecise: true,
                }
            });

            // Store job metadata in arrow's meta field
            editor.updateShapes([{
                id: arrowId,
                type: 'arrow',
                meta: {
                    jobId,
                    status: 'pending',
                    videoUrl: null,
                    timer: 0,
                    startTime: Date.now(),
                }
            }]);

        } catch (error) {
            console.error("Failed to generate video:", error);
            toast.error("Failed to generate video");
        }
    }

    const backgroundColor = "backgroundColor" in frame.props ? (frame.props.backgroundColor as string) : "#ffffff";
    const frameHeight = "h" in frame.props ? (frame.props.h as number) : 540;
    const frameWidth = "w" in frame.props ? (frame.props.w as number) : 960;
    
    // Scale text box size based on frame width
    const textBoxWidth = frameWidth;
    const fontSize = Math.max(14, Math.min(frameWidth * 0.025, 24));

    return (
        <>
            {/* Loading overlay for improve frame operation */}

            {/* Toolbar above the frame */}
            {showToolbar && (
            <div 
                className="absolute -top-28 left-1/2 -translate-x-1/2 pointer-events-auto z-50"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <Flex 
                    gap="5" 
                    p="5" 
                    className="bg-white rounded-lg shadow-lg border border-gray-200"
                    align="center"
                >
                    {/* Name Frame */}
                    {isEditingName ? (
                        <form onSubmit={handleNameSubmit}>
                            <TextField.Root
                                size="3"
                                value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        handleNameCancel();
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleNameSubmit(e as any);
                                    }
                                }}
                                onBlur={handleNameCancel}
                                autoFocus
                                style={{ width: '500px', fontSize: '16px' }}
                            />
                        </form>
                    ) : (
                        <Tooltip content="Name Frame">
                            <Button 
                                variant="soft" 
                                size="3"
                                onClick={handleNameClick}
                                style={{ cursor: 'pointer', minWidth: '48px', minHeight: '48px' }}
                            >
                                <Type size={40} />
                            </Button>
                        </Tooltip>
                    )}

                    {/* Background Color */}
                    <Tooltip content="Change Background">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <Button 
                                variant="soft" 
                                size="3"
                                style={{ cursor: 'pointer', position: 'relative', minWidth: '48px', minHeight: '48px' }}
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'color';
                                    input.value = backgroundColor;
                                    input.onchange = (e) => {
                                        const target = e.target as HTMLInputElement;
                                        handleBackgroundColorChange({ 
                                            target, 
                                            stopPropagation: () => {} 
                                        } as any);
                                    };
                                    input.click();
                                }}
                            >
                                <Palette size={40} />
                            </Button>
                        </div>
                    </Tooltip>

                    {/* Upload Image */}
                    <Tooltip content="Upload Image to Frame">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <Button 
                                variant="soft" 
                                size="3"
                                style={{ cursor: 'pointer', minWidth: '48px', minHeight: '48px' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                <ImageIcon size={40} />
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    width: '100%', 
                                    height: '100%', 
                                    opacity: 0, 
                                    cursor: 'pointer',
                                    pointerEvents: 'none'
                                }}
                                onChange={handleImageUpload}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </Tooltip>

                    {/* Generate (existing functionality) */}
                    <Tooltip content="Generate Next Frame">
                        <Button 
                            variant="soft" 
                            color="indigo"
                            size="3"
                    onClick={handleGenerate}
                            style={{ cursor: 'pointer', minWidth: '48px', minHeight: '48px' }}
                        >
                            <Sparkles size={40} />
                        </Button>
                    </Tooltip>

                    <Tooltip content="Improve Frame">
                        <Button 
                            variant="soft" 
                            size="3"
                            onClick={handleImprove}
                            disabled={isImproving}
                            style={{ cursor: isImproving ? 'not-allowed' : 'pointer', minWidth: '48px', minHeight: '48px', opacity: isImproving ? 0.6 : 1 }}
                        >
                            {isImproving ? (
                                <Loader2 size={40} className="animate-spin" />
                            ) : (
                            <Banana size={40} />
                            )}
                        </Button>
                    </Tooltip>
                </Flex>
            </div>
            )}

            {/* Prompt Text Box - appears below the frame */}
            {showTextBox && (
            <div 
                className="absolute pointer-events-auto z-50"
                style={{ 
                    top: `${frameHeight + 20}px`,
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div 
                    className="bg-white rounded-full shadow-xl flex items-center border border-gray-100"
                    style={{ 
                        width: `${textBoxWidth}px`,
                        padding: '12px 24px',
                    }}
                >
                    <input
                        type="text"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Describe your image..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                        style={{ fontSize: `${fontSize}px` }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleGenerate(e as any);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
            )}
        </>
    )
}
