extends Node2D

@onready var pause_menu = $Player/Camera2D/PauseMenu

func _process(_delta):
	if Input.is_action_just_pressed("pause"):
		pauseMenu()
		

func pauseMenu():
	if get_tree().paused == true:
		Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
		pause_menu.hide()
		get_tree().paused = false
	else:
		Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
		get_tree().paused = true
		pause_menu.show()


func _on_area_2d_body_entered(body):
	if body.name == "Player":
		print("body entered")
