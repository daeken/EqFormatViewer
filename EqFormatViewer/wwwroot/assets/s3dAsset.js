import {Asset} from "./asset.js"
import {S3D} from '../fileReaders/s3d.js'

export class S3DAsset extends Asset {
	constructor(parent, name, data) {
		super()
		this.parent = parent
		this.name = name
		this.s3d = new S3D(data)
	}
	
	fetch(name) {
		return this.s3d[name]
	}
	
	get children() {
		return Object.keys(this.s3d)
	}
}
