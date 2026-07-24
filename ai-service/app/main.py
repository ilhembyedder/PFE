from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.extraction import router as extraction_router
import uvicorn

def main():
    app = FastAPI(
        title="LeasRecover AI Service",
        description="Extracts data from leasing expertise reports using LLMs/NLP",
        version="0.1.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8080"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check():
        return {"status": "success", "data": {"status": "up"}}

    app.include_router(extraction_router, prefix="/api")

    return app

app = main()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
