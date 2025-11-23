import {
	BaseBoxShapeUtil,
	Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	T,
	TLBaseShape,
    TLResizeInfo,
    resizeBox,
    TLShape,
    useEditor,
    useValue,
    TLShapeId,
} from 'tldraw'
import { createPortal } from 'react-dom'
import { FrameActionMenu } from './FrameActionMenu'

// --- Frame Overlay Component for Blur Effect ---

const FrameOverlay = ({ shapeId }: { shapeId: string }) => {
    const editor = useEditor()

    const bounds = useValue(
        'frame-bounds',
        () => {
            const pageBounds = editor.getShapePageBounds(shapeId as TLShapeId)
            if (!pageBounds) return null
            const topLeft = editor.pageToViewport(pageBounds)
            const zoom = editor.getZoomLevel()
            return {
                x: topLeft.x,
                y: topLeft.y,
                w: pageBounds.w * zoom,
                h: pageBounds.h * zoom,
            }
        },
        [editor, shapeId]
    )

    if (!bounds) return null

    return createPortal(
        <div
            className="animate-blur-pulse"
            style={{
                position: 'fixed',
                top: bounds.y,
                left: bounds.x,
                width: bounds.w,
                height: bounds.h,
                zIndex: 999999,
                pointerEvents: 'none',
                borderRadius: 0, // Frames are usually rectangular
            }}
        />,
        document.body
    )
}

// --- Frame Shape ---

export type IFrameShape = TLBaseShape<
	'aspect-frame',
	{
		w: number
		h: number
		name?: string
		backgroundColor?: string
		opacity?: number
	}
>

export class FrameShapeUtil extends BaseBoxShapeUtil<IFrameShape> {
	static override type = 'aspect-frame' as const
	static override props: RecordProps<IFrameShape> = {
		w: T.number,
		h: T.number,
		name: T.string.optional(),
		backgroundColor: T.string.optional(),
		opacity: T.number.optional(),
	}

	override getDefaultProps(): IFrameShape['props'] {
		return {
			w: 960,
			h: 540,
			name: '16:9 Frame',
			backgroundColor: '#ffffff',
			opacity: 1,
		}
	}

	override getGeometry(shape: IFrameShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: false,
		})
	}

	override component(shape: IFrameShape) {
		const opacity = shape.props.opacity ?? 1;
        const isImproving = shape.meta?.isImproving === true;
        const isGeneratingVideo = shape.props.name === 'Generating...';

		return (
			<HTMLContainer
				id={shape.id}
				style={{
					border: isImproving || isGeneratingVideo ? 'none' : '2px dashed #000',
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    pointerEvents: 'all',
                    position: 'relative',
                    opacity: 1,
				}}
			>
                {/* External Portal Overlay for Blur Effect (Covers children) */}
                {(isImproving || isGeneratingVideo) && (
                    <FrameOverlay shapeId={shape.id} />
                )}

                {/* Click capture layer */}
                <div 
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 0,
                        pointerEvents: 'all',
                        cursor: 'pointer',
                        border: (isImproving || isGeneratingVideo) ? 'none' : 'none',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            this.editor.select(shape.id);
                        }
                    }}
                    onPointerDown={(_e) => {
                        this.editor.select(shape.id);
                    }}
                />

                {/* Background layer with opacity */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: shape.props.backgroundColor || '#ffffff',
                    opacity: opacity,
                    pointerEvents: 'none',
                    zIndex: 1,
                }} />
                
                {/* Title - always fully opaque */}
                
                {/* Title - always fully opaque */}
                <div style={{
                    position: 'absolute',
                    top: -24,
                    left: 0,
                    background: 'transparent',
                    color: '#000000',
                    padding: '0',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    zIndex: 10,
                    opacity: 1,
                    pointerEvents: 'none',
                }}>
                    {shape.props.name || '16:9 Frame'}
                </div>
                
                {/* Toolbar - always fully opaque */}
                <div style={{ position: 'relative', zIndex: 10, opacity: 1 }}>
                    <FrameActionMenu shapeId={shape.id} />
                </div>
			</HTMLContainer>
		)
	}

	override indicator(shape: IFrameShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
    
    override onResize(shape: IFrameShape, info: TLResizeInfo<IFrameShape>) {
        const resized = resizeBox(shape, info)
        const { w: newW, h: newH } = resized.props
        
        const ratio = 16 / 9
        
        const isVertical = info.handle === 'top' || info.handle === 'bottom'
        const isHorizontal = info.handle === 'left' || info.handle === 'right'
        
        if (isVertical) {
            // Height changed, update width
            return {
                ...resized,
                props: { ...resized.props, w: newH * ratio }
            }
        } else if (isHorizontal) {
            // Width changed, update height
            return {
                ...resized,
                props: { ...resized.props, h: newW / ratio }
            }
        } else {
            // Corner - use width as master
            return {
                ...resized,
                props: { ...resized.props, h: newW / ratio }
            }
        }
    }

	override canReceiveNewChildrenOfType(_shape: IFrameShape, type: TLShape['type']) {
		return type !== 'aspect-frame' && type !== 'arrow'
	}

	override onDropShapesOver(shape: IFrameShape, shapes: TLShape[]) {
        const shapesToReparent = shapes.filter(s => s.type !== 'aspect-frame');
        if (shapesToReparent.length === 0) return;
		this.editor.reparentShapes(
			shapesToReparent,
			shape.id
		)
	}

    override canResizeChildren(_shape: IFrameShape) {
        return true
    }
}
