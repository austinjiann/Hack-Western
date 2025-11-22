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
} from 'tldraw'
import { GlobalContextFrameActionMenu } from '../components/canvas/GlobalContextFrameActionMenu'

export type IGlobalContextFrameShape = TLBaseShape<
	'global-context-frame',
	{
		w: number
		h: number
		title?: string
		backgroundColor?: string
		opacity?: number
		summary?: string // Legacy property for migration
		characters?: string // Legacy property for migration
	}
>

export class GlobalContextFrameShapeUtil extends BaseBoxShapeUtil<IGlobalContextFrameShape> {
	static override type = 'global-context-frame' as const
	static override props: RecordProps<IGlobalContextFrameShape> = {
		w: T.number,
		h: T.number,
		title: T.string.optional(),
		backgroundColor: T.string.optional(),
		opacity: T.number.optional(),
		summary: T.string.optional(), // Legacy property for migration
		characters: T.string.optional(), // Legacy property for migration
	}

	override getDefaultProps(): IGlobalContextFrameShape['props'] {
		return {
			w: 2000,
			h: 2400,
			title: 'Global Context Frame',
			backgroundColor: '#f8f9fa',
			opacity: 1,
		}
	}

	override getGeometry(shape: IGlobalContextFrameShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	override component(shape: IGlobalContextFrameShape) {
		const opacity = shape.props.opacity ?? 1;
		return (
			<HTMLContainer
				id={shape.id}
				style={{
					border: '2px solid #000',
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    pointerEvents: 'all',
                    position: 'relative',
                    opacity: 1, // Explicitly set to 1 to prevent tldraw from applying opacity
				}}
			>
                {/* Background layer with opacity */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: shape.props.backgroundColor || '#f8f9fa',
                    opacity: opacity,
                    pointerEvents: 'none',
                }} />
                
                {/* Title - always fully opaque, fixed name */}
                <div style={{
                    position: 'absolute',
                    top: -24,
                    left: 0,
                    background: 'black',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px 4px 0 0',
                    fontSize: 48,
                    fontWeight: 'bold',
                    fontFamily: 'Inter, sans-serif',
                    zIndex: 10,
                    opacity: 1, // Explicitly set to 1 to override any inherited opacity
                }}>
                    {shape.props.title || 'Global Context Frame'}
                </div>
                
                {/* Toolbar - always fully opaque */}
                <div style={{ position: 'relative', zIndex: 10, opacity: 1 }}>
                    <GlobalContextFrameActionMenu shapeId={shape.id} />
                </div>
			</HTMLContainer>
		)
	}

	override indicator(shape: IGlobalContextFrameShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
    
    override onResize(shape: IGlobalContextFrameShape, info: TLResizeInfo<IGlobalContextFrameShape>) {
        const resized = resizeBox(shape, info)
        return resized
    }

	override canReceiveNewChildrenOfType(_shape: IGlobalContextFrameShape, type: TLShape['type']) {
		// Allow text and images, but not other frames
		return type !== 'aspect-frame' && type !== 'global-context-frame'
	}

	override onDropShapesOver(shape: IGlobalContextFrameShape, shapes: TLShape[]) {
        const shapesToReparent = shapes.filter(s => s.type !== 'aspect-frame' && s.type !== 'global-context-frame');
        if (shapesToReparent.length === 0) return;
		this.editor.reparentShapes(
			shapesToReparent,
			shape.id
		)
	}

    override canResizeChildren(_shape: IGlobalContextFrameShape) {
        return true
    }
}

