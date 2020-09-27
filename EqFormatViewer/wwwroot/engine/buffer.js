import {gl} from "../common/globals.js"

export class Buffer {
	constructor(data, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) {
		this.id = gl.createBuffer()
		this.dataType = data.constructor.type
		this.target = target
		this.bind()
		gl.bufferData(target, data, usage, 0)
	}
	
	bind() {
		gl.bindBuffer(this.target, this.id)
	}
}
