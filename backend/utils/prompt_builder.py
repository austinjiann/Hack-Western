
def create_video_prompt(custom_prompt: str, global_context: str) -> str:
    return f"""
    context: {global_context}
    Generate a creative video based on the following input: {custom_prompt}
    """