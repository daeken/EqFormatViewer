import {Matrix44} from '../common/matrix.js'
import {Vector3} from '../common/vector.js'

const Up = Vector3.unitZ
const Right = Vector3.unitX
const Forward = Vector3.unitY
const CameraHeight = 5.5

export class FpsCamera {
	pitch = 0
	yaw = 0
	lookRotation = Matrix44.identity
	viewMatrix
	
	constructor(pos) {
		this.position = pos
	}
	
	move(movement) {
		if(movement.lengthSquared < 0.0001) return
		this.viewMatrix = undefined
		movement = movement.transform(this.lookRotation)
		this.position = this.position.add(movement)
	}
	
	look(pitchmod, yawmod) {
		this.viewMatrix = undefined
		const eps = 0.01
		this.pitch = Math.min(Math.max(this.pitch + pitchmod, -Math.PI / 2 + eps), Math.PI / 2 - eps);
		this.yaw += yawmod;
		this.lookRotation = Matrix44.createFromAxisAngle(Right, this.pitch);
		if(this.yaw != 0)
			this.lookRotation = this.lookRotation.compose(Matrix44.createFromAxisAngle(Up, this.yaw))
	}
	
	update() {
		if(this.viewMatrix) return
		const tallPosition = this.position.add(new Vector3(0, 0, 0));
		const at = Forward.transform(this.lookRotation).normalized;
		this.viewMatrix = Matrix44.createLookAt(tallPosition, tallPosition.add(at), Up);
	}
}