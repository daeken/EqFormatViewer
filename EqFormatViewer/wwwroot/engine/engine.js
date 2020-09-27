import {setGl, gl} from '../common/globals.js'
import {Matrix44} from '../common/matrix.js'
import {Vector3} from '../common/vector.js'

export class Engine {
	models = []
	
	constructor(canvasId) {
		this.cvs = document.getElementById(canvasId)
		window.addEventListener('resize', this.resize.bind(this));
		setGl(this.cvs.getContext('webgl2'))
		if(!gl.getExtension('WEBGL_compressed_texture_s3tc')) throw 'No S3TC support'
		this.resize()
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
	
	draw() {
		gl.viewport(0, 0, this.cvs.width, this.cvs.height)
		gl.clearColor(1, 0, 0, 1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.enable(gl.CULL_FACE)
		gl.cullFace(gl.BACK)
		gl.enable(gl.DEPTH_TEST)
		gl.disable(gl.SCISSOR_TEST)
		
		const view = Matrix44.createLookAt(
			new Vector3(0, 0, 5), 
			new Vector3(), 
			Vector3.unitY
		)
		const projView = view.compose(this.projectionMat)
		
		for(const model of this.models)
			model.draw(projView)

		requestAnimationFrame(this.draw.bind(this))
	}
}
