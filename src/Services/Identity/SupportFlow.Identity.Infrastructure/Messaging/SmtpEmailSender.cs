using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SupportFlow.Identity.Infrastructure.Options;

namespace SupportFlow.Identity.Infrastructure.Messaging;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string toEmail,
        string subject,
        string body,
        CancellationToken cancellationToken,
        bool isHtml = false)
    {
        if (string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            throw new InvalidOperationException("Email:SmtpHost is not configured.");
        }

        if (!string.IsNullOrWhiteSpace(_options.SmtpUserName)
            && string.IsNullOrWhiteSpace(_options.SmtpPassword))
        {
            throw new InvalidOperationException(
                "Email:SmtpPassword is missing. Set it with: dotnet user-secrets set \"Email:SmtpPassword\" \"YOUR_APP_PASSWORD\" --project src/Services/Identity/SupportFlow.Identity.Api");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromDisplayName),
            Subject = subject,
            Body = body,
            IsBodyHtml = isHtml
        };
        message.To.Add(toEmail);

        using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.SmtpEnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrWhiteSpace(_options.SmtpUserName))
        {
            client.Credentials = new NetworkCredential(_options.SmtpUserName, _options.SmtpPassword);
        }

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            _logger.LogInformation(
                "Email sent to {Email} via SMTP {Host}:{Port}",
                toEmail,
                _options.SmtpHost,
                _options.SmtpPort);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send email to {Email} via {Host}:{Port}",
                toEmail,
                _options.SmtpHost,
                _options.SmtpPort);
            throw;
        }
    }
}
