import {Vector2} from '../common/vector.js'

export class Window {
	constructor(title='', id=null) {
		this.updaters = []
		this.element = document.createElement('div')
		this.element.classList.add('ui-window')
		document.getElementById('ui').appendChild(this.element)
		const titlebar = document.createElement('div')
		titlebar.classList.add('ui-window-titlebar')
		titlebar.innerText = title
		this.element.appendChild(titlebar)
		
		const storageKey = title == '' ? (id == null ? null : id + '-window-pos') : title
		if(storageKey) {
			const xpos = localStorage.getItem(storageKey)
			if(xpos) {
				const [x, y] = xpos.split('-')
				this.element.style['margin-left'] = `${Math.min(window.innerWidth - 10, parseInt(x))}px`
				this.element.style['margin-top'] = `${Math.min(window.innerHeight - 10, parseInt(y))}px`
			}
		}
		
		let dragging
		titlebar.addEventListener('mousedown', e => dragging = new Vector2(e.clientX, e.clientY))
		window.addEventListener('mouseup', e => dragging = undefined)
		window.addEventListener('mousemove', e => {
			if(dragging === undefined) return
			const np = new Vector2(e.clientX, e.clientY)
			const delta = np.sub(dragging)
			const parse = x => x === undefined || x == '' ? 0 : parseInt('0' + x)
			const set = (side, change) => this.element.style[side] = `${parse(this.element.style[side]) + change}px`
			set('margin-left', delta.x)
			set('margin-top', delta.y)
			if(storageKey)
				localStorage.setItem(storageKey, `${parse(this.element.style['margin-left'])}-${parse(this.element.style['margin-top'])}`)
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
