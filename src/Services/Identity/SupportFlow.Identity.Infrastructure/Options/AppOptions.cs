namespace SupportFlow.Identity.Infrastructure.Options;

public sealed class AppOptions
{
    public const string SectionName = "App";

    public string DashboardUrl { get; set; } = "http://localhost:3000";
    public string GatewayUrl { get; set; } = "http://localhost:5000";
    public int InviteExpiryDays { get; set; } = 7;
}
