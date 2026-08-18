import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { currentFollowers, weeklyGrowthRate, weeksToForecast = 4 } = await req.json();

    if (currentFollowers === undefined || weeklyGrowthRate === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: currentFollowers, weeklyGrowthRate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Weekly compounding growth calculation
    const baseForecast = currentFollowers * Math.pow(1 + weeklyGrowthRate, weeksToForecast);
    
    // Confidence band calculation (e.g., +/- 20% variance on the growth rate itself)
    const lowerGrowthRate = weeklyGrowthRate * 0.8;
    const upperGrowthRate = weeklyGrowthRate * 1.2;

    const lowerBound = currentFollowers * Math.pow(1 + lowerGrowthRate, weeksToForecast);
    const upperBound = currentFollowers * Math.pow(1 + upperGrowthRate, weeksToForecast);

    // Compute weekly trajectory for charting
    const weeklyPoints = [];
    for (let w = 0; w <= weeksToForecast; w++) {
      weeklyPoints.push({
        week: w,
        base: Math.round(currentFollowers * Math.pow(1 + weeklyGrowthRate, w)),
        lowerBound: Math.round(currentFollowers * Math.pow(1 + lowerGrowthRate, w)),
        upperBound: Math.round(currentFollowers * Math.pow(1 + upperGrowthRate, w)),
      });
    }

    return new Response(
      JSON.stringify({
        weeksForecasted: weeksToForecast,
        forecast: {
          base: Math.round(baseForecast),
          lowerBound: Math.round(lowerBound),
          upperBound: Math.round(upperBound),
        },
        weeklyPoints,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error in growth forecast";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

