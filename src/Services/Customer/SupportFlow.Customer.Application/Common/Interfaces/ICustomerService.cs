using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Application.Common.Interfaces;

public interface ICustomerService
{
    Task<CustomerDto> CreateOrGetAsync(
        Guid tenantId,
        Guid? createdBy,
        string? name,
        string? email,
        string? username,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CustomerDto>> ListAsync(
        Guid tenantId,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<CustomerDto?> GetByIdAsync(Guid tenantId, Guid customerId, CancellationToken cancellationToken);
}
