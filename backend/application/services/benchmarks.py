from domain.interfaces.repositories import RateBenchmarkRepo
from domain.logic.benchmarks import compute_percentiles
from domain.models.benchmarks import BenchmarkOut, BenchmarkQuery


class BenchmarkService:
    def __init__(self, benchmark_repo: RateBenchmarkRepo):
        self.benchmark_repo = benchmark_repo

    async def get_benchmarks(self, query: BenchmarkQuery) -> BenchmarkOut:
        rates = await self.benchmark_repo.get_historical_rates(query.niche, query.follower_tier)
        return compute_percentiles(rates)
