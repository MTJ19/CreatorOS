import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from interface.routers import (
    activity_log,
    analytics,
    auth,
    benchmarks,
    contract_intelligence,
    contracts,
    creators,
    deals,
    deliverables,
    negotiation,
    payments,
)

app = FastAPI(title="Creator OS")

frontend_origins = ["http://localhost:3000"]
if extra_origin := os.getenv("FRONTEND_URL"):
    frontend_origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(creators.router)
app.include_router(deals.router)
app.include_router(contracts.router)
app.include_router(deliverables.router)
app.include_router(activity_log.router)
app.include_router(negotiation.router)
app.include_router(payments.router)
app.include_router(contract_intelligence.router)
app.include_router(contract_intelligence.escalations_router)
app.include_router(benchmarks.router)
app.include_router(analytics.router)

def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
