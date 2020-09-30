import {setGl, gl} from '../common/globals.js'
import {Matrix44} from '../common/matrix.js'
import {Vector3} from '../common/vector.js'
import {FpsCamera} from './fpsCamera.js'

export class Engine {
	models = []
	keys = {}
	frameTimes = []
	lastFrameTime = 0
	
	get fps() { return this.frameTimes.length == 0 ? 0 : 1000 / (this.frameTimes.reduce((t, v) => t + v) / this.frameTimes.length) }
	
	constructor(canvasId) {
		this.culling = true
		this.cvs = document.getElementById(canvasId)
		window.addEventListener('resize', this.resize.bind(this));
		setGl(this.cvs.getContext('webgl2'))
		if(!gl.getExtension('WEBGL_compressed_texture_s3tc')) throw 'No S3TC support'
		this.camera = new FpsCamera(new Vector3(0, -5, 0))
		this.resize()
		
		let pointer = false
		this.cvs.addEventListener('mousedown', e => {
			if(e.button != 0) return
			this.cvs.requestPointerLock()
			pointer = true
		})
		
		this.cvs.addEventListener('mousemove', e => {
			if(e.button != 0 || !pointer || (e.movementX == 0 && e.movementY == 0)) return
			this.camera.look(e.movementY * -0.005, e.movementX * -0.005)
		})
		
		this.cvs.addEventListener('mouseup',  e => {
			if(e.button != 0) return
			pointer = false
			document.exitPointerLock()
		})
		
		document.addEventListener('keydown', e => {
			if((e.target != document.body && e.target != this.cvs) || e.repeat) return
			this.keys[e.code] = Date.now()
			if(e.code != 'MetaLeft' && !this.keys['MetaLeft'])
				e.preventDefault()
			return false
		})
		
		document.addEventListener('keyup', e => delete this.keys[e.code])
	}
	
	addModel(model) {
		this.models.push(model)
		return this
	}
	
	deleteModel(model) {
		const index = this.models.indexOf(model)
		if(index != -1)
			this.models.splice(index, 1)
		return this
	}
	
	resize() {
		this.cvs.width = window.innerWidth
		this.cvs.height = window.innerHeight
		this.projectionMat = Matrix44.createPerspectiveFieldOfView(45 * (Math.PI / 180), this.cvs.width / this.cvs.height, 1, 5000)
		this.draw()
	}
	
	update() {
		const now = Date.now()
		
		let forward = 0, right = 0, up = 0
		for(const code of Object.keys(this.keys)) {
			const span = (now - this.keys[code]) / 1000
			this.keys[code] = now
			switch(code) {
				case 'KeyW':
					forward += span
					break
				case 'KeyS':
					forward -= span
					break
				case 'KeyD':
					right += span
					break
				case 'KeyA':
					right -= span
					break
				case 'KeyE':
					up += span
					break
				case 'KeyQ':
					up -= span
					break
			}
		}
		
		if(forward != 0 || right != 0 || up != 0) {
			const speed = 'ShiftLeft' in this.keys ? 250 : 10
			this.camera.move(new Vector3(right * speed, forward * speed, up * speed))
		}
		
		this.camera.update()
	}
	
	draw(ts = 0) {
		if(this.lastFrameTime != 0) {
			this.frameTimes.push(ts - this.lastFrameTime)
			while(this.frameTimes.length > 200)
				this.frameTimes.shift()
		}
		this.lastFrameTime = ts
		this.update()
		
		gl.viewport(0, 0, this.cvs.width, this.cvs.height)
		gl.clearColor(0.6, 0.6, 0.6, 1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		if(this.culling)
			gl.enable(gl.CULL_FACE)
		else
			gl.disable(gl.CULL_FACE)
		gl.cullFace(gl.BACK)
		gl.enable(gl.DEPTH_TEST)
		gl.disable(gl.SCISSOR_TEST)
		gl.enable(gl.BLEND)
		
		const projView = this.camera.viewMatrix.compose(this.projectionMat)
		
		for(const model of this.models)
			model.draw(projView)

		requestAnimationFrame(this.draw.bind(this))
	}
}
