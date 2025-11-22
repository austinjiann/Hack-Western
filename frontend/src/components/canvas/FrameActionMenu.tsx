import { useEditor, useValue, TLShapeId, createShapeId, TLShapePartial, createBindingId } from 'tldraw'
import { Tooltip } from "@radix-ui/themes";
import { Sparkles } from "lucide-react";

export const FrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
    const editor = useEditor()
    
    // Check if this specific shape is selected
    const isSelected = useValue(
        'is selected', 
        () => editor.getSelectedShapeIds().includes(shapeId), 
        [editor, shapeId]
    )

    if (!isSelected ) return null

    const handleGenerate = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent deselecting the frame
        
        const currentFrame = editor.getShape(shapeId);
        if (!currentFrame) return;

        const FRAME_WIDTH = 1920;
        const FRAME_HEIGHT = 1080;
        const GAP = 200;

        // Calculate new frame position (to the right)
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
            },
        };

        // Create the arrow connecting them
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
        
        // Create bindings
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
        
        // Select the new frame
        editor.select(newFrameId);
        
        // Center view on the new frame
        editor.zoomToBounds(editor.getShapePageBounds(newFrameId)!, { animation: { duration: 200 } });
    }

    return (
        <div 
            className="absolute top-1/2 -right-16 -translate-y-1/2 pointer-events-auto z-50"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging the frame when clicking the menu
        >
             <Tooltip content="Generate">
                <button 
                    onClick={handleGenerate}
                    className="flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer border-4 border-white"
                >
                    <Sparkles size={24} />
                </button>
            </Tooltip>
        </div>
    )
}
