import React from "react";
import { Button, Flex, Tooltip } from "@radix-ui/themes";
import { Eraser, Image as ImageIcon, FileText } from "lucide-react";

interface CanvasToolbarProps {
  onClear: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateGlobalContextFrame: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onClear,
  onImport,
  onCreateGlobalContextFrame,
}) => {
  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <Flex 
        gap="3" 
        p="2" 
        className="bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Tooltip content="Clear Canvas">
            <Button variant="soft" color="red" onClick={onClear} style={{ cursor: 'pointer' }}>
                <Eraser size={16} />
                Clear
            </Button>
        </Tooltip>
        
        <Tooltip content="Import Image">
            <Button variant="surface" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                <ImageIcon size={16} />
                Import
                <input
                    type="file"
                    accept="image/*"
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        opacity: 0, 
                        cursor: 'pointer' 
                    }}
                    onChange={onImport}
                />
            </Button>
        </Tooltip>

        <Tooltip content="Create Global Context Frame">
            <Button variant="soft" color="blue" onClick={onCreateGlobalContextFrame} style={{ cursor: 'pointer' }}>
                <FileText size={16} />
                Global Context
            </Button>
        </Tooltip>
      </Flex>
    </div>
  );
};
