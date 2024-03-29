import {Vector2, Vector3, Vector4} from '../common/vector.js'

let instanceIter = 0
const array = Symbol('array')
const constant = Symbol('constant')
const ref = Symbol('ref')
const then = Symbol('then')
const thenMap = Symbol('thenMap')
const match = Symbol('match')
const thenLazy = Symbol('thenLazy')
const typeInstances = {}
const lazyFunctions = []
const makeType = type => typeInstances[instanceIter] = new Proxy(
	{
		isMagicalType: true, 
		type: type, 
		instance: instanceIter++,
		toString: function() { return '#' + this.instance }, 
		array: function(len) {
			if(len === undefined)
				throw 'Array length undefined; ensure you are using explicit types for fields referenced in array counts'
			
			if(typeof len == 'number' || Array.isArray(len) || {}.toString.call(len) === '[object Function]')
				return makeType([array, this.type, len])
			return this[len]
		},
		then: function(processor) {
			return makeType([then, this, processor])
		},
		thenMap: function(processor) {
			return makeType([thenMap, this, processor])
		},
		thenLazy: function(processor) {
			return makeType([thenLazy, this, processor])
		},
		case: function(predicate, type) {
			if(Array.isArray(this.type) && this.type[0] == match) {
				this.type.push([predicate, type])
				return this
			}
			return makeType([match, this, [predicate, type]])
		},
		default: function(type) {
			if(Array.isArray(this.type) && this.type[0] == match) {
				this.type.push([() => true, type])
				return this
			}
			throw 'Default on non-match type'
		},
	},
	{
		get: (target, prop) => {
			if(prop in target) return target[prop]
			if(typeof prop != 'string') return
			if(prop == 'prototype') return
			return target.array(prop[0] === '#' ? [ref, parseInt(prop.substring(1))] : [constant, parseInt(prop)])
		}
})

export const align = alignment => makeType([align, alignment])
export const currentPosition = () => makeType([currentPosition])
export const assert = (predicate, message=null) => makeType([assert, predicate, message == null ? 'Failed assertion' : 'Failed assertion: ' + message])
export const seekTo = pos => makeType([seekTo, pos])

export const types = new Proxy({
		uint8: 0, uint16: 0, uint32: 0, uint64: 0,
		 int8: 0,  int16: 0,  int32: 0,  int64: 0,
		float: 0, double: 0, string: 0, 
		vector2: 0, vector3: 0, vector4: 0
	}, {
		get: (target, prop) => {
			if(prop in target) return makeType(prop)
			throw `No such type '${prop}'`
		}
})

class _Struct {
	static bake() {
		if(this.baked) return
		this.baked = true
		this.props = []
		this.instanceMap = {}

		const instance = new this
		for(const key of Object.getOwnPropertyNames(instance)) {
			const value = instance[key] ?? this.__default
			if(value.prototype instanceof _Struct || typeof value == 'function')
				this.props.push({name: key, type: value})
			else {
				this.props.push({name: key, type: value.type})
				this.instanceMap[value.instance] = key
			}
		}
	}

	static unpack(data, offset = 0, parent = null) {
		this.bake()
		const dv = new DataView(ArrayBuffer.isView(data) ? data.buffer : data)
		const obj = new this
		obj.parent = parent
		obj.__startOffset = offset
		obj.__assigned = {}
		const littleEndian = true
		const fetch = size => {
			const boff = offset
			offset += size
			return boff
		}
		const valueOf = type => {
			if(type === undefined) return type
			if(Array.isArray(type))
				switch(type[0]) {
					case array:
						const count = {}.toString.call(type[2]) === '[object Function]' ? type[2](obj) : valueOf(type[2])
						if(type[1] === 'string') {
							let ret = ''
							for(let i = 0; i < count; ++i)
								ret += String.fromCharCode(dv.getInt8(offset++))
							return ret.replace(/\0+$/, '')
						}
						const ret = []
						for(let i = 0; i < count; ++i)
							ret[i] = valueOf(type[1])
						return ret
					case constant:
						return type[1]
					case ref:
						return obj[this.instanceMap[type[1]]]
					case conditional:
						return valueOf(type[2]) ? valueOf(type[1]) : valueOf(type[3])
					case then:
						return type[2](valueOf(type[1]), obj)
					case thenMap:
						return valueOf(type[1]).map(x => type[2](x, obj))
					case thenLazy:
						return type
					case align:
						const alignTo = valueOf(type[1])
						while((offset % alignTo) != 0) offset++
						return
					case currentPosition:
						return offset
					case assert:
						const pred = valueOf(type[1])
						if(!pred) throw type[2]
						return
					case match:
						const value = valueOf(type[1])
						for(let i = 2; i < type.length; ++i) {
							const [cond, into] = type[i]
							const condValue = typeof cond == 'function'
								? cond(value, obj)
								: value == cond
							if(condValue) return valueOf(into)
						}
						return
					case seekTo:
						offset = valueOf(type[1])
						return
					default:
						throw `Unknown special type: ${JSON.stringify(type)}`
				}
			if(type?.isMagicalType) {
				if(type?.instance in this.instanceMap && obj.__assigned[this.instanceMap[type.instance]])
					return obj[this.instanceMap[type.instance]]
				return valueOf(type.type)
			}
			if(type.prototype instanceof _Struct) {
				const value = type.unpack(data, offset, obj)
				offset = value.__endOffset
				return value
			}
			if(typeof type == 'function')
				return valueOf(type(obj))
			if(typeof type != 'string')
				return type
			switch(type) {
				case 'int8': return dv.getInt8(offset++)
				case 'uint8': return dv.getUint8(offset++)
				case 'int16': return dv.getInt16(fetch(2), littleEndian)
				case 'uint16': return dv.getUint16(fetch(2), littleEndian)
				case 'int32': return dv.getInt32(fetch(4), littleEndian)
				case 'uint32': return dv.getUint32(fetch(4), littleEndian)
				case 'int64': return dv.getBigInt64(fetch(8), littleEndian)
				case 'uint64': return dv.getBigUint64(fetch(8), littleEndian)
				case 'float': return dv.getFloat32(fetch(4), littleEndian)
				case 'double': return dv.getFloat64(fetch(8), littleEndian)
				case 'vector2': return new Vector2(
					dv.getFloat32(fetch(4), littleEndian),
					dv.getFloat32(fetch(4), littleEndian)
				)
				case 'vector3': return new Vector3(
					dv.getFloat32(fetch(4), littleEndian),
					dv.getFloat32(fetch(4), littleEndian),
					dv.getFloat32(fetch(4), littleEndian)
				)
				case 'vector4': return new Vector4(
					dv.getFloat32(fetch(4), littleEndian),
					dv.getFloat32(fetch(4), littleEndian),
					dv.getFloat32(fetch(4), littleEndian),
					dv.getFloat32(fetch(4), littleEndian)
				)
				case 'string':
					let ret = ''
					do {
						const c = dv.getUint8(offset++)
						if(c == 0) break
						ret += String.fromCharCode(c)
					} while(true)
					return ret
				default: throw `Can't read type: ${JSON.stringify(type)}`
			}
		}
		for(const prop of this.props) {
			const value = valueOf(prop.type)
			if(Array.isArray(value) && value[0] == thenLazy) {
				const oval = valueOf(value[1])
				lazyFunctions.push(() => obj[prop.name] = value[2](oval, obj))
			} else {
				obj[prop.name] = value
				obj.__assigned[prop.name] = true
			}
		}
		obj.__endOffset = offset
		lazyFunctions.push(() => {
			if(!('parent' in this.props))
				delete obj.parent
			for(const prop of this.props) {
				if(prop.name[0] == '$') {
					const value = obj[prop.name]
					for(const key of Object.getOwnPropertyNames(value))
						if(!key.startsWith('__') && key[0] != '$' && key != 'parent')
							obj[key] = value[key]
					delete obj[prop.name]
				}
				if(prop.name.startsWith('__'))
					delete obj[prop.name]
			}
			delete obj.__assigned
		})
		
		if(!parent)
			while(lazyFunctions.length)
				lazyFunctions.shift()()
		
		return obj
	}
	
	static array(len) {
		return makeType(this).array(len)
	}
}

export class Union extends _Struct {
	static unpack(data, offset = 0) {
		this.bake()
		const dv = new DataView(ArrayBuffer.isView(data) ? data.buffer : data)
		const obj = new this
		const start = obj.__startOffset = offset
		const littleEndian = true
		const fetch = size => {
			const boff = offset
			offset += size
			return boff
		}
		const valueOf = type => {
			if(Array.isArray(type))
				switch(type[0]) {
					case array:
						const count = {}.toString.call(type[2]) === '[object Function]' ? type[2](obj) : valueOf(type[2])
						const ret = []
						for(let i = 0; i < count; ++i)
							ret[i] = valueOf(type[1])
						return ret
					case constant:
						return type[1]
					case ref:
						return obj[this.instanceMap[type[1]]]
					default:
						throw `Unknown special type: ${JSON.stringify(type)}`
				}
			if(type.prototype instanceof _Struct) {
				const value = type.unpack(data, offset)
				offset = value.__endOffset
				return value
			}
			if(typeof type == 'number')
				return type
			switch(type) {
				case 'int8': return dv.getInt8(offset++)
				case 'uint8': return dv.getUint8(offset++)
				case 'int16': return dv.getInt16(fetch(2), littleEndian)
				case 'uint16': return dv.getUint16(fetch(2), littleEndian)
				case 'int32': return dv.getInt32(fetch(4), littleEndian)
				case 'uint32': return dv.getUint32(fetch(4), littleEndian)
				case 'int64': return dv.getBigInt64(fetch(8), littleEndian)
				case 'uint64': return dv.getBigUint64(fetch(8), littleEndian)
				case 'float': return dv.getFloat32(fetch(4), littleEndian)
				case 'double': return dv.getFloat64(fetch(8), littleEndian)
				default: throw `Can't read type: ${JSON.stringify(type)}`
			}
		}
		let end = offset
		for(const prop of this.props) {
			offset = start
			obj[prop.name] = valueOf(prop.type)
			end = Math.max(end, offset)
		}
		obj.__endOffset = end
		return obj
	}
}

export const Struct = new Proxy(_Struct, {
	get: (_, prop) => {
		if(prop in _Struct) return _Struct[prop]
		if(typeof prop == 'string' && prop[0] == '#') {
			const cls = class extends _Struct {}
			cls.__default = typeInstances[parseInt(prop.substring(1))]
			return cls
		}
	}
})

export const conditional = (type, predicate, defaultValue) => makeType([conditional, type, predicate, defaultValue])
