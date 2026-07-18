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

    Task<CustomerDto> UpdateAsync(
        Guid tenantId,
        Guid customerId,
        Guid? updatedBy,
        string? name,
        string? email,
        string? username,
        IReadOnlyList<string>? tags,
        IReadOnlyDictionary<string, string>? metadata,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CustomerNoteDto>> ListNotesAsync(
        Guid tenantId,
        Guid customerId,
        CancellationToken cancellationToken);

    Task<CustomerNoteDto> AddNoteAsync(
        Guid tenantId,
        Guid customerId,
        Guid authorId,
        string body,
        CancellationToken cancellationToken);
}
