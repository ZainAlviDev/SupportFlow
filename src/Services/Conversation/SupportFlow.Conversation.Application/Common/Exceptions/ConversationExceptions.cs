namespace SupportFlow.Conversation.Application.Common.Exceptions;

public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Authentication is required.")
        : base(message)
    {
    }
}

public sealed class ConflictException : Exception
{
    public ConflictException(string message)
        : base(message)
    {
    }
}

public sealed class NotFoundException : Exception
{
    public NotFoundException(string message)
        : base(message)
    {
    }
}
