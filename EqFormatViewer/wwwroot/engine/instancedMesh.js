import {gl, type} from "../common/globals.js"
import {Buffer} from './buffer.js'
import {Vao} from './vao.js'
import {Mesh} from './mesh.js'

export class InstancedMesh extends Mesh {
	instanceCount
	baked = false
	
	bake(instanceData, instanceCount) {
		this.vao.attach(instanceData, true, [3, type.m44])
		this.instanceCount = instanceCount
		this.material.instanced = true
		this.baked = true
	}

	draw(projView) {
		if(!this.baked) throw 'Instanced mesh not baked'
		
		this.material.use(projView, false)

		this.vao.bind(() => gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0, this.instanceCount))
	}
}