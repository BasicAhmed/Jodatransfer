import { NextResponse } from "next/server";
import { fetchCombinedUsdRates } from "@/lib/fx";

export const dynamic = "force-dynamic";

/** Same-origin relay for the admin panel's "update now" button — avoids
 *  browser CORS issues hitting open.er-api.com / Binance directly. No
 *  secret needed, it's read-only public rate data. */
export async function GET() {
  try {
    const { rates, sdgError, sdgDetail } = await fetchCombinedUsdRates();
    // sdgDetail must be passed through: the admin "update now" button stores
    // it as the USDT/SDG baseline. Without it the baseline stayed stale, so
    // the admin showed an old USDT/SDG number and manual overrides rescaled
    // SDG prices from the wrong starting point.
    return NextResponse.json({ rates, sdgError, sdgDetail }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
