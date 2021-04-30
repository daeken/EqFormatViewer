import {Struct, conditional, types, align, currentPosition, assert, seekTo} from '../common/struct.js'
import {Vector2, Vector3} from '../common/vector.js'

const key = [0x95, 0x3A, 0xC5, 0x2A, 0x95, 0x7A, 0x95, 0x6A]

const decodeStringHash = x => x.map((c, i) => String.fromCharCode(c ^ key[i % 8])).join('').replace(/\0+$/, '')
const getString = (offset, obj) => {
	while(obj.parent) obj = obj.parent
	const index = obj.stringHash.indexOf('\0', offset)
	return index == -1 ? obj.stringHash.substr(offset) : obj.stringHash.substr(offset, index - offset)
}

const FragmentReference = () => types.uint32.thenLazy((x, obj) => {
	while(obj.parent && !obj.parent.fragments) obj = obj.parent
	const curFrag = obj
	obj = curFrag.parent
	if(x > 0) return obj.fragments[x - 1]
	const fragmentName = getString(-x, obj)
	const fragOff = obj.fragments.indexOf(curFrag)
	for(let i = fragOff - 1; i >= 0; --i)
		if(obj.fragments[i]?.name === fragmentName)
			return obj.fragments[i]
	for(let i = fragOff; i < obj.fragments.length; ++i)
		if(obj.fragments[i]?.name === fragmentName)
			return obj.fragments[i]
	throw 'Could not find fragment for reference: ' + x
})

const FragmentReferences = count => types.uint32.array(count).thenLazy((a, obj) => {
	while(obj.parent && !obj.parent.fragments) obj = obj.parent
	const curFrag = obj
	obj = curFrag.parent
	const fragOff = obj.fragments.indexOf(curFrag)
	return a.map(x => {
		if(x > 0) return obj.fragments[x - 1]
		const fragmentName = getString(-x, obj)
		for(let i = fragOff - 1; i >= 0; --i)
			if(obj.fragments[i]?.name === fragmentName)
				return obj.fragments[i]
		for(let i = fragOff; i < obj.fragments.length; ++i)
			if(obj.fragments[i]?.name === fragmentName)
				return obj.fragments[i]
		throw 'Could not find fragment for reference: ' + x
	})
})

const GetWld = obj => {
	while(obj.parent) obj = obj.parent
	return obj
}

class WldStruct extends Struct[types.uint32] {
	magic
	__check = assert(x => x.magic == 0x54503D02, 'Invalid magic')
	version
	newFormat = x => x.version != 0x00015500
	
	numFrag
	unk1; unk2
	stringHashSize
	unk3
	stringHash = types.uint8.array(x => x.stringHashSize).then(decodeStringHash)
	__alignment = align(4)
	
	fragments = class extends Struct {
		__size = types.uint32
		type = types.uint32
		__spos = currentPosition()
		name = types.int32.then((x, o) => x <= 0 && o.type != 0x35 ? getString(-x, o) : '')
		$inline = this.type
			.case(0x03, class extends Struct {
				numFilenames = types.uint32
				filenames = class extends Struct {
					len = types.uint16
					fn = types.uint8.array(x => x.len).then(decodeStringHash)
				}.array(x => x.numFilenames + 1).thenMap(x => x.fn)
			})
			.case(0x04, class extends Struct {
				flags = types.int32
				__refCount = types.int32
				unknown = conditional(types.uint32, obj => obj.flags & (1 << 2))
				frameTime = conditional(types.uint32, obj => obj.flags & (1 << 3), 0)
				refs = FragmentReferences(this.__refCount)
			})
			.case(0x05, class extends Struct {
				ref = FragmentReference
				unknown = types.uint32
			})
			.case(0x10, class extends Struct {
				flags = types.uint32
				trackCount = types.uint32
				polyAniRef = FragmentReference
				unk1 = conditional(types.uint32.array(3), obj => obj.flags & (1 << 0))
				unk2 = conditional(types.float, obj => obj.flags & (1 << 1))
				tracks = class extends Struct {
					name = types.int32.then(getString)
					tflags = types.uint32
					animationRef = FragmentReference
					meshRef = FragmentReference
					children = types.int32.array(types.uint32)
				}.array(obj => obj.trackCount)
				
				meshRefs = conditional(FragmentReferences(types.uint32), obj => obj.flags & (1 << 9))
			})
			.case(0x2D, class extends Struct {
				ref = FragmentReference
			})
			.case(0x30, class extends Struct[types.uint32] {
				existenceFlags; texFlags
				unk1
				unk2 = types.float
				unk3 = types.float
				unk4 = conditional(types.uint32, obj => obj.existenceFlags & (1 << 1))
				unk5 = conditional(types.float, obj => obj.existenceFlags & (1 << 1))
				ref = FragmentReference
			})
			.case(0x36, class extends Struct[types.uint16] {
				unk1 = types.uint32
				texRef = FragmentReference
				aniRef = FragmentReference
				unk2 = types.uint32
				unk3 = types.int32
				center = types.vector3
				unk4 = types.uint32
				unk5 = types.uint32
				unk6 = types.uint32
				maxDist = types.float
				mins = types.vector3
				maxs = types.vector3
				numVerts; numTexcoords; numNormals; numColors
				numPolys; numVertPieces; numPolyTexs; numVertTexs
				unk7
				
				scale = types.uint16.then(x => 1 << x)
				vertices = types.int16.array(3).array(obj => obj.numVerts).thenMap((x, obj) => new Vector3(...x).div(obj.scale).add(obj.center))
				texcoords = conditional(
					types.vector2,
					obj => GetWld(obj).newFormat, 
					types.int16.array(2).then(x => new Vector2(...x).div(256))
				).array(obj => obj.numTexcoords).then((x, obj) => {
					if(obj.numVerts == obj.numTexcoords) return x
					const padding = new Array(obj.numVerts - obj.numTexcoords)
					padding.fill(Vector2.zero)
					return x.concat(padding)
				})
				normals = types.int8.array(3).array(obj => obj.numNormals)
					.thenMap(x => new Vector3(...x).div(127))
					.then((x, obj) => {
						if(obj.numVerts == obj.numNormals) return x
						const padding = new Array(obj.numVerts - obj.numNormals)
						padding.fill(Vector3.unitZ)
						return x.concat(padding)
					})
				colors = types.uint32.array(obj => obj.numColors)
				polygons = types.uint16.array(4).array(obj => obj.numPolys)
				vertPieces = types.uint16.array(2).array(obj => obj.numVertPieces)
				polyTexs = types.uint16.array(2).array(obj => obj.numPolyTexs)
			})
			.default(class extends Struct {
				unknown = types.uint8.array(x => x.parent.__size - 4)
			})
		__epos = currentPosition()
		__check = assert(x => x.__epos <= x.__spos + x.__size, 'Fragment read past end of region')
		__skip = seekTo(x => x.__spos + x.__size)
	}.array(x => x.numFrag)
}

export class Wld {
	constructor(data) {
		const file = WldStruct.unpack(data)
		if(file.magic != 0x54503D02) throw 'Invalid magic for .wld file'
		console.log(file)
		this.file = file
	}
}
