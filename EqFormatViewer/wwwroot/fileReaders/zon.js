import {Struct, types} from '../common/struct.js'
import {Vector3} from '../common/vector.js'

const getString = (offset, obj) => {
	while(obj.parent) obj = obj.parent
	const index = obj.strTable.indexOf('\0', offset)
	return index == -1 ? obj.strTable.substr(offset) : obj.strTable.substr(offset, index - offset)
}

class ZonStruct extends Struct[types.uint32] {
	magic; version; strlen
	numFiles; numPlaceables; numUnk; numLights
	strTable = types.string.array(x => x.strlen)
	files = types.uint32.array(x => x.numFiles).thenMap(getString)
	
	placeables = class extends Struct {
		objId = types.int32
		name = types.uint32.then(getString)
		pos = types.vector3
		rot = types.vector3
		scale = types.float
	}.array(x => x.numPlaceables)
	
	unknown = class extends Struct[types.vector3] {
		unk1 = types.uint32
		unk2; unk3; unk4
	}.array(x => x.numUnk)
	
	lights = class extends Struct {
		name = types.uint32.then(getString)
		pos = types.vector3.then(x => new Vector3(x.y, -x.x, x.z))
		color = types.vector3
		radius = types.float
	}.array(x => x.numLights)
}

export class Zon {
	constructor(data) {
		const file = ZonStruct.unpack(data)
		if(file.magic != 0x5a475145) throw 'Invalid magic for .zon file'
		this.file = file
	}
}
