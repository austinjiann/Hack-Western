from blacksheep import json, Request
from blacksheep.server.controllers import APIController, get
from services.supabase_service import SupabaseService

class SupabaseController(APIController):

    def __init__(self, supabase_service: SupabaseService):
        self.supabase_service = supabase_service

    @get("/user/<user_id>")
    async def get_user(self, user_id: str, request: Request):
        table = request.args.get("table")
        if not table:
            return json({"error": "Table name is required"}, status=400)
        try:
            row = self.supabase_service.get_user_row(user_id, table)

            if not row or not row.data or len(row.data) == 0:
                return json({"error": "User not found"}, status=404)

            return json(row.data[0])
        except Exception as e:
            print(f"ERROR in get_user: {e}")
            return json({"error": str(e)}, status=500)

