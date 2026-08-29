import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, maxTokens = 600 } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check available API keys (OpenRouter or Gemini)
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('AI_API_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    // Determine if OpenRouter key is available or key format is sk-or- / sk-
    if (openRouterKey || (geminiKey && geminiKey.startsWith('sk-'))) {
      const activeKey = openRouterKey || geminiKey
      const openRouterModels = [
        "google/gemini-2.5-flash",
        "openai/gpt-4o-mini",
        "deepseek/deepseek-chat",
        "meta-llama/llama-3.3-70b-instruct"
      ]

      let lastError = "All OpenRouter models failed"

      for (const model of openRouterModels) {
        try {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeKey}`,
              "HTTP-Referer": "https://trimtimepos.com",
              "X-Title": "TrimTime POS",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: "You are a professional business consultant for barber shops and beauty salons. Give concise, highly actionable advice." },
                { role: "user", content: prompt }
              ],
              max_tokens: maxTokens,
              temperature: 0.7
            })
          })

          const data = await res.json()
          if (res.ok && data.choices?.[0]?.message?.content) {
            return new Response(
              JSON.stringify({ text: data.choices[0].message.content, modelUsed: model }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            console.warn(`OpenRouter model ${model} failed:`, data.error?.message || res.statusText)
            lastError = data.error?.message || `HTTP ${res.status}`
          }
        } catch (err) {
          console.warn(`OpenRouter fetch error for ${model}:`, err)
          lastError = err.message
        }
      }

      throw new Error(`OpenRouter API call failed: ${lastError}`)
    }

    // Fallback to Google Gemini directly if GEMINI_API_KEY is configured
    if (geminiKey) {
      const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.5-flash"
      ]

      let lastError = "All Gemini models failed"

      for (const model of modelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  maxOutputTokens: maxTokens,
                  temperature: 0.7
                }
              })
            }
          )

          const data = await res.json()

          if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return new Response(
              JSON.stringify({ text: data.candidates[0].content.parts[0].text, modelUsed: model }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            console.warn(`Gemini model ${model} failed:`, data.error?.message)
            lastError = data.error?.message || "Unknown error"
          }
        } catch (err) {
          lastError = err.message
        }
      }

      throw new Error(`Google Gemini API rejected the key: ${lastError}`)
    }

    throw new Error("No AI API Key found. Please configure OPENROUTER_API_KEY or GEMINI_API_KEY in your Supabase Edge Function secrets.")

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
