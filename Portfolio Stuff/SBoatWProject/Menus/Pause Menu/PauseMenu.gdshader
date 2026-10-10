shader_type canvas_item;

uniform sampler2D screen_texture: hint_screen_texture, filter_linear_mipmap;
uniform float blur: hint_range(0.0, 2.5);
uniform float brightness: hint_range(0.0, 1.0);

void fragment() {
	COLOR = textureLod(screen_texture,SCREEN_UV,blur);
	COLOR.rgb *= brightness;
}
