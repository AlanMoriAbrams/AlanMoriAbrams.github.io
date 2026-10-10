extends CharacterBody2D

var speed: float = 50.0

@onready var target = $"../Player"

func _physics_process(_delta):
	if target == null: get_tree().get_nodes_in_group("Player")[0]
	if target != null:
		velocity = position.direction_to(target.position) * speed
		move_and_slide()
