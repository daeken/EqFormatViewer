import {type} from "../common/globals.js"
import {Program} from './program.js'
import {Vector3} from '../common/vector.js'

export class Material {
	wantNormals = false
	fragmentShader
	
	staticProgram
	animatedProgram
	
	get fullFragmentShader() {
		return `#version 300 es
precision highp float;
uniform vec3 uFogColor;
uniform float uFogDensity;
in vec4 vPosition;
vec4 applyFog(vec4 color) {
	float dist = log(vPosition.z);
	return vec4(mix(color.rgb, uFogColor * mix(0.75 + (color.r + color.g + color.b) / 12., 0.75, smoothstep(log(3000.), log(3050.), dist)), clamp(pow(max(0., dist - log(750.)), 3.), 0., 1.)), color.a);
}
		` + this.fragmentShader
	}
	
	generateVertexShader(isAnimated) {
		if(isAnimated)
			throw 'Animated materials unsupported'
		else {
			let ret = `#version 300 es
precision highp float;
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;
uniform mat4 uModelMat;
uniform mat4 uProjectionViewMat;
out vec2 vTexCoord;
out vec4 vPosition;
			`
			if(this.wantNormals)
				ret += `
out vec3 vNormal;
				`
			ret += `
void main() {
	gl_Position = vPosition = uProjectionViewMat * uModelMat * aPosition;
	vTexCoord = aTexCoord;
			`
			if(this.wantNormals)
				ret += `
	mat3 nmat = transpose(inverse(mat3(uModelMat)));
	vNormal = normalize(nmat * aNormal);
				`
			return ret + `
}
			`
		}
	}

	getProgram(isAnimated) {
		if(isAnimated)
			return this.animatedProgram ??= new Program(this.generateVertexShader(true), this.fullFragmentShader)
		return this.staticProgram ??= new Program(this.generateVertexShader(false), this.fullFragmentShader)
	}
	
	useInternal(projView, isAnimated, program) {}
	
	use(projView, isAnimated) {
		const program = this.getProgram(isAnimated)
		program.use()
		this.useInternal(projView, isAnimated, program)
		program.setUniform('uFogColor', new Vector3(0.6))
	}
	
	set modelMatrix(value) {
		this.animatedProgram?.setUniform('uModelMat', value)
		this.staticProgram?.setUniform('uModelMat', value)
	}
	
	set interpolation(value) {
		this.animatedProgram?.setUniform('uInterp', value)
	}
}
