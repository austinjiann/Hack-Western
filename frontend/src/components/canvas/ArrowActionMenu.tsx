import { useEditor, useValue } from 'tldraw'
import { Play } from "lucide-react";
import { Tooltip } from "@radix-ui/themes";

export const ArrowActionMenu = () => {
    const editor = useEditor()
    
    const info = useValue(
        'arrow info',
        () => {
            const selected = editor.getSelectedShapeIds();
            if (selected.length !== 1) return null;
            
            const shapeId = selected[0];
            const shape = editor.getShape(shapeId);
            if (!shape || shape.type !== 'arrow') return null;
            
            const bounds = editor.getShapePageBounds(shapeId);
            if (!bounds) return null;
            
            const center = {
                x: bounds.x + bounds.w / 2,
                y: bounds.y + bounds.h / 2
            };
            
            const viewportPoint = editor.pageToViewport(center);
            
            return {
                id: shapeId,
                x: viewportPoint.x,
                y: viewportPoint.y
            };
        },
        [editor]
    )

    if (!info) return null;

    return (
        <div 
            style={{
                position: 'absolute',
                top: info.y,
                left: info.x,
                transform: 'translate(-50%, -50%)',
                zIndex: 2000,
                pointerEvents: 'auto'
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
             <Tooltip content="Play">
                <button 
                    className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer border-2 border-white"
                    onClick={() => {
                        console.log("Play arrow", info.id);
                    }}
                >
                    <Play size={14} fill="currentColor" />
                </button>
            </Tooltip>
        </div>
    )
}
