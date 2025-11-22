import { useEditor, useValue, TLShapeId, createShapeId, TLShapePartial, createBindingId, AssetRecordType, TLImageAsset } from 'tldraw'
import { Tooltip, Button, Flex, TextField, Slider } from "@radix-ui/themes";
import { Sparkles, Image as ImageIcon, Palette, Type, Eye } from "lucide-react";
import { useState, useRef } from "react";

export const FrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
    const editor = useEditor()
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState("");
    const [showOpacitySlider, setShowOpacitySlider] = useState(false);
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

    if (!isSelected || !frame) return null

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

        const FRAME_WIDTH = 1920;
        const FRAME_HEIGHT = 1080;
        const GAP = 200;

        const currentW = "w" in currentFrame.props ? (currentFrame.props.w as number) : FRAME_WIDTH;
        const newX = currentFrame.x + currentW + GAP;
        const newY = currentFrame.y;

        const newFrameId = createShapeId();
        const newFrame: TLShapePartial = {
            id: newFrameId,
            type: "aspect-frame",
            x: newX,
            y: newY,
            props: {
                w: FRAME_WIDTH,
                h: FRAME_HEIGHT,
                name: "16:9 Frame",
                backgroundColor: "#ffffff",
            },
        };

        const arrowId = createShapeId();
        const arrow: TLShapePartial = {
            id: arrowId,
            type: "arrow",
            x: currentFrame.x + currentW,
            y: currentFrame.y + FRAME_HEIGHT / 2,
            props: {
                start: { x: 0, y: 0 },
                end: { x: GAP, y: 0 },
                kind: "elbow",
            },
        };

        editor.createShapes([newFrame, arrow]);
        
        editor.createBindings([
            {
                id: createBindingId(),
                typeName: 'binding',
                type: 'arrow',
                fromId: arrowId,
                toId: shapeId,
                props: {
                    terminal: 'start',
                    normalizedAnchor: { x: 1, y: 0.5 },
                    isExact: true,
                    isPrecise: true,
                },
                meta: {},
            },
            {
                id: createBindingId(),
                typeName: 'binding',
                type: 'arrow',
                fromId: arrowId,
                toId: newFrameId,
                props: {
                    terminal: 'end',
                    normalizedAnchor: { x: 0, y: 0.5 },
                    isExact: true,
                    isPrecise: true,
                },
                meta: {},
            }
        ]);
        
        editor.select(newFrameId);
        editor.zoomToBounds(editor.getShapePageBounds(newFrameId)!, { animation: { duration: 200 } });

        try {
            const { blob } = await editor.toImage([shapeId], {
                format: 'png',
                scale: 1,
                background: true,
                padding: 0,
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `frame-${shapeId}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to save screenshot:", error);
        }
    }

    const backgroundColor = "backgroundColor" in frame.props ? (frame.props.backgroundColor as string) : "#ffffff";
    const opacity = "opacity" in frame.props ? (frame.props.opacity as number) : 1;

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
        </>
    )
}
