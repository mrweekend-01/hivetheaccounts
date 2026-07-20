from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.scheduler import scheduler
from app.api.routers import (auth, accounts, proxies, devices,
                             humanization, humanization_schedules, tasks, users, export,
                             settings as settings_router)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Hack the Accounts API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(proxies.router)
app.include_router(devices.router)
app.include_router(humanization.router)
app.include_router(humanization_schedules.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(export.router)
app.include_router(settings_router.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
