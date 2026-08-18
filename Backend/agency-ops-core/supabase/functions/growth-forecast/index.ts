import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { currentFollowers, weeklyGrowthRate, weeksToForecast = 4 } = await req.json();

    if (currentFollowers === undefined || weeklyGrowthRate === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: currentFollowers, weeklyGrowthRate" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Weekly compounding growth calculation
    const baseForecast = currentFollowers * Math.pow(1 + weeklyGrowthRate, weeksToForecast);
    
    // Confidence band calculation (e.g., +/- 20% variance on the growth rate itself)
    const lowerGrowthRate = weeklyGrowthRate * 0.8;
    const upperGrowthRate = weeklyGrowthRate * 1.2;

    const lowerBound = currentFollowers * Math.pow(1 + lowerGrowthRate, weeksToForecast);
    const upperBound = currentFollowers * Math.pow(1 + upperGrowthRate, weeksToForecast);

    return new Response(
      JSON.stringify({
        weeksForecasted: weeksToForecast,
        forecast: {
          base: Math.round(baseForecast),
          lowerBound: Math.round(lowerBound),
          upperBound: Math.round(upperBound),
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
