using MediatR;
using SupportFlow.Shared.Contracts.Customers;

namespace SupportFlow.Customer.Application.Customers.Queries.ListCustomers;

public sealed record ListCustomersQuery(string? Search, int Page = 1, int PageSize = 50)
    : IRequest<IReadOnlyList<CustomerDto>>;
