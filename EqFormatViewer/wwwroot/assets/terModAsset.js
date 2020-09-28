import {Asset} from './asset.js'
import {Dds} from '../fileReaders/dds.js'
import {ForwardDiffuseMaterial} from '../engine/materials/forwardDiffuse.js'
import {Buffer} from '../engine/buffer.js'
import {Mesh} from '../engine/mesh.js'
import {Model} from '../engine/model.js'
import {engine} from '../common/globals.js'
import {Texture} from '../engine/texture.js'
import {TerMod} from '../fileReaders/terMod.js'

class TerModSubAsset extends Asset {
	constructor(archive, tm, vertexBuffer, chosenMaterial = null, chosenFlags = null) {
		super()
		this.model = new Model()
		
		for(const mp of tm.materialPolys) {
			const mat = mp.material, ibf = mp.indicesByFlags
			if(chosenMaterial && mat.name != chosenMaterial) continue
			const ib = new Uint32Array(Object.keys(ibf).reduce((total, flags) => 
				!chosenFlags || flags == chosenFlags ? total + ibf[flags].length : total, 0))
			let i = 0
			for(const flags of Object.keys(ibf)) {
				if(chosenFlags && flags != chosenFlags) continue
				for(const v of ibf[flags])
					ib[i++] = v
			}

			const texFile = mat.properties['e_TextureDiffuse0'][1]
			const dds = new Dds(archive.fetch(texFile))
			const tex = new Texture(dds.mipmaps, dds.format)
			const material = new ForwardDiffuseMaterial([tex])
			
			this.model.add(new Mesh(material, vertexBuffer, ib))
		}
		
		engine.addModel(this.model)
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
		const vb = new Float32Array(this.tm.vertices.length * 8)
		let i = 0
		for(const v of this.tm.vertices) {
			const pos = v.position
			vb[i++] = pos.x
			vb[i++] = pos.y
			vb[i++] = pos.z

			const normal = v.normal
			vb[i++] = normal.x
			vb[i++] = normal.y
			vb[i++] = normal.z
			
			const tc = v.texCoord
			vb[i++] = tc.x
			vb[i++] = tc.y
		}
		this.vertexBuffer = new Buffer(vb)
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
