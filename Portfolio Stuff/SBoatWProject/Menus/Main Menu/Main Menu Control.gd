extends Control


# Called when the node enters the scene tree for the first time.
func _ready():
	pass
	var StartButton = $StartButton
	StartButton.pressed.connect(self._on_startbutton_pressed) 
	var HTPButton = $HTPButton
	HTPButton.pressed.connect(self._on_htpbutton_pressed)
	var CreditsButton = $CreditsButton
	CreditsButton.pressed.connect(self._on_creditsbutton_pressed)
	var QuitButton = $Quit 
	QuitButton.pressed.connect(self._on_quitbutton_pressed)

func _on_startbutton_pressed():
	get_tree().change_scene_to_file("res://Level/Base-Level.tscn")

func _on_htpbutton_pressed():
	get_tree().change_scene_to_file("res://Menus/HowToPlay/HowToPlay.tscn")

func _on_creditsbutton_pressed():
	get_tree().change_scene_to_file("res://Menus/Credits/Credits.tscn")

func _on_quitbutton_pressed():
	get_tree().quit()
