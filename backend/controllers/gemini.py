from blacksheep import json, Request
from blacksheep.server.controllers import APIController, post
import json as pyjson

from services.vertex_service import VertexService
from services.supabase_service import SupabaseService

class Gemini(APIController):
    
    def __init__(self, vertex_service: VertexService, supabase_service: SupabaseService):
        self.vertex_service = vertex_service
        self.supabase_service = supabase_service

    @post("/extract-context")
    async def extract_context(self, request: Request):
        try:
            # Parse multipart form data manually
            files = await request.files()
            
            if not files:
                return json({"error": "No video file provided"}, status=400)
            
            video_data = files[0]
            
            
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
            #use vertex service to analyze video
            res = self.vertex_service.analyze_video_content(
                prompt=prompt,
                video_data=video_data
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


        except Exception as e:
            print(f"ERROR in extract_context: {e}")
            import traceback
            traceback.print_exc()
            return json({"error": str(e)}, status=500)

    @post("/image")
    async def generate_image(self, request: Request):
        try:
            # get user token
            user_id = request.scope.get("user_id") or self.supabase_service.get_user_id_from_request(request)
            if not user_id:
                return json({"error": "Unauthorized"}, status=401)

            files = await request.files()
            
            if not files:
                return json({"error": "No image file provided"}, status=400)
            
            image_data = files[0]

            # Check and deduct credits BEFORE generating
            success, error = self.supabase_service.do_transaction(
                user_id=user_id,
                transaction_type="image_gen",
                credit_usage=1 # TODO: adjust number later
            )
            
            if not success:
                if error == "insufficient_credits":
                    return json({"error": "You don't have enough credits. Please purchase more credits to continue."}, status=402)
                return json({"error": "Transaction failed"}, status=500)

            prompt = "Improve the attached image and fill in any missing details (There may be annotations and stuff but don't remove them or follow them, treat them like they dont exist unless they explicitly say to do so). Do not deviate from the original art style too much, simply understand the artist's idea and enhance it a bit."

            res = await self.vertex_service.generate_image_content(
                prompt=prompt,
                image=image_data.data
            )

            return json({"image_bytes": res})
            
        except Exception as e:
            print(f"ERROR in generate_image: {e}")
            import traceback
            traceback.print_exc()
            return json({"error": str(e)}, status=500)