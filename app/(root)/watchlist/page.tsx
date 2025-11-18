import Link from "next/link";
import SearchCommand from "@/components/SearchCommand";
import WatchlistButton from "@/components/WatchlistButton";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { getNews, searchStocks } from "@/lib/actions/finnhub.actions";
import { formatTimeAgo, getChangeColorClass } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistPage() {
    const [watchlist, initialStocks] = await Promise.all([getWatchlistWithData(), searchStocks()]);

    const symbols = watchlist.map((item) => item.symbol);
    let news: MarketNewsArticle[] = [];

    try {
        news = await getNews(symbols.length ? symbols : undefined);
    } catch (err) {
        console.error("watchlist: failed to load news", err);
    }
    const hasWatchlistItems = watchlist.length > 0;

    return (
        <div className="watchlist-">
            <section className="watchlist space-y-8">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="watchlist-title">Your Watchlist</h1>
                        <p className="text-gray-400">Track the symbols you care about and jump back into their detail pages.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SearchCommand label="Add stocks" initialStocks={initialStocks} />
                    </div>
                </header>

                {hasWatchlistItems ? (
                    <>
                        <div className="watchlist-table overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead>
                                    <tr className="table-header-row">
                                        {WATCHLIST_TABLE_HEADER.map((heading) => (
                                            <th key={heading} scope="col" className="px-4 py-3 text-left text-sm uppercase tracking-wide table-header">
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {watchlist.map((item) => (
                                        <tr key={item.symbol} className="table-row">
                                            <td className="px-4 py-4">
                                                <Link href={`/stocks/${item.symbol}`} className="hover:text-yellow-500 transition-colors">
                                                    {item.company}
                                                </Link>
                                                <p className="text-sm text-gray-500">Added on {new Date(item.addedAt).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-4 py-4 table-cell font-semibold">{item.symbol}</td>
                                            <td className="px-4 py-4 table-cell">{item.priceFormatted ?? "—"}</td>
                                            <td className={`px-4 py-4 table-cell ${getChangeColorClass(item.changePercent)}`}>
                                                {item.changeFormatted ?? "—"}
                                            </td>
                                            <td className="px-4 py-4 table-cell">{item.marketCap ?? "N/A"}</td>
                                            <td className="px-4 py-4 table-cell">{item.peRatio ?? "N/A"}</td>
                                            <td className="px-4 py-4">
                                                <button type="button" className="add-alert disabled:opacity-50" disabled>
                                                    Alert soon
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <WatchlistButton symbol={item.symbol} company={item.company} isInWatchlist showTrashIcon />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {news?.length ? (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-gray-100">Related News</h2>
                                    <p className="text-sm text-gray-500">Pulled from Finnhub every few minutes</p>
                                </div>
                                <div className="watchlist-news">
                                    {news.map((article) => (
                                        <a
                                            key={article.id}
                                            href={article.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="news-item"
                                        >
                                            <span className="news-tag">{article.source}</span>
                                            <h3 className="news-title">{article.headline}</h3>
                                            <div className="news-meta">
                                                <span>{formatTimeAgo(article.datetime)}</span>
                                                {article.related ? <span className="ml-2 text-yellow-500">{article.related}</span> : null}
                                            </div>
                                            <p className="news-summary">{article.summary}</p>
                                            <span className="news-cta">Read article →</span>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </>
                ) : (
                    <div className="watchlist-empty-container">
                        <div className="watchlist-empty">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#6B7280"
                                strokeWidth="1.5"
                                className="watchlist-star"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
                                />
                            </svg>
                            <h2 className="empty-title">No watchlist items yet</h2>
                            <p className="empty-description">
                                Use the search command to find a stock and tap “Add to Watchlist”. We&apos;ll keep real-time details here once you start saving
                                tickers.
                            </p>
                        </div>
                        <SearchCommand label="Search stocks" initialStocks={initialStocks} />
                    </div>
                )}
            </section>
        </div>
    );
}

