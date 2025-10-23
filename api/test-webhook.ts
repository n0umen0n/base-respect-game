/**
 * Test endpoint to verify webhook is reachable
 * Visit: https://your-domain.vercel.app/api/test-webhook
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("🧪 Test webhook endpoint hit!");
  console.log("Method:", req.method);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  return res.status(200).json({
    success: true,
    message: "Webhook endpoint is reachable!",
    timestamp: new Date().toISOString(),
    method: req.method,
    hasBody: !!req.body,
    bodyType: typeof req.body,
  });
}

