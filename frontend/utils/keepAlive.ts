export function startKeepAlive() {
    if (typeof window === "undefined") return;
    setInterval(async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ping`);
        } catch (_) { }
    }, 10 * 60 * 1000); // every 10 minutes
}