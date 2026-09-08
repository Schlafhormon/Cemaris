using Cemaris.Domain.Parties;

namespace Cemaris.Domain.UsageRights;

public enum UsageRightStatus { Open, Ended, Voided }
public enum UsageRightTerminationKind { Returned = 1, Other = 2 }

public static class UsageRightLifecycleRules
{
    public static void RequireOpen(UsageRightStatus status)
    {
        if (status != UsageRightStatus.Open) throw new UsageRightStateException();
    }

    public static void ValidateTermination(DateOnly date, DateOnly start, DateOnly holderStart, DateOnly today,
        UsageRightTerminationKind kind, string? reason, string? sourceReference, bool confirmed)
    {
        if (!Enum.IsDefined(kind)) throw new UsageRightValidationException("kind", "Die Beendigungsart ist ungültig.");
        RequireConfirmation(confirmed);
        PartyRules.Required(reason, 1000, "reason");
        PartyRules.Required(sourceReference, 250, "sourceReference");
        if (date > today || date <= start || date <= holderStart)
            throw new UsageRightValidationException("terminationDate", "Beendet ab muss nach Beginn des Rechts und des letzten Inhaberzeitraums und spätestens heute (UTC) liegen.");
    }

    public static void RequireConfirmation(bool confirmed)
    {
        if (!confirmed) throw new UsageRightValidationException("manualReviewConfirmed", "Die manuelle Prüfung muss ausdrücklich bestätigt werden.");
    }

    public static void ValidateSuccessor(DateOnly start, DateOnly terminationDate)
    {
        if (start < terminationDate) throw new UsageRightValidationException("startDate", "Der Beginn darf nicht vor der tatsächlichen Beendigung des Vorgängers liegen.");
    }
}

public sealed class UsageRightStateException() : Exception("Der Vorgang ist für diesen Rechtszustand oder diese Rechtefolge nicht zulässig.");
