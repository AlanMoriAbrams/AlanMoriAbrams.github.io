extends Control

@onready var main = $"../../.."


func _on_resume_pressed():
	main.pauseMenu()

func _on_quit_pressed():
	get_tree().paused = false
	get_tree().change_scene_to_file("res://Menus/Main Menu/MainMenu.tscn")
