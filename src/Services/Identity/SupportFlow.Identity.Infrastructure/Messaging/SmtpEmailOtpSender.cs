using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SupportFlow.Identity.Infrastructure.Options;

namespace SupportFlow.Identity.Infrastructure.Messaging;

public sealed class SmtpEmailOtpSender : IEmailOtpSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailOtpSender> _logger;

    public SmtpEmailOtpSender(IOptions<EmailOptions> options, ILogger<SmtpEmailOtpSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string email,
        string otp,
        CancellationToken cancellationToken,
        string purpose = "recovery")
    {
        var isVerify = string.Equals(purpose, "verify", StringComparison.OrdinalIgnoreCase);
        var subject = isVerify
            ? "Verify your SupportFlow email"
            : "Your SupportFlow recovery code";
        var intro = isVerify
            ? "Use this code to verify your SupportFlow email address:"
            : "Your SupportFlow password recovery code is:";

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromDisplayName),
            Subject = subject,
            Body =
                $"""
                Hi,

                {intro}

                {otp}

                This code expires in a few minutes. If you did not request it, you can ignore this email.

                — SupportFlow
                """,
            IsBodyHtml = false
        };
        message.To.Add(email);

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
                "OTP email ({Purpose}) sent to {Email} via SMTP {Host}:{Port}",
                purpose,
                email,
                _options.SmtpHost,
                _options.SmtpPort);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send OTP email to {Email} via {Host}:{Port}",
                email,
                _options.SmtpHost,
                _options.SmtpPort);
            throw;
        }
    }
}
