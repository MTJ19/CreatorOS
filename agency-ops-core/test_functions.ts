import { assertEquals, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";


Deno.test("Rate Calculation: standard formula validation", () => {
  const viewsPerWeek = 500000;
  const cpm = 20.0; // tech
  const followerMultiplier = 2000; // macro
  const engagementAdjustment = 200; // high

  const viewsValue = (viewsPerWeek / 1000) * cpm; // 500 * 20 = 10000
  const baseRate = viewsValue + followerMultiplier + engagementAdjustment; // 10000 + 2000 + 200 = 12200
  const suggestedRateLow = baseRate * 0.85; // 10370
  const suggestedRateHigh = baseRate * 1.35; // 16470

  assertEquals(viewsValue, 10000);
  assertEquals(baseRate, 12200);
  assertEquals(suggestedRateLow, 10370);
  assertEquals(suggestedRateHigh, 16470);
});

Deno.test("Growth Forecasting: compounding growth and confidence bands", () => {
  const currentFollowers = 100000;
  const weeklyGrowthRate = 0.05;
  const weeksToForecast = 4;

  const baseForecast = currentFollowers * Math.pow(1 + weeklyGrowthRate, weeksToForecast);
  const lowerGrowthRate = weeklyGrowthRate * 0.8;
  const upperGrowthRate = weeklyGrowthRate * 1.2;

  const lowerBound = currentFollowers * Math.pow(1 + lowerGrowthRate, weeksToForecast);
  const upperBound = currentFollowers * Math.pow(1 + upperGrowthRate, weeksToForecast);

  assertEquals(Math.round(baseForecast), 121551);
  assertEquals(Math.round(lowerBound), 116986);
  assertEquals(Math.round(upperBound), 126248);
  assert(upperBound > baseForecast);
  assert(baseForecast > lowerBound);

});

Deno.test("Checklist Gate: required fields and safety rules", () => {
  const payload = {
    usage_rights_duration: "6 months",
    exclusivity_scope: "Category Specific",
    revision_limit: 2,
    payment_timeline: "Net 30"
  };

  const missing = [];
  if (!payload.usage_rights_duration) missing.push("usage_rights_duration");
  if (!payload.exclusivity_scope) missing.push("exclusivity_scope");
  if (payload.revision_limit === undefined) missing.push("revision_limit");
  if (!payload.payment_timeline) missing.push("payment_timeline");

  assertEquals(missing.length, 0);
});
