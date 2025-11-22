import { useEditor, useValue, TLShapeId, createShapeId, TLShapePartial, AssetRecordType, TLImageAsset } from 'tldraw'
import { Tooltip, Button, Flex, TextField, Slider } from "@radix-ui/themes";
import { Sparkles, Image as ImageIcon, Palette, Type, Eye } from "lucide-react";
import { useState, useRef } from "react";

export const FrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
    const editor = useEditor()
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState("");
    const [showOpacitySlider, setShowOpacitySlider] = useState(false);
    const [promptText, setPromptText] = useState("");
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
        formData.append("global_context", ""); // also empty right now, populate later
        formData.append("files", blob)

        try {
            const response = await fetch(`${backend_url}/api/jobs/video`,{
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const jsonObj = await response.json();
            if (jsonObj.job_id === undefined) {
                throw Error("Server did not return job id")
            }

            const jobId = jsonObj.job_id;

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
            // Optionally show an error toast or notification here
        }
    }

    const backgroundColor = "backgroundColor" in frame.props ? (frame.props.backgroundColor as string) : "#ffffff";
    const opacity = "opacity" in frame.props ? (frame.props.opacity as number) : 1;
    const frameHeight = "h" in frame.props ? (frame.props.h as number) : 540;
    const frameWidth = "w" in frame.props ? (frame.props.w as number) : 960;
    
    // Scale text box size based on frame width
    const textBoxWidth = Math.max(400, Math.min(frameWidth * 0.9, 1200));
    const textBoxPadding = Math.max(16, frameWidth * 0.02);
    const fontSize = Math.max(14, Math.min(frameWidth * 0.025, 24));

    const handleOpacityChange = (value: number[]) => {
        editor.updateShapes([{
            id: shapeId,
            type: 'aspect-frame',
            props: {
                ...frame.props,
                opacity: value[0],
            },
        }]);
    };

    return (
        <>
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

                    {/* Opacity Control */}
                    <Tooltip content="Opacity">
                        <Button 
                            variant="soft" 
                            size="3"
                            onClick={() => setShowOpacitySlider(!showOpacitySlider)}
                            style={{ cursor: 'pointer', minWidth: '48px', minHeight: '48px' }}
                        >
                            <Eye size={40} />
                        </Button>
                    </Tooltip>
                </Flex>
            </div>
            )}

            {/* Opacity Slider - appears above toolbar when button is clicked */}
            {showOpacitySlider && (
                <div 
                    className="absolute -top-60 left-1/2 -translate-x-1/2 pointer-events-auto z-50"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div 
                        className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
                        style={{ minWidth: '600px' }}
                    >
                        <label style={{ fontSize: '20px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '12px' }}>
                            Opacity
                        </label>
                        <Slider
                            value={[opacity]}
                            onValueChange={handleOpacityChange}
                            min={0}
                            max={1}
                            step={0.01}
                            style={{ width: '600px' }}
                        />
                        <div style={{ fontSize: '15px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                            {Math.round(opacity * 100)}%
                        </div>
                    </div>
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
                    className="bg-white rounded-full shadow-lg border border-gray-200"
                    style={{ 
                        minWidth: `${textBoxWidth}px`,
                        paddingLeft: `${textBoxPadding}px`,
                        paddingRight: `${textBoxPadding}px`,
                        paddingTop: `${textBoxPadding * 0.625}px`,
                        paddingBottom: `${textBoxPadding * 0.625}px`,
                    }}
                >
                    <TextField.Root
                        size="3"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Enter your prompt..."
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: `${fontSize}px` }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
            )}
        </>
    )
}
