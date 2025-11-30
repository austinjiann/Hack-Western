import {
  useEditor,
  useValue,
  TLShapeId,
  createShapeId,
  TLShapePartial,
  AssetRecordType,
  TLImageAsset,
} from "tldraw";
import { Tooltip, Button, Flex, TextField } from "@radix-ui/themes";
import {
  Sparkles,
  Image as ImageIcon,
  Palette,
  Type,
  Banana,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useGlobalContext } from "../../hooks/useGlobalContext";
import { apiFetch } from "../../utils/api";
import { useFrameGraphContext } from "../../contexts/FrameGraphContext";

export const FrameActionMenu = ({ shapeId }: { shapeId: TLShapeId }) => {
  const editor = useEditor();
  const { context } = useGlobalContext("global-context");
  const frameGraph = useFrameGraphContext(); // May be null during SVG export
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSelected = useValue(
    "is selected",
    () => editor.getSelectedShapeIds().includes(shapeId),
    [editor, shapeId],
  );

  const frame = useValue("frame", () => editor.getShape(shapeId), [
    editor,
    shapeId,
  ]);

  // Log path when frame is selected
  useEffect(() => {
    if (isSelected && frame && frameGraph) {
      const path = frameGraph.getFramePath(shapeId);
      console.log("=== Frame Selected ===");
      console.log(`Frame ID: ${shapeId.slice(0, 8)}...`);
      console.log(
        `Frame Name: ${(frame.props as { name?: string }).name || "Unnamed"}`,
      );
      console.log(`Path from root (${path.length} frames):`);
      path.forEach((node, index) => {
        const nodeFrame = editor.getShape(node.frameId);
        const frameName =
          nodeFrame && nodeFrame.type === "aspect-frame"
            ? (nodeFrame.props as { name?: string }).name || "Unnamed"
            : "Unknown";
        console.log(
          `  ${index + 1}. ${frameName} (${node.frameId.slice(0, 8)}...) - arrow: ${node.arrowId ? node.arrowId.slice(0, 8) + "..." : "null"}`,
        );
      });
      console.log("=====================");
    }
  }, [isSelected, shapeId, frame, frameGraph, editor]);

  if (!frame) return null;

  const showToolbar = isSelected;
  const showTextBox = isSelected || promptText.trim() !== "";

  const handleBackgroundColorChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    e.stopPropagation();
    editor.updateShapes([
      {
        id: shapeId,
        type: "aspect-frame",
        props: {
          ...frame.props,
          backgroundColor: e.target.value,
        },
      },
    ]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file || !frame) {
      if (fileInputRef.current) fileInputRef.current.value = "";
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

        const frameW = "w" in frame.props ? (frame.props.w as number) : 960;
        const frameH = "h" in frame.props ? (frame.props.h as number) : 540;

        // Scale image to fit within frame while maintaining aspect ratio
        const scale = Math.min(frameW / img.width, frameH / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;

        // Center image within frame (relative coordinates as child of frame)
        const x = (frameW - scaledW) / 2;
        const y = (frameH - scaledH) / 2;

        const imageShapeId = createShapeId();
        const shape: TLShapePartial = {
          id: imageShapeId,
          type: "image",
          x,
          y,
          parentId: frame.id,
          props: {
            assetId,
            w: scaledW,
            h: scaledH,
          },
        };

        editor.createShapes([shape]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };

      img.onerror = () => {
        console.error("Failed to load image");
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.src = dataUrl;
    };

    reader.onerror = () => {
      console.error("Failed to read file");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const processBase64ImageData = (imageBytes: any): string => {
    let base64String: string;

    if (Array.isArray(imageBytes)) {
      // Convert byte array to base64
      const bytes = new Uint8Array(imageBytes);
      const binaryString = Array.from(bytes, (byte) =>
        String.fromCharCode(byte),
      ).join("");
      base64String = btoa(binaryString);
    } else if (typeof imageBytes === "string") {
      // Extract base64 from data URL if present
      if (imageBytes.startsWith("data:image/")) {
        const commaIndex = imageBytes.indexOf(",");
        base64String =
          commaIndex !== -1 ? imageBytes.substring(commaIndex + 1) : imageBytes;
      } else {
        base64String = imageBytes;
      }

      // Clean whitespace
      let cleanedBase64 = base64String.replace(/[\s\r\n\t]/g, "");

      // Convert base64url to standard base64 if needed
      if (cleanedBase64.includes("_") || cleanedBase64.includes("-")) {
        cleanedBase64 = cleanedBase64.replace(/-/g, "+").replace(/_/g, "/");
        const paddingNeeded = (4 - (cleanedBase64.length % 4)) % 4;
        if (paddingNeeded > 0) {
          cleanedBase64 += "=".repeat(paddingNeeded);
        }
      }

      // Validate and fix padding
      let canDecode = false;
      try {
        atob(cleanedBase64.substring(0, Math.min(100, cleanedBase64.length)));
        canDecode = true;
      } catch {
        // Will clean below
      }

      if (canDecode) {
        const paddingNeeded = (4 - (cleanedBase64.length % 4)) % 4;
        if (paddingNeeded > 0 && paddingNeeded < 4) {
          cleanedBase64 += "=".repeat(paddingNeeded);
        }
        try {
          atob(cleanedBase64);
          base64String = cleanedBase64;
        } catch {
          canDecode = false;
        }
      }

      // Remove invalid characters if decode failed
      if (!canDecode) {
        let testBase64 = cleanedBase64.replace(/[^A-Za-z0-9+/=]/g, "");
        const paddingNeeded = (4 - (testBase64.length % 4)) % 4;
        if (paddingNeeded > 0 && paddingNeeded < 4) {
          testBase64 += "=".repeat(paddingNeeded);
        }

        try {
          atob(testBase64.substring(0, Math.min(10000, testBase64.length)));
          atob(testBase64);
          base64String = testBase64;
        } catch {
          throw new Error("Could not create valid base64 from response");
        }
      }
    } else {
      throw new Error(
        `Invalid image data format: ${typeof imageBytes}. Expected array or string.`,
      );
    }

    if (!base64String || base64String.length === 0) {
      throw new Error("Base64 string is empty after processing");
    }

    // Validate base64 can be decoded
    try {
      atob(base64String);
      return `data:image/png;base64,${base64String}`;
    } catch {
      throw new Error("Invalid base64 string - cannot decode image data");
    }
  };

  const validateImageLoad = async (
    dataUrl: string,
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error("Image load timeout - data may be corrupted"));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load image - invalid image data"));
      };
      img.src = dataUrl;
    });
  };

  const handleImprove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentFrame = editor.getShape(shapeId);
    if (!currentFrame) return;

    setIsImproving(true);

    // Store loading state in frame meta
    editor.updateShapes([
      {
        id: shapeId,
        type: "aspect-frame",
        meta: { ...currentFrame.meta, isImproving: true },
      },
    ]);

    // Disable editor during export
    editor.updateInstanceState({ isReadonly: true });

    try {
      // Deselect to avoid capturing toolbar in image
      editor.selectNone();

      const frameW =
        "w" in currentFrame.props ? (currentFrame.props.w as number) : 960;
      const frameH =
        "h" in currentFrame.props ? (currentFrame.props.h as number) : 540;

      const { blob } = await editor.toImage([shapeId], {
        format: "png",
        scale: 1,
        background: true,
        padding: 0,
      });

      editor.select(shapeId);
      editor.updateInstanceState({ isReadonly: false });

      if (!blob) {
        toast.error("Failed to export frame as image");
        return;
      }

      const backend_url =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

      const formData = new FormData();
      formData.append("image", blob, "frame.png");

      const response = await apiFetch(`${backend_url}/api/gemini/image`, {
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

      // Process and validate image data
      const imageDataUrl = processBase64ImageData(result.image_bytes);
      const img = await validateImageLoad(imageDataUrl);

      // Create asset from improved image
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

      // Delete existing children before creating new content
      const childIds = editor.getSortedChildIdsForParent(shapeId);
      if (childIds.length > 0) {
        editor.deleteShapes(childIds);
      }

      // Create new image shape
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

      editor.createAssets([asset]);
      editor.createShapes([imageShape]);

      setIsImproving(false);
      editor.updateShapes([
        {
          id: shapeId,
          type: "aspect-frame",
          meta: { ...editor.getShape(shapeId)?.meta, isImproving: false },
        },
      ]);
      editor.updateInstanceState({ isReadonly: false });
    } catch (error) {
      toast.error(
        `Failed to improve frame: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsImproving(false);

      const errorFrame = editor.getShape(shapeId);
      if (errorFrame) {
        editor.updateShapes([
          {
            id: shapeId,
            type: "aspect-frame",
            meta: { ...errorFrame.meta, isImproving: false },
          },
        ]);
      }
      editor.updateInstanceState({ isReadonly: false });
    }
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentName =
      "name" in frame.props ? (frame.props.name as string) : "16:9 Frame";
    setNameValue(currentName);
    setIsEditingName(true);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.stopPropagation();
    editor.updateShapes([
      {
        id: shapeId,
        type: "aspect-frame",
        props: {
          ...frame.props,
          name: nameValue || "16:9 Frame",
        },
      },
    ]);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setNameValue("");
  };

  // Count arrows that start from this frame (for tree branching)
  const getExistingBranchCount = (frameId: TLShapeId): number => {
    const bindings = editor.getBindingsToShape(frameId, "arrow");
    return bindings.filter((b) => {
      const props = b.props as { terminal?: string };
      return props.terminal === "start";
    }).length;
  };

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentFrame = editor.getShape(shapeId);
    if (!currentFrame) return;

    // Deselect to avoid capturing toolbar
    editor.selectNone();

    const frameW =
      "w" in currentFrame.props ? (currentFrame.props.w as number) : 960;
    const frameH =
      "h" in currentFrame.props ? (currentFrame.props.h as number) : 540;

    const { blob } = await editor.toImage([shapeId], {
      format: "png",
      scale: 1,
      background: true,
      padding: 0,
    });

    editor.select(shapeId);

    const backend_url = import.meta.env.VITE_BACKEND_URL || "";

    const formData = new FormData();
    formData.append("custom_prompt", promptText);
    formData.append(
      "global_context",
      JSON.stringify(context?.sceneState ?? {}),
    );
    formData.append("files", blob);

    try {
      const response = await apiFetch(`${backend_url}/api/jobs/video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate video");
      }

      const jsonObj = await response.json();
      if (jsonObj.job_id === undefined) {
        throw Error("Server did not return job id");
      }

      const jobId = jsonObj.job_id;
      const pageId = editor.getCurrentPageId();

      // Create new frame with vertical offset for branching
      const newFrameId = createShapeId();
      const gap = 2000;
      const branchCount = getExistingBranchCount(shapeId);
      const verticalGap = frameH + 200;
      const newFrameX = currentFrame.x + frameW + gap;
      const newFrameY = currentFrame.y + branchCount * verticalGap;

      editor.createShapes([
        {
          id: newFrameId,
          type: "aspect-frame",
          x: newFrameX,
          y: newFrameY,
          parentId: pageId,
          props: {
            w: frameW,
            h: frameH,
            name: "Generating...",
          },
        },
      ]);

      // Clone source image to new frame temporarily
      const sourceFrameChildren = editor.getSortedChildIdsForParent(shapeId);
      const sourceImageShape = sourceFrameChildren
        .map((id) => editor.getShape(id))
        .find((shape) => shape?.type === "image");

      if (sourceImageShape && sourceImageShape.type === "image") {
        const clonedImageId = createShapeId();
        const imageProps = sourceImageShape.props as {
          assetId: string;
          w: number;
          h: number;
        };
        editor.createShapes([
          {
            id: clonedImageId,
            type: "image",
            x: sourceImageShape.x,
            y: sourceImageShape.y,
            parentId: newFrameId,
            props: {
              assetId: imageProps.assetId,
              w: imageProps.w,
              h: imageProps.h,
            },
          },
        ]);
      }

      // Create arrow connecting frames
      const arrowId = createShapeId();
      editor.createShapes([
        {
          id: arrowId,
          type: "arrow",
          parentId: pageId,
          props: {
            start: {
              x: currentFrame.x + frameW,
              y: currentFrame.y + frameH / 2,
            },
            end: { x: newFrameX, y: newFrameY + frameH / 2 },
          },
        },
      ]);

      // Bind arrow to frames
      editor.createBinding({
        type: "arrow",
        fromId: arrowId,
        toId: shapeId,
        props: { terminal: "start", isPrecise: true },
      });

      editor.createBinding({
        type: "arrow",
        fromId: arrowId,
        toId: newFrameId,
        props: { terminal: "end", isPrecise: true },
      });

      // Store job metadata in arrow
      editor.updateShapes([
        {
          id: arrowId,
          type: "arrow",
          meta: {
            jobId,
            status: "pending",
            videoUrl: null,
            timer: 0,
            startTime: Date.now(),
          },
        },
      ]);

      // Add frame node to graph
      if (frameGraph) {
        frameGraph.addFrameNode(newFrameId, arrowId, shapeId);

        // Log the graph map
        console.log("Frame Graph Map:", frameGraph.getGraph());
      }
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast.error("Failed to generate video");
    }
  };

  const backgroundColor =
    "backgroundColor" in frame.props
      ? (frame.props.backgroundColor as string)
      : "#ffffff";
  const frameHeight = "h" in frame.props ? (frame.props.h as number) : 540;
  const frameWidth = "w" in frame.props ? (frame.props.w as number) : 960;
  const isLocked =
    "isLocked" in frame.props ? (frame.props.isLocked as boolean) : false;

  // Scale text box based on frame dimensions
  const textBoxWidth = frameWidth;
  const fontSize = Math.max(14, Math.min(frameWidth * 0.025, 24));

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    editor.updateShapes([
      {
        id: shapeId,
        type: "aspect-frame",
        props: {
          ...frame.props,
          isLocked: !isLocked,
        },
      },
    ]);
  };

  return (
    <>
      {/* Toolbar above frame */}
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
                    if (e.key === "Escape") {
                      handleNameCancel();
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      handleNameSubmit(e as any);
                    }
                  }}
                  onBlur={handleNameCancel}
                  autoFocus
                  style={{ width: "500px", fontSize: "16px" }}
                />
              </form>
            ) : (
              <Tooltip content="Name Frame">
                <Button
                  variant="soft"
                  size="3"
                  onClick={handleNameClick}
                  style={{
                    cursor: "pointer",
                    minWidth: "48px",
                    minHeight: "48px",
                  }}
                >
                  <Type size={40} />
                </Button>
              </Tooltip>
            )}

            {/* Background Color */}
            <Tooltip content="Change Background">
              <Button
                variant="soft"
                size="3"
                style={{
                  cursor: "pointer",
                  minWidth: "48px",
                  minHeight: "48px",
                }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "color";
                  input.value = backgroundColor;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    handleBackgroundColorChange({
                      target,
                      stopPropagation: () => {},
                    } as any);
                  };
                  input.click();
                }}
              >
                <Palette size={40} />
              </Button>
            </Tooltip>

            {/* Upload Image */}
            <Tooltip content="Upload Image to Frame">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Button
                  variant="soft"
                  size="3"
                  style={{
                    cursor: "pointer",
                    minWidth: "48px",
                    minHeight: "48px",
                  }}
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
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    pointerEvents: "none",
                  }}
                  onChange={handleImageUpload}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </Tooltip>

            {/* Generate Next Frame */}
            <Tooltip content="Generate Next Frame">
              <Button
                variant="soft"
                color="indigo"
                size="3"
                onClick={handleGenerate}
                style={{
                  cursor: "pointer",
                  minWidth: "48px",
                  minHeight: "48px",
                }}
              >
                <Sparkles size={40} />
              </Button>
            </Tooltip>

            {/* Improve Frame */}
            <Tooltip content="Improve Frame">
              <Button
                variant="soft"
                size="3"
                onClick={handleImprove}
                disabled={isImproving}
                style={{
                  cursor: isImproving ? "not-allowed" : "pointer",
                  minWidth: "48px",
                  minHeight: "48px",
                  opacity: isImproving ? 0.6 : 1,
                }}
              >
                {isImproving ? (
                  <Loader2 size={40} className="animate-spin" />
                ) : (
                  <Banana size={40} />
                )}
              </Button>
            </Tooltip>

            {/* Lock/Unlock Frame Content */}
            <Tooltip content={isLocked ? "Unlock Content" : "Lock Content"}>
              <Button
                variant="soft"
                size="3"
                onClick={handleToggleLock}
                style={{
                  cursor: "pointer",
                  minWidth: "48px",
                  minHeight: "48px",
                }}
              >
                {isLocked ? <Lock size={40} /> : <Unlock size={40} />}
              </Button>
            </Tooltip>
          </Flex>
        </div>
      )}

      {/* Prompt text box below frame */}
      {showTextBox && (
        <div
          className="absolute pointer-events-auto z-50"
          style={{
            top: `${frameHeight + 20}px`,
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-full shadow-xl flex items-center border border-gray-100"
            style={{
              width: `${textBoxWidth}px`,
              padding: "12px 24px",
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
                if (e.key === "Enter") {
                  handleGenerate(e as any);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
