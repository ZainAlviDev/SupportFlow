using System.Text;
using Ganss.Xss;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SupportFlow.Knowledge.Application.Common.Interfaces;
using SupportFlow.Knowledge.Infrastructure.AI;
using SupportFlow.Knowledge.Infrastructure.Auth;
using SupportFlow.Knowledge.Infrastructure.Jobs;
using SupportFlow.Knowledge.Infrastructure.Knowledge;
using SupportFlow.Knowledge.Infrastructure.Persistence;
using SupportFlow.Shared.Infrastructure;

namespace SupportFlow.Knowledge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        services.AddSharedTenancy();
        services.AddDbContext<KnowledgeDbContext>(options =>
            options.UseSqlServer(connectionString, sqlServer => sqlServer.UseVectorSearch()));
        services.AddHangfire(configuration => configuration
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(connectionString));
        services.AddHangfireServer(options => options.WorkerCount = 2);

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
        services.AddScoped<IKnowledgeArticleService, KnowledgeArticleService>();
        services.AddScoped<IKnowledgeSearchService, KnowledgeSearchService>();
        services.AddScoped<IArticleEmbeddingDispatcher, HangfireArticleEmbeddingDispatcher>();
        services.AddScoped<ArticleEmbeddingJob>();
        services.AddSingleton(new HtmlSanitizer());
        services.Configure<AzureOpenAiOptions>(
            configuration.GetSection(AzureOpenAiOptions.SectionName));
        services.AddHttpClient<IEmbeddingService, AzureOpenAiEmbeddingService>();
        services.AddHostedService<KnowledgeDbMigrator>();

        return services;
    }
}
