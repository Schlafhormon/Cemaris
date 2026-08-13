using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;

namespace Cemaris.Application.Cases;

public enum CaseChangeOperation
{
    CaseCreated = 1,
    GraveChanged = 2,
    DeceasedPersonAdded = 3,
    DeceasedPersonChanged = 4,
    BurialAdded = 5,
    BurialChanged = 6,
    BurialDraftCreated = 7,
    BurialFactsChanged = 8,
    BurialPlanned = 9,
    BurialPlanningWithdrawn = 10,
    BurialConfirmed = 11,
    BurialConfirmationWithdrawn = 12,
    BurialPerformed = 13,
    BurialCompleted = 14,
    BurialReopened = 15,
    LegacyBurialAdopted = 16,
}

public sealed record CaseChange
{
    public CaseChange(
        Guid id,
        Guid caseId,
        CaseVersion resultingVersion,
        DateTimeOffset occurredAtUtc,
        ActorIdentity actor,
        CaseChangeOperation operation,
        Guid? targetEntityId)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Die Änderungs-ID darf nicht leer sein.", nameof(id));
        }

        if (caseId == Guid.Empty)
        {
            throw new ArgumentException("Die Fall-ID darf nicht leer sein.", nameof(caseId));
        }

        if (occurredAtUtc.Offset != TimeSpan.Zero)
        {
            throw new ArgumentException("Der Änderungszeitpunkt muss in UTC angegeben sein.", nameof(occurredAtUtc));
        }

        if (!Enum.IsDefined(operation))
        {
            throw new ArgumentOutOfRangeException(nameof(operation), operation, "Unbekannte Änderungsoperation.");
        }

        if (targetEntityId == Guid.Empty)
        {
            throw new ArgumentException("Die optionale Zielobjekt-ID darf nicht leer sein.", nameof(targetEntityId));
        }

        Id = id;
        CaseId = caseId;
        ResultingVersion = resultingVersion;
        OccurredAtUtc = occurredAtUtc;
        Actor = actor ?? throw new ArgumentNullException(nameof(actor));
        Operation = operation;
        TargetEntityId = targetEntityId;
    }

    public Guid Id { get; }

    public Guid CaseId { get; }

    public CaseVersion ResultingVersion { get; }

    public DateTimeOffset OccurredAtUtc { get; }

    public ActorIdentity Actor { get; }

    public CaseChangeOperation Operation { get; }

    public Guid? TargetEntityId { get; }
}
