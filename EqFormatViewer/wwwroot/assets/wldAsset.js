import {engine} from '../common/globals.js'
import {Asset} from './asset.js'
import {Wld} from '../fileReaders/wld.js'

export class WldAsset extends Asset {
	constructor(parent, name, data) {
		super()
		this.parent = parent
		this.wld = new Wld(data)
	}
}
