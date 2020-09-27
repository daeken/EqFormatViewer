import {Asset} from './asset.js'
import {Dds} from '../fileReaders/dds.js'
import {ForwardDiffuseMaterial} from '../engine/materials/forwardDiffuse.js'
import {Model} from '../engine/model.js'
import {engine} from '../common/globals.js'
import {Texture} from '../engine/texture.js'

export class ImageAsset extends Asset {
	constructor(parent, name, data) {
		super()
		const dds = new Dds(data)
		const tex = new Texture(dds.mipmaps, dds.format)
		const material = new ForwardDiffuseMaterial([tex])
		engine.addModel(this.square = Model.createSquare(material))
		engine.draw()
	}
	
	unload() {
		engine.deleteModel(this.square)
	}
}
