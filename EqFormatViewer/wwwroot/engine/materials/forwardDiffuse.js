import {Matrix44} from '../../common/matrix.js'
import {gl, type} from '../../common/globals.js'
import {Material} from '../material.js'
import {Texture} from '../texture.js'

export class ForwardDiffuseMaterial extends Material {
	fragmentShader = `
in vec2 vTexCoord;
out vec4 color;
uniform sampler2D uTex;
void main() {
	color = vec4(texture(uTex, vTexCoord).rgb, 1.0);
	color = applyFog(color);
}
	`
	
	constructor(textures, animationSpeed = 0) {
		super()
		if(textures.length == 0) throw 'Must supply at least one texture for ForwardDiffuseMaterial'
		if(textures.length > 1 && animationSpeed == 0) throw 'Multiple textures for ForwardDiffuseMaterial but animationSpeed == 0'
		this.textures = textures
		this.animationSpeed = animationSpeed
	}
	
	useInternal(projView, isAnimated, program) {
		program.setUniform[type.i32]('uTex', 0)
		program.setUniform('uProjectionViewMat', projView)
		program.setUniform('uModelMat', Matrix44.identity)
		gl.activeTexture(gl.TEXTURE0)
		if(this.animationSpeed == 0)
			this.textures[0].use()
	}
}
