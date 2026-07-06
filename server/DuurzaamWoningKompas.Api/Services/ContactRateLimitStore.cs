using System.Collections.Concurrent;

namespace DuurzaamWoningKompas.Api.Services;

public sealed class ContactRateLimitStore
{
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(10);
    private const int MaxAttempts = 3;
    private readonly ConcurrentDictionary<string, List<DateTimeOffset>> _attempts = new();

    public bool IsAllowed(string key, DateTimeOffset now)
    {
        var attempts = _attempts.AddOrUpdate(
            key,
            _ => [now],
            (_, existing) =>
            {
                lock (existing)
                {
                    existing.RemoveAll(item => item <= now - Window);
                    existing.Add(now);
                    return existing;
                }
            });

        lock (attempts)
        {
            attempts.RemoveAll(item => item <= now - Window);
            return attempts.Count <= MaxAttempts;
        }
    }
}
