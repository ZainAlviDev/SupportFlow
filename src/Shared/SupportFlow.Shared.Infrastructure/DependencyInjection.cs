using Microsoft.Extensions.DependencyInjection;
using SupportFlow.Shared.Kernel.Interfaces;
using SupportFlow.Shared.Kernel.Tenancy;

namespace SupportFlow.Shared.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddSharedTenancy(this IServiceCollection services)
    {
        services.AddScoped<ITenantContext, TenantContext>();
        return services;
    }
}
