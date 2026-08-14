using Cemaris.Domain.Parties;

namespace Cemaris.Domain.UsageRights;

public static class UsageRightRules
{
    public static void ValidateFacts(Guid graveSiteId, DateOnly startDate, DateOnly endDate, string? sourceReference)
    {
        if (graveSiteId == Guid.Empty) throw new UsageRightValidationException("graveSiteId", "Eine kanonische Grabstelle ist erforderlich.");
        if (endDate <= startDate) throw new UsageRightValidationException("endDate", "Das Ende muss nach dem Beginn liegen.");
        PartyRules.Required(sourceReference, 250, "sourceReference");
    }

    public static void ValidateTransfer(DateOnly validFromInclusive, DateOnly currentHolderFrom, DateOnly endDate)
    {
        if (validFromInclusive <= currentHolderFrom || validFromInclusive >= endDate)
            throw new UsageRightValidationException("validFromInclusive", "Der Inhaberwechsel muss nach Beginn des aktuellen Inhaberzeitraums und vor dem manuellen Ende liegen.");
    }

    public static void ValidateExtension(DateOnly currentEndDate, DateOnly newEndDate)
    {
        if (newEndDate <= currentEndDate) throw new UsageRightValidationException("newEndDate", "Das neue Ende muss strikt nach dem bisherigen Ende liegen.");
    }
}

public sealed class UsageRightValidationException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}
