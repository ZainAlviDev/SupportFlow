namespace SupportFlow.Identity.Infrastructure.Messaging;

public interface IEmailSender
{
    Task SendAsync(
        string toEmail,
        string subject,
        string body,
        CancellationToken cancellationToken,
        bool isHtml = false);
}
