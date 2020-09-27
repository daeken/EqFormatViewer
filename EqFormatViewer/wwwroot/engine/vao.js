import {gl, type} from "../common/globals.js"

export class Vao {
	attachedBuffers = []
	
	constructor() { this.id = gl.createVertexArray() }
	
	bind(cb = null) {
		if(Vao.current != this.id)
			gl.bindVertexArray(Vao.current = this.id)
		if(cb !== null) {
			cb()
			gl.bindVertexArray(Vao.current = null)
		}
	}
	
	unbind() {
		if(Vao.current == this.id)
			gl.bindVertexArray(Vao.current = null)
	}
	
	attach(buffer, ...attributes) {
		const instanced = attributes.length && (attributes[0] === false || attributes[1] === true) ? attributes.shift() : false
		this.attachedBuffers.push(buffer)
		
		this.bind(() => {
			buffer.bind()
			if(attributes.length == 0) return

			let stride = 0
			const offsets = attributes.map(attr => {
				const [name, atype, acount] = attr
				const offset = stride
				const [esize, glType, tcount] = (() => {
					switch(atype) {
						case type.u8: return [1, gl.UNSIGNED_BYTE]
						case type.i8: return [1, gl.BYTE]
						case type.u16: return [2, gl.UNSIGNED_SHORT]
						case type.i16: return [2, gl.SHORT]
						case type.f32: return [4, gl.FLOAT]
						case type.v2:  return [4, gl.FLOAT, 2]
						case type.v3:  return [4, gl.FLOAT, 3]
						case type.v4:  return [4, gl.FLOAT, 4]
						case type.m44:  return [4, gl.FLOAT, 16]
						default: throw 'Unknown type for VAO: ' + atype.toString()
					}
				})()
				const count =
					acount === undefined && tcount === undefined
						? 1
						: acount === undefined
							? tcount
							: tcount === undefined
								? acount
								: tcount * acount
				stride += esize * count
				return [name, glType, offset, esize, count]
			})

			for(const [_name, atype, offset, size, count] of offsets)
				for(let name = _name, i = 0; i < count; i += 4, name++) {
					gl.enableVertexAttribArray(name)
					gl.vertexAttribPointer(name, Math.min(count, 4), atype, atype == gl.UNSIGNED_BYTE, stride, offset + i * size)
					if(instanced)
						gl.vertexAttribDivisor(name, 1)
				}
		})
	}
}
Vao.current = null
