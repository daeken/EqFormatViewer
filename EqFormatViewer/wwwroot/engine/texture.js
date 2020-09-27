import {gl} from "../common/globals.js"

export class Texture {
	constructor(layers, format = gl.RGBA, transparent = false) {
		this.width = layers[0].width
		this.height = layers[0].height
		gl.bindTexture(gl.TEXTURE_2D, this.id = gl.createTexture())
		const filter = transparent ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
		for(let i = 0; i < layers.length; ++i)
			if(format == gl.RGBA || format == gl.RGB)
				gl.texImage2D(gl.TEXTURE_2D, i, format, layers[i].width, layers[i].height, 0, format, gl.UNSIGNED_BYTE, layers[i].data)
			else
				gl.compressedTexImage2D(gl.TEXTURE_2D, i, format, layers[i].width, layers[i].height, 0, layers[i].data)
		//if(!transparent && layers.length == 1)
		//	gl.generateMipmap(gl.TEXTURE_2D)
	}
	
	use() {
		gl.bindTexture(gl.TEXTURE_2D, this.id)
	}
}
