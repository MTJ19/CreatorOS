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
    messages,
    negotiation,
    payments,
)

app = FastAPI(title="Creator OS")

# Auth uses JWT Bearer tokens (Authorization header), not cookies.
# allow_origins="*" is safe here and avoids hardcoding Vercel preview URLs.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
app.include_router(messages.router)

def main():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
