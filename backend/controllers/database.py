from blacksheep.server.controllers import APIController

class Database(APIController):
    def __init__(self, db_service):
        self.db_service = db_service
    
    