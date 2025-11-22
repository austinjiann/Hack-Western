import { Tldraw } from 'tldraw'

function Canvas() {
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw />
		</div>
	)
}

export default Canvas
