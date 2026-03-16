const DATAPI_BASE = "https://datapi.jup.ag/v1";

/**
 * Search for token data by name, symbol, or mint address.
 * Returns condensed token info useful for confidence scoring.
 */
export async function getTokenInfo({ query }) {
  const url = `${DATAPI_BASE}/assets/search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Token search API error: ${res.status}`);
  const data = await res.json();
  const tokens = Array.isArray(data) ? data : [data];
  if (!tokens.length) return { found: false, query };

  return {
    found: true,
    query,
    results: tokens.slice(0, 5).map((t) => ({
      mint: t.id,
      name: t.name,
      symbol: t.symbol,
      mcap: t.mcap,
      price: t.usdPrice,
      liquidity: t.liquidity,
      holders: t.holderCount,
      organic_score: t.organicScore,
      organic_label: t.organicScoreLabel,
      launchpad: t.launchpad,
      graduated: !!t.graduatedPool,
      audit: t.audit ? {
        mint_disabled: t.audit.mintAuthorityDisabled,
        freeze_disabled: t.audit.freezeAuthorityDisabled,
        top_holders_pct: t.audit.topHoldersPercentage?.toFixed(2),
        bot_holders_pct: t.audit.botHoldersPercentage?.toFixed(2),
        dev_migrations: t.audit.devMigrations,
      } : null,
      stats_1h: t.stats1h ? {
        price_change: t.stats1h.priceChange?.toFixed(2),
        buy_vol: t.stats1h.buyVolume?.toFixed(0),
        sell_vol: t.stats1h.sellVolume?.toFixed(0),
        buyers: t.stats1h.numOrganicBuyers,
        net_buyers: t.stats1h.numNetBuyers,
      } : null,
      stats_24h: t.stats24h ? {
        price_change: t.stats24h.priceChange?.toFixed(2),
        buy_vol: t.stats24h.buyVolume?.toFixed(0),
        sell_vol: t.stats24h.sellVolume?.toFixed(0),
        buyers: t.stats24h.numOrganicBuyers,
        net_buyers: t.stats24h.numNetBuyers,
      } : null,
    })),
  };
}

/**
 * Get holder distribution for a token mint.
 */
export async function getTokenHolders({ mint }) {
  const url = `${DATAPI_BASE}/holders/${mint}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Holders API error: ${res.status}`);
  const data = await res.json();

  // Condense — return top holders + concentration stats
  const holders = Array.isArray(data) ? data : (data.holders || data.data || []);
  const total = holders.length;
  const top10Pct = holders.slice(0, 10).reduce((s, h) => s + (h.percentage || h.pct || 0), 0);

  return {
    mint,
    total_in_response: total,
    top_10_pct: top10Pct?.toFixed(2),
    holders: holders.slice(0, 20).map((h) => ({
      address: h.address || h.wallet,
      amount: h.amount,
      pct: h.percentage ?? h.pct,
    })),
  };
}
