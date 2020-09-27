import {Vector2, Vector3, Vector4} from './common/vector.js'
import {Engine} from './engine/engine.js'
import {Program} from './engine/program.js'
import {Asset} from './assets/asset.js'
import {DirectoryAsset} from './assets/directoryAsset.js'
import {ImageAsset} from './assets/imageAsset.js'
import {S3DAsset} from './assets/s3dAsset.js'
import {fetchAB, fetchJson, setEngine, engine, genericFunction, type} from './common/globals.js'
import {Window} from './ui/window.js'

Array.prototype.sortCaseInsensitive = function() {
	return this.sort((a, b) => a.toString().toLowerCase().localeCompare(b.toString().toLowerCase()))
}

function filterBy(dir, exts) {
	const files = []
	for(const fn of dir.files) {
		const match = fn.match(/\.(.+?)$/)
		if(match && match[1].toLowerCase() in exts)
			files.push(fn)
	}
	const subdirs = {}
	for(const dn of Object.keys(dir.subdirectories).sortCaseInsensitive()) {
		const mod = filterBy(dir.subdirectories[dn], exts)
		if(mod) subdirs[dn] = mod
	}
	if(files.length == 0 && Object.getOwnPropertyNames(subdirs).length == 0)
		return null
	return {name: dir.name, subdirectories: subdirs, files: files.sortCaseInsensitive()}
}

async function main() {
	//const s3d = new S3D(await fetchAB('/eq/gfaydark.s3d'))
	//console.log(s3d)
	//const dds = new Dds(s3d['fayroof1.bmp'])
	
	setEngine(new Engine('cvs'))
	
	const index = await fetchJson('/EqIndex')
	
	const loaders = {}
	const addLoader = (extensions, func) => {
		for(const ext of extensions)
			loaders[ext] = func
	}
	addLoader(['s3d', 'eqg'], (...args) => new S3DAsset(...args))
	addLoader(['dds', 'bmp'], (...args) => new ImageAsset(...args))

	const fp = new Window('File Picker')
	const assetStack = []
	const pickerStack = []
	const pushAsset = asset => {
		if(asset.children.length == 0) {
			assetStack.push(asset)
			return
		}
		const select = document.createElement('select')
		select.tabIndex = -1
		select.classList.add('select-block')
		const bopt = document.createElement('option')
		bopt.innerText = '---'
		bopt.disabled = true
		bopt.selected = true
		select.appendChild(bopt)
		for(const name of asset.children) {
			const option = document.createElement('option')
			option.innerText = name
			select.appendChild(option)
		}
		fp.bodyContainer.appendChild(select)
		assetStack.push(asset)
		pickerStack.push(select)
		const depth = assetStack.length
		select.addEventListener('change', async () => {
			const name = select.value
			while(assetStack.length > depth) assetStack.pop().unload()
			while(pickerStack.length > depth) fp.bodyContainer.removeChild(pickerStack.pop())
			const chosen = await asset.fetch(name)
			if(!chosen) return
			let chosenAsset
			if(chosen instanceof Asset)
				chosenAsset = chosen
			else {
				const ext = name.split('.').pop()
				const loader = loaders[ext]
				if(loader)
					chosenAsset = loader(asset, name, chosen)
			}
			if(chosenAsset) pushAsset(chosenAsset)
		})
	}
	pushAsset(new DirectoryAsset('/eq/', filterBy(index, loaders)))
}

main()
