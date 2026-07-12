using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SupportFlow.Identity.Application.Common.Interfaces;
using SupportFlow.Identity.Domain.Entities;
using SupportFlow.Identity.Infrastructure.Auth;
using SupportFlow.Identity.Infrastructure.Identity;
using SupportFlow.Identity.Infrastructure.Persistence;
using SupportFlow.Identity.Infrastructure.Seeding;
using SupportFlow.Shared.Infrastructure;

namespace SupportFlow.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["SUPPORTFLOW:EfToolsConnectionString"]
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        services.AddSharedTenancy();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString));

        services
            .AddIdentityCore<User>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredLength = 8;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ApplicationDbContext>();

        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.Configure<JwtOptions>(jwtSection);
        services.AddOptions<JwtOptions>()
            .Bind(jwtSection)
            .Validate(options => options.Secret.Length >= 32, "Jwt:Secret must be at least 32 characters.")
            .Validate(options => options.AccessTokenExpiryMinutes > 0, "Jwt:AccessTokenExpiryMinutes must be greater than 0.")
            .ValidateOnStart();

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

        services.AddScoped<JwtTokenService>();
        services.AddScoped<ILoginService, LoginService>();
        services.AddScoped<IRegisterService, RegisterService>();
        services.AddScoped<IAuthTokenService, AuthTokenService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddHostedService<IdentityDataSeeder>();

        return services;
    }
}
