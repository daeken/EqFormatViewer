import {setGl, gl} from '../common/globals.js'
import {Matrix44} from '../common/matrix.js'
import {Vector3} from '../common/vector.js'
import {FpsCamera} from './fpsCamera.js'

export class Engine {
	models = []
	keys = {}
	
	constructor(canvasId) {
		this.cvs = document.getElementById(canvasId)
		window.addEventListener('resize', this.resize.bind(this));
		setGl(this.cvs.getContext('webgl2'))
		if(!gl.getExtension('WEBGL_compressed_texture_s3tc')) throw 'No S3TC support'
		this.camera = new FpsCamera(new Vector3(0, -5, 0))
		this.resize()
		
		let pointer = false
		this.cvs.addEventListener('mousedown', e => {
			this.cvs.requestPointerLock()
			pointer = true
		})
		
		this.cvs.addEventListener('mousemove', e => {
			if(!pointer || (e.movementX == 0 && e.movementY == 0)) return
			this.camera.look(e.movementY * -0.005, e.movementX * -0.005)
		})
		
		this.cvs.addEventListener('mouseup', () => {
			pointer = false
			document.exitPointerLock()
		})
		
		document.addEventListener('keydown', e => {
			if((e.target != document.body && e.target != this.cvs) || e.repeat) return
			this.keys[e.code] = Date.now()
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
		this.projectionMat = Matrix44.createPerspectiveFieldOfView(45 * (Math.PI / 180), this.cvs.width / this.cvs.height, 1, 2000)
		this.draw()
	}
	
	update() {
		const now = Date.now()
		
		let forward = 0, right = 0
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
			}
		}
		
		if(forward != 0 || right != 0)
			this.camera.move(new Vector3(right * 10, forward * 10, 0))
		
		this.camera.update()
	}
	
	draw() {
		this.update()
		
		gl.viewport(0, 0, this.cvs.width, this.cvs.height)
		gl.clearColor(1, 0, 0, 1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		//gl.enable(gl.CULL_FACE)
		//gl.cullFace(gl.BACK)
		gl.enable(gl.DEPTH_TEST)
		gl.disable(gl.SCISSOR_TEST)
		
		const projView = this.camera.viewMatrix.compose(this.projectionMat)
		
		for(const model of this.models)
			model.draw(projView)

		requestAnimationFrame(this.draw.bind(this))
	}
}
