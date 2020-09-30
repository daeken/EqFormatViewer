import {Asset} from './asset.js'
import {Dds} from '../fileReaders/dds.js'
import {ForwardDiffuseMaterial} from '../engine/materials/forwardDiffuse.js'
import {Buffer} from '../engine/buffer.js'
import {Mesh} from '../engine/mesh.js'
import {Model} from '../engine/model.js'
import {engine} from '../common/globals.js'
import {Texture} from '../engine/texture.js'
import {TerMod, convertVertices, createModel} from '../fileReaders/terMod.js'

class TerModSubAsset extends Asset {
	constructor(archive, tm, vertexBuffer, chosenMaterial = null, chosenFlags = null) {
		super()
		engine.addModel(this.model = createModel(archive, tm, vertexBuffer, chosenMaterial, chosenFlags))
	}
	
	unload() {
		engine.deleteModel(this.model)
	}
}

export class TerModAsset extends Asset {
	constructor(parent, name, data) {
		super()
		this.parent = parent
		this.tm = new TerMod(parent.fetch, data, name.toLowerCase().endsWith('.ter'))
		console.log(this.tm)
		this.vertexBuffer = new Buffer(convertVertices(this.tm.vertices))
	}

	get children() {
		return ['Entire Model']
			.concat(this.tm.materialPolys.map(x => x.material.name))
			.concat([...this.tm.materialPolys.reduce((af, mp) => {
				for(const flags of Object.keys(mp.indicesByFlags))
					af.add(parseInt(flags, 10))
				return af
			}, new Set())].map(x => {
				if(x == 0) return 'Flags: None'
				const ba = []
				for(let i = 0; i < 32; ++i)
					if(x & (1 << i))
						ba.push(i)
				return 'Flags: ' + ba.toString().replace(',', ', ')
			}))
	}
	
	fetch(name) {
		const entire = name == 'Entire Model'
		const material = !entire && !name.startsWith('Flags: ') ? name : null
		const flags = !entire && !material
			? name == 'Flags: None'
				? '0'
				: name.substring(7).split(' ,').reduce((v, x) => v | (1 << parseInt(x)), 0).toString()
			: null
		return new TerModSubAsset(this.parent, this.tm, this.vertexBuffer, material, flags)
	}
}
