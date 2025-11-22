from blacksheep import json, FromFiles
from blacksheep.server.controllers import APIController, post

import tempfile
import os
import json as pyjson

from backend.services.vertex_service import VertexService

class GeminiController(APIController):
    
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
            "Return ONLY JSON in exactly this shape:\n"
            "{\n"
            '  "entities": [\n'
            '    { "id": "id-1", "description": "...", "appearance": "..." }\n'
            "  ],\n"
            '  "environment": "...",\n'
            '  "style": "..."\n'
            "}"
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

            raw = res.text

            try:
                parsed = pyjson.loads(raw)
            except Exception:
                return json({"error": "Failed to parse JSON", "raw": raw}, status=500)

            return json(parsed)

        finally:
            os.remove(tmp_path)
