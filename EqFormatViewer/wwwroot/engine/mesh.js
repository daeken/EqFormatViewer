import {gl, type} from "../common/globals.js"
import {Buffer} from './buffer.js'
import {Vao} from './vao.js'

export class Mesh {
	constructor(material, vdata, indices) {
		this.material = material
		this.indexCount = indices.length
		this.vao = new Vao()
		this.vao.attach(new Buffer(indices, gl.ELEMENT_ARRAY_BUFFER))
		this.vao.attach(new Buffer(vdata, gl.ARRAY_BUFFER), [0, type.v3], [1, type.v3], [2, type.v2])
	}
	
	draw(projView, modelMatrix) {
		this.material.use(projView, false)
		this.material.modelMatrix = modelMatrix
		
		this.vao.bind(() => gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0))
	}
}
