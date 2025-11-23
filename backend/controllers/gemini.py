from blacksheep import json, Request
from blacksheep.server.controllers import APIController, post

import tempfile
import os
import json as pyjson

from services.vertex_service import VertexService

class Gemini(APIController):
    
    def __init__(self, vertex_service: VertexService):
        self.vertex_service = vertex_service

    @post("/extract-context")
    async def extract_context(self, request: Request):
        try:
            # Parse multipart form data manually
            multipart = await request.multipart()
            
            video_data = None
            async for part in multipart:
                if part.name == "files":
                    video_data = await part.read()
                    break
            
            if not video_data:
                return json({"error": "No video file provided"}, status=400)
            
            print(f"Received video data: {len(video_data)} bytes")

            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                tmp.write(video_data)
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
                    video_bytes = f.read()
                
                # Use vertex service to analyze video
                res = self.vertex_service.client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=[prompt, {"mime_type": "video/mp4", "data": video_bytes}]
                )

                raw = res.text or res.candidates[0].content.parts[0].text

                # Strip markdown if present
                cleaned = raw.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split('\n')
                    cleaned = '\n'.join(lines[1:])
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()

                try:
                    parsed = pyjson.loads(cleaned)
                    return json(parsed)
                except Exception:
                    return json({"error": "Failed to parse JSON", "raw": raw}, status=500)

            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        except Exception as e:
            print(f"ERROR in extract_context: {e}")
            import traceback
            traceback.print_exc()
            return json({"error": str(e)}, status=500)

    @post("/image")
    async def generate_image(self, request: Request):
        try:
            multipart = await request.multipart()
            
            image_data = None
            async for part in multipart:
                if part.name == "image":
                    image_data = await part.read()
                    break
            
            if not image_data:
                return json({"error": "No image file provided"}, status=400)

            prompt = "Improve the attached image. Do not deviate from the original art style too much, simply understand the artist's idea and enhance it a bit."

            res = await self.vertex_service.generate_image_content(
                prompt=prompt,
                image=image_data
            )

            return json({"image_bytes": res})
            
        except Exception as e:
            print(f"ERROR in generate_image: {e}")
            import traceback
            traceback.print_exc()
            return json({"error": str(e)}, status=500)