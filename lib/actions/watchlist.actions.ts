'use server';

import { headers } from 'next/headers';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { fetchJSON } from '@/lib/actions/finnhub.actions';
import { formatChangePercent, formatPrice } from '@/lib/utils';

type SessionUser = {
  id: string;
  email: string;
};

type FinnhubQuoteResponse = {
  c?: number; // Current price
  dp?: number; // Change percent
};

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_TOKEN = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;
    return {
      id: session.user.id,
      email: session.user.email || '',
    };
  } catch (err) {
    console.error('watchlist:getSessionUser error:', err);
    return null;
  }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistEntries(): Promise<StockWithData[]> {
  const currentUser = await getSessionUser();
  if (!currentUser?.id) return [];

  try {
    await connectToDatabase();
    const entries = await Watchlist.find({ userId: currentUser.id }).sort({ addedAt: -1 }).lean();

    return entries.map((item) => ({
      userId: item.userId,
      symbol: item.symbol,
      company: item.company,
      addedAt: item.addedAt,
    }));
  } catch (err) {
    console.error('getWatchlistEntries error:', err);
    return [];
  }
}

export async function getWatchlistWithData(): Promise<StockWithData[]> {
  const entries = await getWatchlistEntries();
  if (entries.length === 0) return [];

  if (!FINNHUB_TOKEN) {
    console.warn('FINNHUB API key is not configured. Returning basic watchlist data.');
    return entries;
  }

  const enriched = await Promise.all(
    entries.map(async (entry) => {
      try {
        const quote = await fetchJSON<FinnhubQuoteResponse>(
          `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(entry.symbol)}&token=${FINNHUB_TOKEN}`,
          120
        );

        const currentPrice = quote?.c;
        const changePercent = quote?.dp;

        return {
          ...entry,
          currentPrice,
          changePercent,
          priceFormatted: typeof currentPrice === 'number' ? formatPrice(currentPrice) : undefined,
          changeFormatted: typeof changePercent === 'number' ? formatChangePercent(changePercent) : undefined,
        };
      } catch (err) {
        console.error('Failed to fetch quote for symbol:', entry.symbol, err);
        return entry;
      }
    })
  );

  return enriched;
}

export async function isSymbolInWatchlist(symbol: string): Promise<boolean> {
  const currentUser = await getSessionUser();
  if (!currentUser?.id) return false;

  try {
    await connectToDatabase();
    const existing = await Watchlist.findOne({ userId: currentUser.id, symbol: symbol.trim().toUpperCase() }).lean();
    return Boolean(existing);
  } catch (err) {
    console.error('isSymbolInWatchlist error:', err);
    return false;
  }
}

export async function addToWatchlist(payload: { symbol: string; company?: string }) {
  const currentUser = await getSessionUser();
  if (!currentUser?.id) {
    return { success: false, message: 'You must be signed in to modify your watchlist.' };
  }

  const symbol = payload?.symbol?.trim().toUpperCase();
  if (!symbol) {
    return { success: false, message: 'Symbol is required.' };
  }

  const company = payload?.company?.trim() || symbol;

  try {
    await connectToDatabase();
    await Watchlist.findOneAndUpdate(
      { userId: currentUser.id, symbol },
      { userId: currentUser.id, symbol, company, addedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { success: true };
  } catch (err) {
    console.error('addToWatchlist error:', err);
    const message = err instanceof Error ? err.message : 'Unable to add to watchlist.';
    return { success: false, message };
  }
}

export async function removeFromWatchlist(symbol?: string) {
  const currentUser = await getSessionUser();
  if (!currentUser?.id) {
    return { success: false, message: 'You must be signed in to modify your watchlist.' };
  }

  const normalizedSymbol = symbol?.trim().toUpperCase();
  if (!normalizedSymbol) {
    return { success: false, message: 'Symbol is required.' };
  }

  try {
    await connectToDatabase();
    await Watchlist.deleteOne({ userId: currentUser.id, symbol: normalizedSymbol });
    return { success: true };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    const message = err instanceof Error ? err.message : 'Unable to remove from watchlist.';
    return { success: false, message };
  }
}