using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SupportFlow.Identity.Infrastructure.Options;

namespace SupportFlow.Identity.Infrastructure.Messaging;

public sealed class MetaWhatsAppOtpSender : IWhatsAppOtpSender
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly WhatsAppOptions _options;
    private readonly ILogger<MetaWhatsAppOtpSender> _logger;
    private readonly ConsoleWhatsAppOtpSender _fallback;

    public MetaWhatsAppOtpSender(
        IHttpClientFactory httpClientFactory,
        IOptions<WhatsAppOptions> options,
        ILogger<MetaWhatsAppOtpSender> logger,
        ConsoleWhatsAppOtpSender fallback)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
        _fallback = fallback;
    }

    public async Task SendAsync(string phoneE164, string otp, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.AccessToken)
            || string.IsNullOrWhiteSpace(_options.PhoneNumberId))
        {
            _logger.LogWarning("Meta WhatsApp credentials missing; falling back to console OTP.");
            await _fallback.SendAsync(phoneE164, otp, cancellationToken);
            return;
        }

        var to = phoneE164.TrimStart('+');
        var url = $"https://graph.facebook.com/{_options.ApiVersion}/{_options.PhoneNumberId}/messages";
        var client = _httpClientFactory.CreateClient(nameof(MetaWhatsAppOtpSender));

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
        request.Content = JsonContent.Create(new
        {
            messaging_product = "whatsapp",
            to,
            type = "template",
            template = new
            {
                name = _options.TemplateName,
                language = new { code = _options.TemplateLanguage },
                components = new object[]
                {
                    new
                    {
                        type = "body",
                        parameters = new object[]
                        {
                            new { type = "text", text = otp }
                        }
                    }
                }
            }
        });

        try
        {
            var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Meta WhatsApp send failed ({Status}): {Body}. Falling back to console.",
                    (int)response.StatusCode,
                    body);
                await _fallback.SendAsync(phoneE164, otp, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Meta WhatsApp send threw; falling back to console.");
            await _fallback.SendAsync(phoneE164, otp, cancellationToken);
        }
    }
}
