import {gl, type, genericFunction} from '../common/globals.js'
import {Vector2, Vector3, Vector4} from '../common/vector.js'
import {Matrix44} from '../common/matrix.js'

let current
const shaderCache = {}
const programCache = {}

const compileShader = (source, type) => {
	if(source in shaderCache) return shaderCache[source]
	const id = shaderCache[source] = gl.createShader(type)
	gl.shaderSource(id, source)
	gl.compileShader(id)
	if(gl.getShaderParameter(id, gl.COMPILE_STATUS) != 1)
		throw `Shader compilation failed:\n${gl.getShaderInfoLog(id)}\n\n\n${source}`
	return id
}

export class Program {
	locationCache = {}
	
	constructor(vs, fs) {
		const key = vs+fs
		if(key in programCache) {
			this.id = programCache[key]
			return
		}
		
		programCache[key] = this.id = gl.createProgram()
		gl.attachShader(this.id, compileShader(vs, gl.VERTEX_SHADER))
		gl.attachShader(this.id, compileShader(fs, gl.FRAGMENT_SHADER))
		gl.linkProgram(this.id)
		
		if(gl.getProgramParameter(this.id, gl.LINK_STATUS) != 1)
			throw `Program linking failed:\n${gl.getProgramInfoLog(this.id)}\n\n\nVERTEX SHADER\n${vs}\n\n\nFRAGMENT SHADER\n${fs}`
	}
	
	use() {
		if(current === this.id) return
		gl.useProgram(current = this.id)
	}
	
	setUniform = genericFunction(this, function(T, name, value) {
		if(T === undefined) {
			if(value instanceof Vector2) T = type.v2
			else if(value instanceof Vector3) T = type.v3
			else if(value instanceof Vector4) T = type.v4
			else if(value instanceof Matrix44) T = type.m44
			else if(typeof value == 'number') T = type.f32
		}
		this.use()
		const location = (this.locationCache[name] ??= gl.getUniformLocation(this.id, name))
		if(location == null) return
		switch(T) {
			case type.f32:
				gl.uniform1f(location, value)
				break
			case type.i32:
				gl.uniform1i(location, value)
				break
			case type.u32:
				gl.uniform1ui(location, value)
				break
			case type.v2:
				gl.uniform2f(location, value.x, value.y)
				break
			case type.v3:
				gl.uniform3f(location, value.x, value.y, value.z)
				break
			case type.v4:
				gl.uniform4f(location, value.x, value.y, value.z, value.w)
				break
			case type.m44:
				gl.uniformMatrix4fv(location, false, value.arrayBuffer)
				break
			default:
				throw 'Unsupported uniform type: ' + T.toString()
		}
	})
}
