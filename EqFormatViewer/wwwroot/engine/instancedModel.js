import {Buffer} from './buffer.js'

export class InstancedModel {
	meshes = []
	baked = false
	instanceArray
	instanceOffset = 0
	
	set instanceCount(value) {
		this.instanceArray = new Float32Array(value * 16) // Matrix44 == 4*4 elements
	}
	
	addTransform(matrix) {
		this.instanceArray.set(matrix.arrayBuffer, this.instanceOffset)
		this.instanceOffset += 16
	}
	
	bake() {
		if(this.instanceOffset != this.instanceArray.length) throw 'Not all instance transforms set for model'
		const count = this.instanceArray.length / 16
		const buffer = new Buffer(this.instanceArray)
		for(const mesh of this.meshes)
			mesh.bake(buffer, count)
		delete this.instanceArray
		this.baked = true
	}
	
	add(mesh) {
		this.meshes.push(mesh)
		return this
	}
	
	draw(projView) {
		if(!this.baked) throw 'Instanced model not baked'
		for(const mesh of this.meshes)
			mesh.draw(projView)
	}
}
