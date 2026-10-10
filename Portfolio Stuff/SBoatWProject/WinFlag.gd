extends Area2D

func _on_area_2d_body_entered(body):
	if body.name == "Player":
		print("body entered")
		#get_tree().change_scene_to_file("res://Menus/You Win/youWin.tscn")
