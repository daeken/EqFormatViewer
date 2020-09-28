import {Struct, conditional, types} from '../common/struct.js'

class ChunksStruct extends Struct {
	count = types.uint32
	chunks = class extends Struct[types.uint32] {
		crc; offset; size
	}.array(this.count)
}

const TerMagic = 0x54475145
const ModMagic = 0x4d475145

const getString = (offset, obj) => {
	while(obj.parent) obj = obj.parent
	const index = obj.strTable.indexOf('\0', offset)
	return index == -1 ? obj.strTable.substr(offset) : obj.strTable.substr(offset, index - offset)
}

class TerModStruct extends Struct[types.uint32] {
	magic; version; strlen
	numMat; numVert; numTri
	numBones = conditional(types.uint32, x => x.magic != TerMagic)
	strTable = types.string.array(x => x.strlen)
	
	materials = class extends Struct[types.uint32] {
		index
		matName = types.uint32.then(getString)
		shaderName = types.uint32.then(getString)
		numProp
		properties = class extends Struct {
			name = types.uint32.then(getString)
			type = types.uint32
			value = x => {
				switch(x.type) {
					case 0: return types.float
					case 2: return types.uint32.then(getString)
					case 3: return types.uint32
					default: throw 'Unhandled TerMod property type: ' + x.type
				}
			}
		}.array(x => x.numProp)
	}.array(x => x.numMat)
	
	vertices = class extends Struct {
		position = types.vector3
		normal = types.vector3
		argbColor = conditional(types.uint32, x => x.parent.version == 3, 0xFFFFFFFF)
		texCoord = types.vector2
		unknown2 = conditional(types.vector2, x => x.parent.version == 3)
	}.array(x => x.numVert)
	
	triangles = class extends Struct[types.uint32] {
		a; b; c
		matId
		flags
	}.array(x => x.numTri)
}

export const FloatProperty = Symbol('FloatProperty')
export const ArgbProperty = Symbol('ArgbProperty')
export const StringProperty = Symbol('StringProperty')

const propertyMap = {
	0: FloatProperty, 
	2: StringProperty, 
	3: ArgbProperty, 
}

export class TerMod {
	constructor(fetcher, data, isTer) {
		const file = TerModStruct.unpack(data)
		if(isTer && file.magic != TerMagic) throw 'Invalid magic for .ter file'
		if(!isTer && file.magic != ModMagic) throw 'Invalid magic for .mod file'
		
		console.log(file)
		
		this.vertices = file.vertices
		this.materialPolys = file.materials.map((mat, matId) => ({
			material: {
				name: mat.matName,
				shader: mat.shaderName,
				properties: mat.properties.reduce((ap, p) => {
					ap[p.name] = [propertyMap[p.type], p.value]
					return ap
				}, {})
			}, 
			indicesByFlags: file.triangles.reduce((ibs, t) => {
				if(t.matId != matId) return ibs
				const ib = ibs[t.flags] ??= []
				ib.push(t.a, t.b, t.c)
				return ibs
			}, {})
		}))
	}
}
