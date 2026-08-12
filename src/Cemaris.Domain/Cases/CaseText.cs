namespace Cemaris.Domain.Cases;

internal static class CaseText
{
    internal static string Required(string? value, int maximumLength, string fieldName)
    {
        var normalized = Optional(value, maximumLength, fieldName);
        if (normalized is null)
        {
            throw Error(fieldName, "Dieses Feld ist erforderlich.");
        }

        return normalized;
    }

    internal static string? Optional(string? value, int maximumLength, string fieldName)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (normalized?.Length > maximumLength)
        {
            throw Error(
                fieldName,
                $"Dieses Feld darf höchstens {maximumLength} Zeichen enthalten.");
        }

        return normalized;
    }

    internal static CaseValidationException Error(string fieldName, string message) =>
        new(new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [fieldName] = [message],
        });
}
