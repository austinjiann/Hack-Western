import logging
from blacksheep import Application, Request, Request
from services.storage_service import StorageService
from services.vertex_service import VertexService
from services.job_service import JobService
from services.supabase_service import SupabaseService
from services.autumn_service import AutumnService
from services.video_merge_service import VideoMergeService
from rodi import Container

services = Container()

storage_service = StorageService()
vertex_service = VertexService()
job_service = JobService(vertex_service)
supabase_service = SupabaseService()
autumn_service = AutumnService()
video_merge_service = VideoMergeService(storage_service)

services.add_instance(storage_service, StorageService)
services.add_instance(vertex_service, VertexService)
services.add_instance(job_service, JobService)
services.add_instance(supabase_service, SupabaseService)
services.add_instance(autumn_service, AutumnService)
services.add_instance(video_merge_service, VideoMergeService)

app = Application(services=services)

# TODO: REMOVE IN PRODUCTION, FOR DEV ONLY
app.use_cors(
    allow_methods="*",
    allow_origins="*",
    allow_headers="*",
)

async def attach_user(request: Request):
    try:
        uid = supabase_service.get_user_id_from_request(request)
        if uid:
            request.scope["user_id"] = uid
    except Exception:
        # Do not block request processing on auth parsing errors
        pass

app.middlewares.append(attach_user)

# random test routes
@app.router.get("/")
def hello_world():
    return "Hello World"

@app.router.get("/test")
async def test_route():
    return await vertex_service.test_service()
