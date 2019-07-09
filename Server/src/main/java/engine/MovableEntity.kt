package engine

abstract class MovableEntity (var velocity: Vector2f, position: Point) : Entity(position) {
    fun move() {
        this.pos.x += velocity.x
        this.pos.y += velocity.y
    }
}
