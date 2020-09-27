import {Matrix44} from '../common/matrix.js'
import {Mesh} from './mesh.js'

export class Model {
	meshes = []
	transform = Matrix44.identity
	
	add(mesh) {
		this.meshes.push(mesh)
		return this
	}
	
	draw(projView) {
		for(const mesh of this.meshes)
			mesh.draw(projView, this.transform)
	}
}

Model.createSquare = material => new Model().add(new Mesh(
	material, 
	new Float32Array([
		-1, 0, -1,  0, 0, -1,  0, 1,
		 1, 0, -1,  0, 0, -1,  1, 1,
		 1, 0,  1,  0, 0, -1,  1, 0,
		-1, 0,  1,  0, 0, -1,  0, 0,
	]), 
	new Uint32Array([
		0, 1, 2, 
		0, 2, 3
	])
))
