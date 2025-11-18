"use client";
import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist,
    showTrashIcon = false,
    type = "button",
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const router = useRouter();
    const [added, setAdded] = useState<boolean>(!!isInWatchlist);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const label = useMemo(() => {
        if (type === "icon") return "";
        if (isPending) return added ? "Adding..." : "Removing...";
        return added ? "Remove from Watchlist" : "Add to Watchlist";
    }, [added, isPending, type]);

    const handleClick = () => {
        if (isPending) return;

        const next = !added;
        setAdded(next);
        setError(null);

        startTransition(async () => {
            const actionResult = next
                ? await addToWatchlist({ symbol, company: company || symbol })
                : await removeFromWatchlist(symbol);

            if (!actionResult?.success) {
                setAdded(!next);
                setError(actionResult?.message || "Unable to update watchlist.");
                return;
            }

            onWatchlistChange?.(symbol, next);
            router.refresh();
        });
    };

    const baseProps = {
        onClick: handleClick,
        disabled: isPending,
        "aria-pressed": added,
        "aria-busy": isPending,
        title: error ?? (added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`),
    };

    if (type === "icon") {
        return (
            <button
                {...baseProps}
                aria-label={error ?? (added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`)}
                className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={added ? "#FACC15" : "none"}
                    stroke="#FACC15"
                    strokeWidth="1.5"
                    className="watchlist-star"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
                    />
                </svg>
                <span className="sr-only">
                    {error ?? (added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`)}
                </span>
            </button>
        );
    }

    return (
        <button className={`watchlist-btn ${added ? "watchlist-remove" : ""} inline-flex items-center justify-center`} {...baseProps}>
            <span className="flex items-center justify-center gap-2">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{label}</span>
                {!isPending && showTrashIcon && added ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
                    </svg>
                ) : null}
            </span>
            {error ? (
                <span className="sr-only" role="status">
                    {error}
                </span>
            ) : null}
        </button>
    );
};

export default WatchlistButton;