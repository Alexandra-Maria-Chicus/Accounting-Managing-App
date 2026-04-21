from fastapi import APIRouter

from app.services import generator_service

router = APIRouter(prefix="/generator", tags=["generator"])


@router.post("/start")
async def start():
    await generator_service.start()
    return {"status": "started"}


@router.post("/stop")
async def stop():
    await generator_service.stop()
    return {"status": "stopped"}


@router.get("/status")
def status():
    return {"running": generator_service.is_running()}
