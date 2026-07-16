using Microsoft.EntityFrameworkCore;
using SupportFlow.Customer.Application.Common.Interfaces;
using SupportFlow.Customer.Domain.Entities;
using SupportFlow.Customer.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Customers;
using CustomerEntity = SupportFlow.Customer.Domain.Entities.Customer;

namespace SupportFlow.Customer.Infrastructure.Customers;

public sealed class CustomerService : ICustomerService
{
    private readonly CustomerDbContext _dbContext;

    public CustomerService(CustomerDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CustomerDto> CreateOrGetAsync(
        Guid tenantId,
        Guid? createdBy,
        string? name,
        string? email,
        string? username,
        CancellationToken cancellationToken)
    {
        var normalizedName = Normalize(name);
        var normalizedEmail = Normalize(email)?.ToLowerInvariant();
        var normalizedUsername = Normalize(username);

        CustomerEntity? existing = null;

        if (normalizedEmail is not null)
        {
            existing = await _dbContext.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    c => c.TenantId == tenantId && !c.IsDeleted && c.Email == normalizedEmail,
                    cancellationToken);
        }

        if (existing is null && normalizedUsername is not null)
        {
            existing = await _dbContext.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    c => c.TenantId == tenantId && !c.IsDeleted && c.ExternalId == normalizedUsername,
                    cancellationToken);
        }

        if (existing is not null)
        {
            var changed = false;
            if (normalizedName is not null && existing.Name != normalizedName)
            {
                existing.Name = normalizedName;
                changed = true;
            }

            if (normalizedEmail is not null && existing.Email != normalizedEmail)
            {
                existing.Email = normalizedEmail;
                changed = true;
            }

            if (normalizedUsername is not null && existing.ExternalId != normalizedUsername)
            {
                existing.ExternalId = normalizedUsername;
                changed = true;
            }

            if (changed)
            {
                existing.UpdatedAt = DateTime.UtcNow;
                existing.UpdatedBy = createdBy;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return Map(existing);
        }

        var now = DateTime.UtcNow;
        var customer = new CustomerEntity(tenantId, now, normalizedEmail, normalizedName, normalizedUsername)
        {
            CreatedBy = createdBy,
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(customer);
    }

    public async Task<IReadOnlyList<CustomerDto>> ListAsync(
        Guid tenantId,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Customers
            .IgnoreQueryFilters()
            .Where(c => c.TenantId == tenantId && !c.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                (c.Name != null && c.Name.Contains(term))
                || (c.Email != null && c.Email.Contains(term))
                || (c.ExternalId != null && c.ExternalId.Contains(term)));
        }

        var items = await query
            .OrderByDescending(c => c.LastSeenAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return items.Select(Map).ToList();
    }

    public async Task<CustomerDto?> GetByIdAsync(Guid tenantId, Guid customerId, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                c => c.TenantId == tenantId && c.Id == customerId && !c.IsDeleted,
                cancellationToken);

        return customer is null ? null : Map(customer);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static CustomerDto Map(CustomerEntity customer) =>
        new(
            customer.Id,
            customer.TenantId,
            customer.Name,
            customer.Email,
            customer.ExternalId,
            customer.FirstSeenAt,
            customer.LastSeenAt,
            customer.CreatedAt,
            customer.UpdatedAt);
}
