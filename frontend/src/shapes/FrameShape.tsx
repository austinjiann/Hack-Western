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
import { FrameActionMenu } from '../components/canvas/FrameActionMenu'

export type IFrameShape = TLBaseShape<
	'aspect-frame',
	{
		w: number
		h: number
	}
>

export class FrameShapeUtil extends BaseBoxShapeUtil<IFrameShape> {
	static override type = 'aspect-frame' as const
	static override props: RecordProps<IFrameShape> = {
		w: T.number,
		h: T.number,
	}

	override getDefaultProps(): IFrameShape['props'] {
		return {
			w: 960,
			h: 540,
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
		return (
			<HTMLContainer
				id={shape.id}
				style={{
					border: '2px solid #000',
                    width: '100%',
                    height: '100%',
                    boxSizing: 'border-box',
                    pointerEvents: 'all',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
				}}
			>
                <div style={{
                    position: 'absolute',
                    top: -24,
                    left: 0,
                    background: 'black',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px 4px 0 0',
                    fontSize: 12,
                    fontWeight: 'bold',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    16:9 Frame
                </div>
                <FrameActionMenu shapeId={shape.id} />
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

	override canReceiveNewChildrenOfType(_shape: IFrameShape, _type: TLShape['type']) {
		return true
	}

	override onDropShapesOver(shape: IFrameShape, shapes: TLShape[]) {
		this.editor.reparentShapes(
			shapes,
			shape.id
		)
	}

    override canResizeChildren(_shape: IFrameShape) {
        return true
    }
}
