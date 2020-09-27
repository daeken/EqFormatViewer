export class Matrix44 {
	_00; _01; _02; _03
	_10; _11; _12; _13
	_20; _21; _22; _23
	_30; _31; _32; _33
	
	_arrayBuffer
	
	constructor(
		_00 = 1, _01 = 0, _02 = 0, _03 = 0,
		_10 = 0, _11 = 1, _12 = 0, _13 = 0,
		_20 = 0, _21 = 0, _22 = 1, _23 = 0,
		_30 = 0, _31 = 0, _32 = 0, _33 = 1
	) {
		this._00 = _00
		this._01 = _01
		this._02 = _02
		this._03 = _03

		this._10 = _10
		this._11 = _11
		this._12 = _12
		this._13 = _13

		this._20 = _20
		this._21 = _21
		this._22 = _22
		this._23 = _23

		this._30 = _30
		this._31 = _31
		this._32 = _32
		this._33 = _33
	}
	
	get arrayBuffer() {
		return this._arrayBuffer ??= new Float32Array([
			this._00, this._01, this._02, this._03, 
			this._10, this._11, this._12, this._13, 
			this._20, this._21, this._22, this._23, 
			this._30, this._31, this._32, this._33
		])
	}
	
	compose(right) {
		return new Matrix44(
			this._00 * right._00 + this._01 * right._10 + this._02 * right._20 + this._03 * right._30,
			this._00 * right._01 + this._01 * right._11 + this._02 * right._21 + this._03 * right._31,
			this._00 * right._02 + this._01 * right._12 + this._02 * right._22 + this._03 * right._32,
			this._00 * right._03 + this._01 * right._13 + this._02 * right._23 + this._03 * right._33,

			this._10 * right._00 + this._11 * right._10 + this._12 * right._20 + this._13 * right._30,
			this._10 * right._01 + this._11 * right._11 + this._12 * right._21 + this._13 * right._31,
			this._10 * right._02 + this._11 * right._12 + this._12 * right._22 + this._13 * right._32,
			this._10 * right._03 + this._11 * right._13 + this._12 * right._23 + this._13 * right._33,

			this._20 * right._00 + this._21 * right._10 + this._22 * right._20 + this._23 * right._30,
			this._20 * right._01 + this._21 * right._11 + this._22 * right._21 + this._23 * right._31,
			this._20 * right._02 + this._21 * right._12 + this._22 * right._22 + this._23 * right._32,
			this._20 * right._03 + this._21 * right._13 + this._22 * right._23 + this._23 * right._33,

			this._30 * right._00 + this._31 * right._10 + this._32 * right._20 + this._33 * right._30,
			this._30 * right._01 + this._31 * right._11 + this._32 * right._21 + this._33 * right._31,
			this._30 * right._02 + this._31 * right._12 + this._32 * right._22 + this._33 * right._32,
			this._30 * right._03 + this._31 * right._13 + this._32 * right._23 + this._33 * right._33
		)
	}
}

Matrix44.identity = new Matrix44()

Matrix44.createLookAt = (cameraPosition, cameraTarget, cameraUp) => {
	const zAxis = cameraPosition.sub(cameraTarget).normalized
	console.log(cameraUp.cross(zAxis))
	console.log(cameraUp)
	console.log(zAxis)
	const xAxis = cameraUp.cross(zAxis).normalized
	const yAxis = zAxis.cross(xAxis)
	
	return new Matrix44(
		xAxis.x, yAxis.x, zAxis.x, 0,
		xAxis.y, yAxis.y, zAxis.y, 0,
		xAxis.z, yAxis.z, zAxis.z, 0,

		-xAxis.dot(cameraPosition),
		-yAxis.dot(cameraPosition),
		-zAxis.dot(cameraPosition),
		1
	)
}

Matrix44.createPerspectiveFieldOfView = (fieldOfView, aspectRatio, nearPlaneDistance, farPlaneDistance) => {
	const yScale = 1 / Math.tan(fieldOfView * 0.5)
	const xScale = yScale / aspectRatio
	
	return new Matrix44(
		xScale, 0, 0, 0, 
		0, yScale, 0, 0, 
		0, 0, farPlaneDistance / (nearPlaneDistance - farPlaneDistance), -1, 
		0, 0, nearPlaneDistance * farPlaneDistance / (nearPlaneDistance - farPlaneDistance), 0
	)
}
