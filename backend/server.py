from blacksheep import Application
from services.storage_service import StorageService
from services.vertex_service import VertexService
from services.job_service import JobService
from rodi import Container
from controllers.jobs import Jobs

services = Container()

storage_service = StorageService()
vertex_service = VertexService()
job_service = JobService(vertex_service)

services.add_instance(storage_service, StorageService)
services.add_instance(vertex_service, VertexService)
services.add_instance(job_service, JobService)

app = Application(services=services)

# Register controllers
app.use_controllers(Jobs)

# TODO: REMOVE IN PRODUCTION, FOR DEV ONLY
app.use_cors(
    allow_methods="*",
    allow_origins="*",
    allow_headers="*",
)

for route in app.router:
    print(f"a")

# random test routes
@app.router.get("/")
def hello_world():
    return "Hello World"

@app.router.get("/test")
async def test_route():
    return await vertex_service.test_service()

