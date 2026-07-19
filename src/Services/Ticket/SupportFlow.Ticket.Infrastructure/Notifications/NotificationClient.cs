using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SupportFlow.Shared.Contracts.Notifications;

namespace SupportFlow.Ticket.Infrastructure.Notifications;

public interface INotificationClient
{
    Task NotifyAsync(
        Guid tenantId,
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class NotificationClient : INotificationClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NotificationClient> _logger;

    public NotificationClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<NotificationClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task NotifyAsync(
        Guid tenantId,
        CreateNotificationRequest request,
        CancellationToken cancellationToken = default)
    {
        const int maxAttempts = 3;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "api/v1/internal/notifications")
                {
                    Content = JsonContent.Create(request),
                };

                httpRequest.Headers.TryAddWithoutValidation("X-Tenant-Id", tenantId.ToString());
                var serviceKey = _configuration["Internal:ServiceKey"];
                if (!string.IsNullOrWhiteSpace(serviceKey))
                {
                    httpRequest.Headers.TryAddWithoutValidation("X-Internal-Key", serviceKey);
                }

                using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    return;
                }

                _logger.LogWarning(
                    "Notification create failed with {StatusCode} on attempt {Attempt}",
                    (int)response.StatusCode,
                    attempt);
            }
            catch (Exception exception) when (attempt < maxAttempts)
            {
                _logger.LogWarning(exception, "Notification create attempt {Attempt} failed", attempt);
                await Task.Delay(TimeSpan.FromMilliseconds(150 * attempt), cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Notification create failed after {Attempts} attempts", maxAttempts);
                return;
            }
        }
    }
}
