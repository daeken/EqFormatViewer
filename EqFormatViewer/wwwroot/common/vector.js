export class Vector2 {
	constructor(x = 0, y) {
		this.x = x
		this.y = y === undefined ? x : y
	}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}

	get lengthSquared() {
		return this.x * this.x + this.y * this.y
	}

	get normalized() {
		let len = this.lengthSquared
		if(len === 0) return Vector2.zero
		if(len === 1) return this
		return this.div(Math.sqrt(len))
	}

	get neg() {
		return new Vector2(-this.x, -this.y)
	}

	add(right) {
		if(right instanceof Vector2)
			return new Vector2(this.x + right.x, this.y + right.y)
		return new Vector2(this.x + right, this.y + right)
	}

	sub(right) {
		if(right instanceof Vector2)
			return new Vector2(this.x - right.x, this.y - right.y)
		return new Vector2(this.x - right, this.y - right)
	}

	mul(right) {
		if(right instanceof Vector2)
			return new Vector2(this.x * right.x, this.y * right.y)
		return new Vector2(this.x * right, this.y * right)
	}

	div(right) {
		if(right instanceof Vector2)
			return new Vector2(this.x / right.x, this.y / right.y)
		return new Vector2(this.x / right, this.y / right)
	}

	dot(right) {
		return this.x * right.x + this.y * right.y
	}

	transform(matrix) {
		return new Vector2(
			this.x * matrix._00 + this.y * matrix._10 + matrix._30,
			this.x * matrix._01 + this.y * matrix._11 + matrix._31
		)
	}
}
Vector2.zero = new Vector2(0)
Vector2.one = new Vector2(1)
Vector2.unitX = new Vector2(1, 0)
Vector2.unitY = new Vector2(0, 1)

export class Vector3 {
	constructor(x = 0, y, z) {
		if(y === undefined)
			y = z = x
		this.x = x
		this.y = y
		this.z = z
	}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
	}

	get lengthSquared() {
		return this.x * this.x + this.y * this.y + this.z * this.z
	}

	get normalized() {
		let len = this.lengthSquared
		if(len === 0) return Vector3.zero
		if(len === 1) return this
		return this.div(Math.sqrt(len))
	}
	
	get neg() {
		return new Vector3(-this.x, -this.y, -this.z)
	}

	add(right) {
		if(right instanceof Vector3)
			return new Vector3(this.x + right.x, this.y + right.y, this.z + right.z)
		return new Vector3(this.x + right, this.y + right, this.z + right)
	}

	sub(right) {
		if(right instanceof Vector3)
			return new Vector3(this.x - right.x, this.y - right.y, this.z - right.z)
		return new Vector3(this.x - right, this.y - right, this.z - right)
	}

	mul(right) {
		if(right instanceof Vector3)
			return new Vector3(this.x * right.x, this.y * right.y, this.z * right.z)
		return new Vector3(this.x * right, this.y * right, this.z * right)
	}

	div(right) {
		if(right instanceof Vector3)
			return new Vector3(this.x / right.x, this.y / right.y, this.z / right.z)
		return new Vector3(this.x / right, this.y / right, this.z / right)
	}

	dot(right) {
		return this.x * right.x + this.y * right.y + this.z * right.z
	}
	
	cross(right) {
		return new Vector3(
			this.y * right.z - this.z * right.y, 
			-(this.x * right.z - this.z * right.x), 
			this.x * right.y - this.y * right.x
		)
	}

	transform(matrix) {
		return new Vector3(
			this.x * matrix._00 + this.y * matrix._10 + this.z * matrix._20 + matrix._30,
			this.x * matrix._01 + this.y * matrix._11 + this.z * matrix._21 + matrix._31,
			this.x * matrix._02 + this.y * matrix._12 + this.z * matrix._22 + matrix._32
		)
	}
}
Vector3.zero = new Vector3(0)
Vector3.one = new Vector3(1)
Vector3.unitX = new Vector3(1, 0, 0)
Vector3.unitY = new Vector3(0, 1, 0)
Vector3.unitZ = new Vector3(0, 0, 1)

export class Vector4 {
	constructor(x = 0, y, z, w) {
		if(y === undefined)
			y = z = w = x
		this.x = x
		this.y = y
		this.z = z
		this.w = w
	}
	
	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
	}
	
	get lengthSquared() {
		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
	}
	
	get normalized() {
		let len = this.lengthSquared
		if(len === 0) return Vector4.zero
		if(len === 1) return this
		return this.div(Math.sqrt(len))
	}

	get neg() {
		return new Vector4(-this.x, -this.y, -this.z, -this.w)
	}

	add(right) {
		if(right instanceof Vector4)
			return new Vector4(this.x + right.x, this.y + right.y, this.z + right.z, this.w + right.w)
		return new Vector4(this.x + right, this.y + right, this.z + right, this.w + right)
	}

	sub(right) {
		if(right instanceof Vector4)
			return new Vector4(this.x - right.x, this.y - right.y, this.z - right.z, this.w + right.w)
		return new Vector4(this.x - right, this.y - right, this.z - right, this.w - right)
	}

	mul(right) {
		if(right instanceof Vector4)
			return new Vector4(this.x * right.x, this.y * right.y, this.z * right.z, this.w * right.w)
		return new Vector4(this.x * right, this.y * right, this.z * right, this.w * right)
	}

	div(right) {
		if(right instanceof Vector4)
			return new Vector4(this.x / right.x, this.y / right.y, this.z / right.z, this.w / right.w)
		return new Vector4(this.x / right, this.y / right, this.z / right, this.w / right)
	}

	dot(right) {
		return this.x * right.x + this.y * right.y + this.z * right.z + this.w * right.w
	}
	
	transform(matrix) {
		return new Vector4(
			this.x * matrix._00 + this.y * matrix._10 + this.z * matrix._20 + this.w * matrix._30,
			this.x * matrix._01 + this.y * matrix._11 + this.z * matrix._21 + this.w * matrix._31,
			this.x * matrix._02 + this.y * matrix._12 + this.z * matrix._22 + this.w * matrix._32,
			this.x * matrix._03 + this.y * matrix._13 + this.z * matrix._23 + this.w * matrix._33
		)
	}
}
Vector4.zero = new Vector4(0)
Vector4.one = new Vector4(1)
Vector4.unitX = new Vector4(1, 0, 0, 0)
Vector4.unitY = new Vector4(0, 1, 0, 0)
Vector4.unitZ = new Vector4(0, 0, 1, 0)
Vector4.unitW = new Vector4(0, 0, 0, 1)
