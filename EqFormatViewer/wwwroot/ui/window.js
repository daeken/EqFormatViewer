import {Vector2} from '../common/vector.js'

export class Window {
	constructor(title='') {
		this.updaters = []
		this.element = document.createElement('div')
		this.element.classList.add('ui-window')
		document.getElementById('ui').appendChild(this.element)
		const titlebar = document.createElement('div')
		titlebar.classList.add('ui-window-titlebar')
		titlebar.innerText = title
		this.element.appendChild(titlebar)
		
		let dragging
		titlebar.addEventListener('mousedown', e => {
			//const pos = this.element.getBoundingClientRect()
			dragging = new Vector2(e.clientX, e.clientY)
			console.log(dragging)
		})
		window.addEventListener('mouseup', e => dragging = undefined)
		window.addEventListener('mousemove', e => {
			if(dragging === undefined) return
			const np = new Vector2(e.clientX, e.clientY)
			const delta = np.sub(dragging)
			const parse = x => x === undefined || x == '' ? 0 : parseInt('0' + x)
			console.log(this.element.style['margin-left'])
			const set = (side, change) => this.element.style[side] = `${parse(this.element.style[side]) + change}px`
			set('margin-left', delta.x)
			set('margin-top', delta.y)
			dragging = np
		})
		document.body.addEventListener('mouseleave', () => dragging = undefined)
		
		this.bodyContainer = document.createElement('div')
		this.bodyContainer.classList.add('ui-window-body')
		this.element.appendChild(this.bodyContainer)
	}
	
	body(body) {
		this.bodyContainer.innerHTML = body
		return this
	}
	
	bind(selector, eventOrTextCb, cb=null) {
		const element = this.bodyContainer.querySelector(selector)
		if(element != null) {
			if(cb == null) {
				this.updaters.push(() => element.innerText = eventOrTextCb(this))
				if(this.updaters.length == 1)
					this.update()
			} else
				element.addEventListener(eventOrTextCb, (...args) => cb(this, element, ...args))
		}
		return this
	}
	
	child(selector) {
		return this.bodyContainer.querySelector(selector)
	}
	
	update() {
		for(const cb of this.updaters)
			cb()
		window.requestAnimationFrame(this.update.bind(this))
	}
}
