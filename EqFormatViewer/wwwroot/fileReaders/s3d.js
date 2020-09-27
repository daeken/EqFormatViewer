import {Struct, types} from '../common/struct.js'
import {inflate} from '../common/pako.js'

class HeaderStruct extends Struct[types.uint32] {
	offset; magic
}

class ChunksStruct extends Struct {
	count = types.uint32
	chunks = class extends Struct[types.uint32] {
		crc; offset; size
	}.array(this.count)
}

class CompressedChunkStruct extends Struct[types.uint32] {
	dlen; ilen
}

class DirectoryEntries extends Struct {
	count = types.uint32
	files = class extends Struct {
		fnlen = types.uint32
		fn = types.string[this.fnlen]
	}.array(this.count)
}

export class S3D {
	constructor(data) {
		function decompressChunk(offset, tsize) {
			let ret = new Uint8Array(tsize)
			let off = 0
			while(off < tsize) {
				let chunk = CompressedChunkStruct.unpack(data, offset)
				let dchunk = inflate(data.slice(offset + 8, offset + 8 + chunk.dlen))
				ret.set(dchunk, off)
				off += chunk.ilen
				offset += 8 + chunk.dlen
			}
			return ret.buffer
		}
		
		const header = HeaderStruct.unpack(data)
		if(header.magic != 0x20534650) throw 'Magic mismatch in S3D'
		let chunks = ChunksStruct.unpack(data, header.offset).chunks
		const dchunk = chunks.find(x => x.crc == 0x61580AC9)
		chunks = chunks.filter(x => x.crc != 0x61580AC9)
		chunks.sort((a, b) => a.offset - b.offset)
		const directory = DirectoryEntries.unpack(decompressChunk(dchunk.offset, dchunk.size)).files
		if(directory.length != chunks.length) throw 'Directory mismatch'
		const cache = {}
		directory.forEach((x, i) => {
			const chunk = chunks[i]
			Object.defineProperty(this, x.fn, {
				enumerable: true, 
				get: () => {
					if(x.fn in cache) return cache[x.fn]
					return cache[x.fn] = decompressChunk(chunk.offset, chunk.size)
				}
			})
		})
	}
}
