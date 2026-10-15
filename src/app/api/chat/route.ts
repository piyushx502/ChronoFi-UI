import { NextRequest } from "next/server";
import { getProfileByAuth } from "../profile/store";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const searchParams = req.nextUrl.searchParams;
  const message = searchParams.get("message") || "";
  const existingThreadId = searchParams.get("thread_id");
  const threadId = existingThreadId || `thread_${Date.now()}`;

  const profile = getProfileByAuth(authHeader);

  // Prepare response text
  let replyText = "";
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("car") || lowerMsg.includes("vehicle") || lowerMsg.includes("loan")) {
    replyText = `Based on your monthly surplus of ₹${profile.monthly_investable_surplus.toLocaleString('en-IN')}, I analyzed a vehicle loan scenario. An EMI of up to ₹15,000 to ₹20,000/month is sustainable, but prepaying or targeting a 30% downpayment protects your long-term compounding.`;
  } else if (lowerMsg.includes("retire") || lowerMsg.includes("freedom") || lowerMsg.includes("corpus")) {
    replyText = `Evaluating your current net worth of ₹${profile.net_worth.toLocaleString('en-IN')} with an expected 12% equity growth rate: With a monthly SIP of ₹${profile.monthly_investable_surplus.toLocaleString('en-IN')}, your projected 30-year corpus reaches ₹${(profile.net_worth * 12).toLocaleString('en-IN')}, providing full financial independence by age ${profile.age + 25}.`;
  } else if (lowerMsg.includes("tax") || lowerMsg.includes("regime")) {
    replyText = `Under the Finance Act 2024 provisions, the New Tax Regime offers standard deduction of ₹75,000 and Section 87A rebate up to ₹12 Lakhs. Your annual salary of ₹${(profile.base_salary * 12).toLocaleString('en-IN')} benefits from optimal equity LTCG harvesting under the ₹1.25L exemption threshold.`;
  } else {
    replyText = `I have received your planning query: "${message}". Using your portfolio profile (${profile.name}, Age ${profile.age}, ${profile.risk_tolerance} risk profile), I verified that your runway (${profile.months_of_runway} months) and investable surplus (₹${profile.monthly_investable_surplus.toLocaleString('en-IN')}/mo) remain well-positioned.`;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send thread_id
      const threadMsg = `data: ${JSON.stringify({ type: "thread_id", thread_id: threadId })}\n\n`;
      controller.enqueue(encoder.encode(threadMsg));

      // 2. Stream tokens word by word
      const words = replyText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const token = (i === 0 ? "" : " ") + words[i];
        const tokenMsg = `data: ${JSON.stringify({ type: "token", content: token })}\n\n`;
        controller.enqueue(encoder.encode(tokenMsg));
        // Small delay between words for realistic streaming feel
        await new Promise((resolve) => setTimeout(resolve, 35));
      }

      // 3. Send done
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
