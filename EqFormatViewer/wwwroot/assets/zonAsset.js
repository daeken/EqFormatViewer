import {engine} from '../common/globals.js'
import {Asset} from './asset.js'
import {Buffer} from '../engine/buffer.js'
import {InstancedModel} from '../engine/instancedModel.js'
import {Zon} from '../fileReaders/zon.js'
import {TerMod, convertVertices, createModel} from '../fileReaders/terMod.js'
import {Matrix44} from '../common/matrix.js'
import {Vector3} from '../common/vector.js'

class ZonSubAsset extends Asset {
	constructor(archive, zon, chosenFile=null) {
		super()
		this.models = []
		
		console.log('Loading models')
		for(let i = 0; i < zon.files.length; ++i) {
			const fn = zon.files[i]
			const usages = zon.placeables.filter(x => x.objId == i).length
			if(usages == 0 || (chosenFile && fn != chosenFile)) {
				this.models.push(null)
				continue
			}
			const tm = new TerMod(archive.fetch, archive.fetch(fn), fn.toLowerCase().endsWith('.ter'))
			const vertexBuffer = new Buffer(convertVertices(tm.vertices))
			const model = createModel(archive, tm, vertexBuffer, null, null, usages > 1)
			if(usages > 1)
				model.instanceCount = usages
			this.add(model)
		}
		
		console.log('Placing objects')
		for(const p of zon.placeables) {
			const model = this.models[p.objId]
			if(p.objId == 0 || !model) continue
			const isInstance = model instanceof InstancedModel
			const transform = Matrix44.createFromAxisAngle(Vector3.unitX, p.rot.z)
				.compose(Matrix44.createFromAxisAngle(Vector3.unitY, p.rot.y))
				.compose(Matrix44.createFromAxisAngle(Vector3.unitZ, p.rot.x))
				.compose(Matrix44.createScale(new Vector3(p.scale)))
				.compose(Matrix44.createTranslate(p.pos))
			if(isInstance)
				model.addTransform(transform)
			else
				model.transform = transform
		}
		
		for(const model of this.models)
			if(model instanceof InstancedModel)
				model.bake()
	}
	
	add(model) {
		this.models.push(model)
		engine.addModel(model)
	}
	
	unload() {
		this.models.forEach(x => engine.deleteModel(x))
	}
}

export class ZonAsset extends Asset {
	constructor(parent, name, data) {
		super()
		this.parent = parent
		this.zon = new Zon(data).file
		console.log(this.zon)
	}
	
	get children() {
		return ['Zone'].concat(this.zon.files)
	}
	
	fetch(name) {
		return new ZonSubAsset(this.parent, this.zon, name == 'Zone' ? null : name)
	}
}
