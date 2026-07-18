using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SupportFlow.AI.Application.Common.Interfaces;
using SupportFlow.AI.Infrastructure.AI;
using SupportFlow.AI.Infrastructure.Auth;
using SupportFlow.AI.Infrastructure.Gateway;
using SupportFlow.Shared.Infrastructure;

namespace SupportFlow.AI.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSharedTenancy();

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
            });

        services.AddAuthorization();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.Configure<GatewayOptions>(configuration.GetSection(GatewayOptions.SectionName));
        services.Configure<AzureOpenAiOptions>(configuration.GetSection(AzureOpenAiOptions.SectionName));

        var gatewayBaseUrl = configuration.GetSection(GatewayOptions.SectionName).Get<GatewayOptions>()?.BaseUrl
            ?? "http://localhost:5000";
        var gatewayBaseAddress = new Uri(gatewayBaseUrl.TrimEnd('/') + "/");

        services.AddTransient<BearerTokenForwardingHandler>();
        services.AddHttpClient<ConversationGatewayClient>(client => client.BaseAddress = gatewayBaseAddress)
            .AddHttpMessageHandler<BearerTokenForwardingHandler>();
        services.AddHttpClient<KnowledgeGatewayClient>(client => client.BaseAddress = gatewayBaseAddress)
            .AddHttpMessageHandler<BearerTokenForwardingHandler>();
        services.AddHttpClient<ISuggestReplyService, SuggestReplyService>();

        return services;
    }
}
