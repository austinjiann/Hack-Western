from blacksheep import json, Request
from blacksheep.server.controllers import APIController, get

from services.supabase_service import SupabaseService

class Supabase(APIController):
    
    def __init__(self, supabase_service: SupabaseService):
        self.supabase_service = supabase_service

    @get("/user")
    async def get_user_row(self, request: Request):
        try:
            user_id = request.scope.get("user_id") or self.supabase_service.get_user_id_from_request(request)
            if not user_id:
                return json({"error": "Unauthorized"}, status=401)
            
            res = self.supabase_service.get_user_row(user_id=user_id)

            if not res or not res.data:
                return json({"error": "Row not found"}, status=404)

            return json(res.data)
        
        except Exception as e:
            print("supabase error:", e) # log it cuz why not
            return json({"error": str(e)}, status=500)
        
    @get("/transactions")
    async def get_transaction_log(self, request: Request):
        try:
            user_id = request.scope.get("user_id") or self.supabase_service.get_user_id_from_request(request)
            if not user_id:
                return json({"error": "Unauthorized"}, status=401)
            
            res = self.supabase_service.get_transaction_log(user_id=user_id)

            if not res or not res.data:
                return json([])

            return json(res.data)
        
        except Exception as e:
            print("supabase error:", e) # log it cuz why not
            return json({"error": str(e)}, status=500)
        
    