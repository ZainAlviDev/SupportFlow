using MediatR;
using SupportFlow.Customer.Application.Common.Exceptions;
using SupportFlow.Customer.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Application.Customers.Queries.ListCustomers;

public sealed class ListCustomersQueryHandler : IRequestHandler<ListCustomersQuery, IReadOnlyList<CustomerDto>>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ICustomerService _customerService;

    public ListCustomersQueryHandler(ICurrentUserService currentUser, ICustomerService customerService)
    {
        _currentUser = currentUser;
        _customerService = customerService;
    }

    public Task<IReadOnlyList<CustomerDto>> Handle(ListCustomersQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _customerService.ListAsync(
            _currentUser.TenantId.Value,
            request.Search,
            request.Page,
            request.PageSize,
            cancellationToken);
    }
}
