using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using SupportFlow.Conversation.Application.Common.Events;
using SupportFlow.Conversation.Application.Common.Interfaces;
using SupportFlow.Conversation.Infrastructure.Auth;
using SupportFlow.Conversation.Infrastructure.Conversations;
using SupportFlow.Conversation.Infrastructure.Customers;
using SupportFlow.Conversation.Infrastructure.Notifications;
using SupportFlow.Conversation.Infrastructure.Persistence;
using SupportFlow.Conversation.Infrastructure.Seeding;
using SupportFlow.Conversation.Infrastructure.SignalR;
using SupportFlow.Conversation.Infrastructure.Widget;
using SupportFlow.Shared.Infrastructure;

namespace SupportFlow.Conversation.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        var redisConnectionString = configuration.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("Connection string 'Redis' was not found.");

        services.AddSharedTenancy();

        services.AddDbContext<ConversationDbContext>(options =>
            options.UseSqlServer(connectionString));

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(jwtSection);

        var jwtOptions = jwtSection.Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration section is missing.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken)
                            && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            })
            .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                ApiKeyAuthDefaults.Scheme,
                _ => { });

        services.AddAuthorization();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IConversationService, ConversationService>();
        services.AddScoped<IWidgetService, WidgetService>();
        services.AddScoped<INotificationHandler<MessageSentNotification>, MessageSentNotificationHandler>();
        services.AddScoped<INotificationHandler<ConversationUpdatedNotification>, ConversationUpdatedNotificationHandler>();

        var workspaceBaseUrl = configuration["Services:Workspace"] ?? "http://localhost:5020";
        var customerBaseUrl = configuration["Services:Customer"] ?? "http://localhost:5050";
        var notificationBaseUrl = configuration["Services:Notification"] ?? "http://localhost:5080";

        services.AddHttpClient<IApiKeyValidator, WorkspaceApiKeyValidator>(client =>
        {
            client.BaseAddress = new Uri(workspaceBaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<ICustomerClient, CustomerClient>(client =>
        {
            client.BaseAddress = new Uri(customerBaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<INotificationClient, NotificationClient>(client =>
        {
            client.BaseAddress = new Uri(notificationBaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        var environment = configuration["ASPNETCORE_ENVIRONMENT"]
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environments.Production;
        var isDevelopment = string.Equals(environment, Environments.Development, StringComparison.OrdinalIgnoreCase);

        if (TryConnectRedis(redisConnectionString, out var multiplexer))
        {
            services.AddSingleton<IConnectionMultiplexer>(multiplexer!);
            services.AddSingleton<IAgentPresenceService, RedisAgentPresenceService>();
            services
                .AddSignalR()
                .AddStackExchangeRedis(redisConnectionString, options =>
                {
                    options.Configuration.ChannelPrefix = RedisChannel.Literal("SupportFlow.SignalR");
                });
        }
        else if (isDevelopment)
        {
            // Local VS debugging without Docker: in-process SignalR (single instance only).
            services.AddSingleton<IAgentPresenceService, InMemoryAgentPresenceService>();
            services.AddSignalR();
        }
        else
        {
            throw new InvalidOperationException(
                $"Unable to connect to Redis at '{redisConnectionString}'. Conversation SignalR requires Redis outside Development.");
        }

        services.AddHostedService<ConversationDbMigrator>();

        return services;
    }

    private static bool TryConnectRedis(string connectionString, out IConnectionMultiplexer? multiplexer)
    {
        multiplexer = null;
        try
        {
            var options = ConfigurationOptions.Parse(connectionString);
            options.AbortOnConnectFail = true;
            options.ConnectTimeout = 1500;
            options.SyncTimeout = 1500;

            multiplexer = ConnectionMultiplexer.Connect(options);
            _ = multiplexer.GetDatabase().Ping();
            return true;
        }
        catch (Exception)
        {
            try
            {
                multiplexer?.Dispose();
            }
            catch
            {
                // Ignore dispose failures during fallback.
            }

            multiplexer = null;
            return false;
        }
    }
}
