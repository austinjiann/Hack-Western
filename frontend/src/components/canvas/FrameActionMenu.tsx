import { useEditor, useValue, TLShapeId } from 'tldraw'
import { Tooltip } from "@radix-ui/themes";
import { Sparkles } from "lucide-react";
import { exportFrame } from '../../utils/exportUtils';

export const FrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
    const editor = useEditor()
    
    // Check if this specific shape is selected
    const isSelected = useValue(
        'is selected', 
        () => editor.getSelectedShapeIds().includes(shapeId), 
        [editor, shapeId]
    )

    if (!isSelected) return null

    const handleGenerate = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent deselecting the frame
        exportFrame(editor, shapeId);
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
