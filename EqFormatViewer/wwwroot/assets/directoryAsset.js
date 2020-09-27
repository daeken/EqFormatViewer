import {Asset} from "./asset.js"
import {fetchAB} from '../common/globals.js'

export class DirectoryAsset extends Asset {
	constructor(root, tree) {
		super()
		this.root = root
		this.tree = tree
	}
	
	async fetch(name) {
		if(name.endsWith('/'))
			return new DirectoryAsset(this.root + name, this.tree.subdirectories[name.substring(0, name.length - 1)])
		return await fetchAB(this.root + name)
	}
	
	get children() {
		return Object.keys(this.tree.subdirectories).map(x => x + '/').concat(this.tree.files)
	}
}
