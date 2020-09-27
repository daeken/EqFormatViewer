import {Struct, types} from '../common/struct.js'

class DdsHeader extends Struct[types.uint32] {
	magic
	size
	flags
	height
	width
	pitchOrLinearSize
	depth
	mipmapCount
	_ = types.uint32[11]
	ddspf = class extends Struct[types.uint32] {
		size; flags; fourCC; rgbBitCount
		rBitMask; gBitMask; bBitMask; aBitMask
	}
	caps
	caps2
	caps3
	caps4
	__
}

const DDSD_MIPMAPCOUNT = 0x20000
const DDSCAPS2_CUBEMAP = 0x200
const DDSCAPS2_CUBEMAP_POSITIVEX = 0x400
const DDSCAPS2_CUBEMAP_NEGATIVEX = 0x800
const DDSCAPS2_CUBEMAP_POSITIVEY = 0x1000
const DDSCAPS2_CUBEMAP_NEGATIVEY = 0x2000
const DDSCAPS2_CUBEMAP_POSITIVEZ = 0x4000
const DDSCAPS2_CUBEMAP_NEGATIVEZ = 0x8000
const DDPF_FOURCC = 0x4

const FOURCC_DXT1 = 0x31545844
const FOURCC_DXT3 = 0x33545844
const FOURCC_DXT5 = 0x35545844
const FOURCC_ETC1 = 0x31435445

export class Dds {
	constructor(buffer, loadMipmaps = true) {
		function loadARGBMip(buffer, dataOffset, width, height) {
			const dataLength = width * height * 4
			const srcBuffer = new Uint8Array(buffer, dataOffset, dataLength)
			const byteArray = new Uint8Array(dataLength)
			let dst = 0
			let src = 0
			for(let y = 0; y < height; y++)
				for(let x = 0; x < width; x++) {
					const b = srcBuffer[src]
					src++
					const g = srcBuffer[src]
					src++
					const r = srcBuffer[src]
					src++
					const a = srcBuffer[src]
					src++
					byteArray[dst] = r
					dst++;
					byteArray[dst] = g
					dst++;
					byteArray[dst] = b
					dst++;
					byteArray[dst] = a
					dst++;
				}
			return byteArray
		}

		const header = DdsHeader.unpack(buffer)
		if(header.magic != 0x20534444) throw 'Invalid DDS magic'

		let blockBytes
		let isRGBAUncompressed = false

		switch(header.ddspf.fourCC) {
			case FOURCC_DXT1:
				blockBytes = 8
				this.format = 33776
				break
			case FOURCC_DXT3:
				blockBytes = 16
				this.format = 33778
				break
			case FOURCC_DXT5:
				blockBytes = 16
				this.format = 33779
				break
			case FOURCC_ETC1:
				blockBytes = 8
				this.format = 36196
				break
			default:
				if(header.ddspf.rgbBitCount === 32
					&& header.ddspf.rBitMask & 0xff0000
					&& header.ddspf.gBitMask & 0xff00
					&& header.ddspf.bBitMask & 0xff
					&& header.ddspf.aBitMask & 0xff000000
				) {
					isRGBAUncompressed = true
					blockBytes = 64
					this.format = 6408 // gl.RGBA
				} else
					throw 'Unsupported fourCC in DDS'
		}

		let mipmapCount = 1
		if(header.flags & DDSD_MIPMAPCOUNT && loadMipmaps !== false)
			mipmapCount = Math.max(1, header.mipmapCount)

		const caps2 = header.caps2
		this.isCubemap = !!(caps2 & DDSCAPS2_CUBEMAP)
		if(this.isCubemap && (
			!(caps2 & DDSCAPS2_CUBEMAP_POSITIVEX) ||
			!(caps2 & DDSCAPS2_CUBEMAP_NEGATIVEX) ||
			!(caps2 & DDSCAPS2_CUBEMAP_POSITIVEY) ||
			!(caps2 & DDSCAPS2_CUBEMAP_NEGATIVEY) ||
			!(caps2 & DDSCAPS2_CUBEMAP_POSITIVEZ) ||
			!(caps2 & DDSCAPS2_CUBEMAP_NEGATIVEZ)
		)) throw 'Incomplete cubemap faces'

		this.width = header.width
		this.height = header.height
		this.mipmaps = []

		let dataOffset = header.size + 4

		const faces = this.isCubemap ? 6 : 1
		for(let face = 0; face < faces; face++)
			for(let i = 0, width = this.width, height = this.height; i < mipmapCount; i++) {
				let byteArray, dataLength
				if(isRGBAUncompressed) {
					byteArray = loadARGBMip(buffer, dataOffset, width, height)
					dataLength = byteArray.length
				} else {
					dataLength = Math.max(4, width) / 4 * Math.max(4, height) / 4 * blockBytes
					byteArray = new Uint8Array(buffer, dataOffset, dataLength)
				}

				this.mipmaps.push({data: byteArray, width: width, height: height})

				dataOffset += dataLength

				width = Math.max(width >> 1, 1)
				height = Math.max(height >> 1, 1)
			}
	}
}
