extends Node2D

func _on_body_entered(body):
	if body.name == "Player":
		get_tree().change_scene("res://Menus/You Win/youWin.tscn")
