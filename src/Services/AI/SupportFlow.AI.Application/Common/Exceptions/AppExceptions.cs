namespace SupportFlow.AI.Application.Common.Exceptions;

public sealed class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }
}

public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}

public sealed class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}

public sealed class UpstreamServiceException : Exception
{
    public UpstreamServiceException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
