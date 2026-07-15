using Microsoft.Extensions.Logging;

namespace SupportFlow.Identity.Infrastructure.Messaging;

public sealed class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) => _logger = logger;

    public Task SendAsync(
        string toEmail,
        string subject,
        string body,
        CancellationToken cancellationToken,
        bool isHtml = false)
    {
        _logger.LogInformation(
            "EMAIL [{Subject}] to {Email} (html={IsHtml}):{NewLine}{Body}",
            subject,
            toEmail,
            isHtml,
            Environment.NewLine,
            body);
        return Task.CompletedTask;
    }
}
