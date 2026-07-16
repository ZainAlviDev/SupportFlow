using MediatR;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Application.Customers.Commands.CreateCustomer;

public sealed record CreateCustomerCommand(
    string? Name,
    string? Email,
    string? Username) : IRequest<CustomerDto>;
