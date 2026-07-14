namespace SupportFlow.Identity.Infrastructure.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Console | Smtp</summary>
    public string Provider { get; set; } = "Console";

    public string SmtpHost { get; set; } = "localhost";
    public int SmtpPort { get; set; } = 1025;
    public bool SmtpEnableSsl { get; set; }
    public string? SmtpUserName { get; set; }
    public string? SmtpPassword { get; set; }
    public string FromAddress { get; set; } = "noreply@supportflow.app";
    public string FromDisplayName { get; set; } = "SupportFlow";
}
