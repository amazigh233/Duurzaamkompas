namespace DuurzaamWoningKompas.Api.Services;

public sealed class AdminAuthOptions
{
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string? ApiKey { get; set; }
    public bool AllowApiKeyHeader { get; set; }
}
