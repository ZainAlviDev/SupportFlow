namespace SupportFlow.Identity.Infrastructure.Options;

public sealed class WhatsAppOptions
{
    public const string SectionName = "WhatsApp";

    public bool Enabled { get; set; }
    public string Provider { get; set; } = "Console";
    public string ApiVersion { get; set; } = "v21.0";
    public string PhoneNumberId { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string TemplateName { get; set; } = "password_reset_otp";
    public string TemplateLanguage { get; set; } = "en_US";
}
