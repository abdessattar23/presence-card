// api/status.js  —  Vercel serverless function (Upstash backend)
//
// Reads the latest presence blob the agent wrote to Upstash and hands it to
// the card. Set these env vars in Vercel (Project > Settings > Environment):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// (Upstash shows both on your database page.)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const r = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/presence`,
      { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
    );
    const data = await r.json(); // { result: "<json string>" | null }

    if (!data || !data.result) {
      return res.status(200).json({ activity: "idle", editor: null, media: null, ts: 0 });
    }
    return res.status(200).json(JSON.parse(data.result));
  } catch (err) {
    return res.status(200).json({ activity: "idle", editor: null, media: null, ts: 0 });
  }
}
