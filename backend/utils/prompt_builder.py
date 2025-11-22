
def create_video_prompt(custom_prompt: str, global_context: str) -> str:
    return f"""
    context: {global_context}
    Generate a creative video based on the following input: {custom_prompt}
    The image will have annotations describing how the scene should look. the annotations guide the momvement and visual style, but they should not be included in the final video.
    The video should be visually engaging and dynamic. stay true to the style of the source material.
    """