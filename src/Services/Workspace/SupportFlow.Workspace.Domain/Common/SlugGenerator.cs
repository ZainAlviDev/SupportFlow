using System.Text.RegularExpressions;

namespace SupportFlow.Workspace.Domain.Common;

public static partial class SlugGenerator
{
    public static string FromName(string name)
    {
        var normalized = name.Trim().ToLowerInvariant();
        normalized = InvalidSlugChars().Replace(normalized, string.Empty);
        normalized = Whitespace().Replace(normalized, "-").Trim('-');
        return string.IsNullOrWhiteSpace(normalized) ? "workspace" : normalized;
    }

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex InvalidSlugChars();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
