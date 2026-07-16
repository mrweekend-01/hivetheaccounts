from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routers import (auth, accounts, proxies, devices,
                             humanization, users, export,
                             settings as settings_router)

app = FastAPI(title="Hack the Accounts API", version="1.0.0")

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
app.include_router(users.router)
app.include_router(export.router)
app.include_router(settings_router.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
