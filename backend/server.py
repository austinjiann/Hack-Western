from blacksheep import Application, json, Request
from services.storage_service import StorageService
from services.vertex_service import VertexService
from services.job_service import JobService
from services.autumn_service import AutumnService
from rodi import Container

services = Container()

storage_service = StorageService()
vertex_service = VertexService()
job_service = JobService(vertex_service)
autumn_service = AutumnService()

services.add_instance(storage_service, StorageService)
services.add_instance(vertex_service, VertexService)
services.add_instance(job_service, JobService)
services.add_instance(autumn_service, AutumnService)

app = Application(services=services)

# TODO: REMOVE IN PRODUCTION, FOR DEV ONLY
app.use_cors(
    allow_methods="*",
    allow_origins="*",
    allow_headers="*",
)

# random test routes
@app.router.get("/")
def hello_world():
    return "Hello World"

@app.router.get("/test")
async def test_route():
    return await vertex_service.test_service()

