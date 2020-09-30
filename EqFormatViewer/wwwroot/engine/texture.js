import {gl} from "../common/globals.js"

export class Texture {
	constructor(layers, format = gl.RGBA, transparent = false) {
		if(layers.texture) return layers.texture
		layers.texture = this
		this.width = layers[0].width
		this.height = layers[0].height
		gl.bindTexture(gl.TEXTURE_2D, this.id = gl.createTexture())
		//const filter = transparent ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
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
	
	static _white
	static get white() {
		return Texture._white ??= new Texture([{width: 1, height: 1, data: new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF])}])
	}
}
