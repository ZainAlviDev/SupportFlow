using MediatR;
using SupportFlow.Customer.Application.Common.Exceptions;
using SupportFlow.Customer.Application.Common.Interfaces;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Application.Customers.Commands.CreateCustomer;

public sealed class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, CustomerDto>
{
    private readonly ICurrentUserService _currentUser;
    private readonly ICustomerService _customerService;

    public CreateCustomerCommandHandler(ICurrentUserService currentUser, ICustomerService customerService)
    {
        _currentUser = currentUser;
        _customerService = customerService;
    }

    public Task<CustomerDto> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        if (_currentUser.TenantId is null)
        {
            throw new UnauthorizedException("Tenant context is required.");
        }

        return _customerService.CreateOrGetAsync(
            _currentUser.TenantId.Value,
            _currentUser.UserId,
            request.Name,
            request.Email,
            request.Username,
            cancellationToken);
    }
}
