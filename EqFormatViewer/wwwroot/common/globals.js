export const fetchAB = async (request, init) => {
	const response = await fetch(request, init)
	return response.arrayBuffer()
}

export const fetchJson = async (request, init) => {
	const response = await fetch(request, init)
	return response.json()
}

export const mutableGlobal = () => {
	let backing
	return [
		nv => {
			for(const key of Object.getOwnPropertyNames(nv.__proto__))
				if({}.toString.call(nv[key]) === '[object Function]')
					nv[key] = nv[key].bind(nv)
			backing = nv
		}, new Proxy({}, {
			get: (_, property) => backing[property],
			set: (_, property, value) => {
				backing[property] = value
				return true
			}
		})
	]
}

export const [setGl, gl] = mutableGlobal()
export const [setEngine, engine] = mutableGlobal()

export const type = {
	u8: Symbol('u8'), 
	i8: Symbol('i8'), 
	u16: Symbol('u16'), 
	i16: Symbol('i16'), 
	u32: Symbol('u32'), 
	i32: Symbol('i32'), 
	u64: Symbol('u64'), 
	i64: Symbol('i64'), 
	f32: Symbol('f32'), 
	f64: Symbol('f64'),
	v2: Symbol('v2'),
	v3: Symbol('v3'),
	v4: Symbol('v4'),
	m44: Symbol('m44'), 
}

Uint8Array.type = type.u8
Int8Array.type = type.i8
Uint16Array.type = type.u16
Int16Array.type = type.i16
Uint32Array.type = type.u32
Int32Array.type = type.i32
BigUint64Array.type = type.u64
BigInt64Array.type = type.i64
Float32Array.type = type.f32
Float64Array.type = type.f64

export const genericFunction = (self, func) => new Proxy((...args) => func.call(self, undefined, ...args), {
	get: (target, property) => {
		if(property in func) return func[property]
		return (...args) => func.call(self, property, ...args)
	}
})
