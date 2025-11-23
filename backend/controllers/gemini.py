from blacksheep import json, FromFiles
from blacksheep.server.controllers import APIController, post

import tempfile
import os
import json as pyjson

from services.vertex_service import VertexService

class Gemini(APIController):
    
    def __init__(self, vertex_service: VertexService):
        self.vertex_service = vertex_service

    @post("/extract-context")
    async def extract_context(self, files: FromFiles):
        if not files.value:
            return json({"error": "No file provided"}, status=400)

        video_file = files.value[0]

        # ADDED: save short video to temp
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(video_file.data)
            tmp_path = tmp.name

        prompt = (
            "Extract structured scene information from this video.\n"
            "Respond with ONLY valid JSON. No explanations, no markdown, no backticks.\n"
            "Follow this exact structure, keys required:\n"
            "{\n"
            '  "entities": [\n'
            '    { "id": "id-1", "description": "...", "appearance": "..." }\n'
            "  ],\n"
            '  "environment": "...",\n'
            '  "style": "..."\n'
            "}\n"
            "If information is missing, use empty strings.\n"
        )

        try:
            # Read video file
            with open(tmp_path, 'rb') as f:
                video_data = f.read()
            
            # Use vertex service to analyze video
            res = self.vertex_service.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[prompt, {"mime_type": "video/mp4", "data": video_data}]
            )

            raw = res.text or res.candidates[0].content.parts[0].text

            try:
                parsed = pyjson.loads(raw)
            except Exception:
                return json({"error": "Failed to parse JSON", "raw": raw}, status=500)

            return json(parsed)

        finally:
            os.remove(tmp_path)

    @post("/image")
    async def generate_image(self, image: FromFiles):
        if not image.value:
            return json({"error": "No image file provided"}, status=400)

        image_file = image.value[0]

        prompt = "Improve the attached image. Do not deviate from the original art style too much, simply understand the artist's idea and enhance it a bit."

        res = await self.vertex_service.generate_image_content(
            prompt=prompt,
            image=image_file.data
        )

        return json({"image_bytes": res})
