using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Kernel.Interfaces;

namespace SupportFlow.Shared.Infrastructure.Persistence;

public static class ModelBuilderTenantExtensions
{
    /// <summary>
    /// Applies tenant isolation and soft-delete filters to all mapped entities that implement the marker interfaces.
    /// Cross-tenant auth flows (login/refresh) must use <c>IgnoreQueryFilters()</c>.
    /// </summary>
    public static void ApplyTenantAndSoftDeleteFilters(this ModelBuilder modelBuilder, ITenantContext tenantContext)
    {
        ArgumentNullException.ThrowIfNull(tenantContext);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            if (clrType is null || entityType.IsOwned())
            {
                continue;
            }

            var isTenant = typeof(ITenantEntity).IsAssignableFrom(clrType);
            var isAuditable = typeof(IAuditableEntity).IsAssignableFrom(clrType);

            if (!isTenant && !isAuditable)
            {
                continue;
            }

            var parameter = Expression.Parameter(clrType, "e");
            Expression? filterBody = null;

            if (isTenant)
            {
                var tenantIdProperty = Expression.Property(parameter, nameof(ITenantEntity.TenantId));
                var contextTenantId = Expression.Property(
                    Expression.Constant(tenantContext),
                    nameof(ITenantContext.TenantId));
                filterBody = Expression.Equal(tenantIdProperty, contextTenantId);
            }

            if (isAuditable)
            {
                var isDeletedProperty = Expression.Property(parameter, nameof(IAuditableEntity.IsDeleted));
                var notDeleted = Expression.Equal(isDeletedProperty, Expression.Constant(false));
                filterBody = filterBody is null ? notDeleted : Expression.AndAlso(filterBody, notDeleted);
            }

            var lambda = Expression.Lambda(filterBody!, parameter);
            modelBuilder.Entity(clrType).HasQueryFilter(lambda);
        }
    }
}
