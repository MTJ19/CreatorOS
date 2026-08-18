import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai";

// CORS headers for the browser to call this edge function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { brandName, creatorNiche, initialOffer, desiredRate, tone = "professional" } = await req.json();

    // Validate inputs
    if (!brandName || !initialOffer || !desiredRate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: brandName, initialOffer, or desiredRate" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize OpenAI client
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey || apiKey === "your_openai_api_key_here") {
       return new Response(
        JSON.stringify({ error: "OpenAI API key is missing or not configured in .env" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Draft the script
    const prompt = `
      You are an expert talent manager representing a creator in the ${creatorNiche || "general"} niche.
      The brand, ${brandName}, has offered an initial rate of $${initialOffer}.
      Your goal is to counter-offer at $${desiredRate}.
      Write a ${tone} email to the brand negotiating for this higher rate. Keep it concise, polite, and persuasive.
    `;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for fast/cheap response in testing
      messages: [
        { role: "system", content: "You are a professional talent manager negotiating a brand deal." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const script = chatCompletion.choices[0].message.content;

    return new Response(
      JSON.stringify({ script }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error drafting script:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
