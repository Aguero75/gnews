// =====================================
// /api/news - Vercel Serverless Function
// =====================================
//
// Why this exists:
// GNews's free-tier API key only allows CORS requests from "localhost".
// That's why the site worked with VS Code Live Server (127.0.0.1) but
// showed nothing once deployed to Vercel - the browser's request was
// being blocked by GNews because the request came from a non-localhost
// origin.
//
// The fix: the browser no longer talks to GNews directly. It talks to
// THIS endpoint (same origin, so no CORS issue at all), and this
// function - running on Vercel's server, not in the browser - fetches
// the data from GNews and hands it back. Server-to-server requests are
// never subject to browser CORS rules.
//
// As a bonus, your API key now lives only in an environment variable on
// Vercel, instead of being visible to anyone who views your page source.

module.exports = async function handler(req, res) {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        res.status(500).json({
            error:
                "Missing GNEWS_API_KEY environment variable. Add it in your Vercel project settings (Settings > Environment Variables), then redeploy.",
        });
        return;
    }

    const category = "general";
    const language = "en";
    const country = "ng";
    const maxArticles = 10;

    const apiUrl =
        `https://gnews.io/api/v4/top-headlines` +
        `?category=${category}` +
        `&lang=${language}` +
        `&country=${country}` +
        `&max=${maxArticles}` +
        `&apikey=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            res.status(response.status).json(data);
            return;
        }

        // Cache for 10 minutes on Vercel's edge to save your daily
        // GNews request quota (free plan = 100 requests/day).
        res.setHeader(
            "Cache-Control",
            "s-maxage=600, stale-while-revalidate=1200"
        );

        res.status(200).json(data);
    } catch (error) {
        console.error("Could not fetch news from GNews:", error);
        res.status(500).json({ error: "Failed to fetch news." });
    }
};
