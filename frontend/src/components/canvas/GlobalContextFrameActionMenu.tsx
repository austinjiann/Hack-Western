import { useEditor, useValue, TLShapeId, createShapeId, TLShapePartial, AssetRecordType, TLImageAsset } from 'tldraw'
import { Tooltip, Button, Flex } from "@radix-ui/themes";
import { Image as ImageIcon, Type } from "lucide-react";
import React, { useRef } from "react";

export const GlobalContextFrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
    const editor = useEditor()
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
                const frameW = "w" in frame.props ? (frame.props.w as number) : 4000;
                const frameH = "h" in frame.props ? (frame.props.h as number) : 5000;
                
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

    const handleAddText = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!frame) return;

        // Get frame dimensions
        const frameW = "w" in frame.props ? (frame.props.w as number) : 4000;
        const frameH = "h" in frame.props ? (frame.props.h as number) : 5000;
        
        // Center the text box within the frame (using relative coordinates since it's a child)
        // Text shapes auto-size, so we'll position it roughly in the center
        const x = frameW / 2;
        const y = frameH / 2;

        const textShapeId = createShapeId();
        const shape: TLShapePartial = {
            id: textShapeId,
            type: "text",
            x,
            y,
            parentId: frame.id, // Make it a child of the frame (uses relative coordinates)
            props: {},
        };

        editor.createShapes([shape]);
        editor.select(textShapeId);
        // Enter editing mode for the text
        editor.setEditingShape(textShapeId);
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
                    {/* Add Text */}
                    <Tooltip content="Add Text to Frame">
                        <Button 
                            variant="soft" 
                            size="3"
                            style={{ cursor: 'pointer', minWidth: '48px', minHeight: '48px' }}
                            onClick={handleAddText}
                        >
                            <Type size={40} />
                        </Button>
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
                </Flex>
            </div>
        </>
    )
}

