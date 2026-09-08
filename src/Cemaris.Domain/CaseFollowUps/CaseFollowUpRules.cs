namespace Cemaris.Domain.CaseFollowUps;

public enum CaseFollowUpStatus { Open = 1, Completed = 2, Cancelled = 3 }
public enum CaseFollowUpOperation { Created = 1, Changed = 2, Completed = 3, Cancelled = 4, Reopened = 5 }

public sealed record CaseFollowUpFacts(string Title, string? Description, DateOnly DueDate)
{
    public static CaseFollowUpFacts Create(string? title, string? description, DateOnly? dueDate)
    {
        var cleanTitle = CaseFollowUpRules.Required(title, 200, "title");
        var cleanDescription = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        if (cleanDescription?.Length > 2000)
            throw new CaseFollowUpValidationException("description", "Die Beschreibung darf höchstens 2000 Zeichen enthalten.");
        if (dueDate is null)
            throw new CaseFollowUpValidationException("dueDate", "Ein gültiger Kalendertag ist erforderlich.");
        return new(cleanTitle, cleanDescription, dueDate.Value);
    }
}

public static class CaseFollowUpRules
{
    public static string Reason(string? value) => Required(value, 1000, "reason");

    public static string Required(string? value, int maximum, string field)
    {
        var clean = value?.Trim();
        if (string.IsNullOrEmpty(clean))
            throw new CaseFollowUpValidationException(field, "Der Wert ist erforderlich.");
        if (clean.Length > maximum)
            throw new CaseFollowUpValidationException(field, $"Der Wert darf höchstens {maximum} Zeichen enthalten.");
        return clean;
    }

    public static CaseFollowUpStatus? Target(CaseFollowUpStatus status, CaseFollowUpOperation operation) => (status, operation) switch
    {
        (CaseFollowUpStatus.Open, CaseFollowUpOperation.Changed) => CaseFollowUpStatus.Open,
        (CaseFollowUpStatus.Open, CaseFollowUpOperation.Completed) => CaseFollowUpStatus.Completed,
        (CaseFollowUpStatus.Open, CaseFollowUpOperation.Cancelled) => CaseFollowUpStatus.Cancelled,
        (CaseFollowUpStatus.Completed or CaseFollowUpStatus.Cancelled, CaseFollowUpOperation.Reopened) => CaseFollowUpStatus.Open,
        _ => null,
    };
}

public sealed class CaseFollowUpValidationException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}
