namespace Cemaris.Domain.Cases;

public enum BurialProcessStatus
{
    Draft = 1,
    Planned = 2,
    Confirmed = 3,
    Performed = 4,
    Completed = 5,
}

public sealed record BurialProcessRecord
{
    private BurialProcessRecord(
        Guid id,
        Guid deceasedPersonId,
        Guid graveSiteId,
        BurialProcessStatus status,
        DateOnly? planningDate,
        DateOnly? actualBurialDate)
    {
        Id = id;
        DeceasedPersonId = deceasedPersonId;
        GraveSiteId = graveSiteId;
        Status = status;
        PlanningDate = planningDate;
        ActualBurialDate = actualBurialDate;
    }

    public Guid Id { get; }

    public Guid DeceasedPersonId { get; }

    public Guid GraveSiteId { get; }

    public BurialProcessStatus Status { get; }

    public DateOnly? PlanningDate { get; }

    public DateOnly? ActualBurialDate { get; }

    public static BurialProcessRecord Create(
        Guid id,
        Guid deceasedPersonId,
        Guid graveSiteId,
        BurialProcessStatus status,
        DateOnly? planningDate,
        DateOnly? actualBurialDate)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Die Beisetzungs-ID darf nicht leer sein.", nameof(id));
        }

        if (deceasedPersonId == Guid.Empty)
        {
            throw CaseText.Error("deceasedPersonId", "Eine verstorbene Person ist erforderlich.");
        }

        if (graveSiteId == Guid.Empty)
        {
            throw CaseText.Error("graveSiteId", "Eine kanonische Grabstelle ist erforderlich.");
        }

        if (!Enum.IsDefined(status))
        {
            throw CaseText.Error("status", "Der Beisetzungsstatus ist ungültig.");
        }

        return new BurialProcessRecord(
            id,
            deceasedPersonId,
            graveSiteId,
            status,
            planningDate,
            actualBurialDate);
    }
}

public static class BurialProcessRules
{
    private static readonly HashSet<(BurialProcessStatus From, BurialProcessStatus To)>
        AllowedTransitions = new()
        {
            (BurialProcessStatus.Draft, BurialProcessStatus.Planned),
            (BurialProcessStatus.Planned, BurialProcessStatus.Draft),
            (BurialProcessStatus.Planned, BurialProcessStatus.Confirmed),
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Planned),
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Performed),
            (BurialProcessStatus.Performed, BurialProcessStatus.Completed),
            (BurialProcessStatus.Completed, BurialProcessStatus.Performed),
        };

    public static bool IsTransitionAllowed(BurialProcessStatus current, BurialProcessStatus target) =>
        AllowedTransitions.Contains((current, target));

    public static void EnsureTransitionAllowed(
        BurialProcessStatus current,
        BurialProcessStatus target)
    {
        if (!IsTransitionAllowed(current, target))
        {
            throw new BurialProcessValidationException(
                "status",
                $"Der Übergang von {current} nach {target} ist nicht zulässig.");
        }
    }

    public static void Validate(
        BurialProcessRecord burial,
        DateOnly? birthDate,
        DateOnly? deathDate,
        DateOnly today)
    {
        ArgumentNullException.ThrowIfNull(burial);

        if (burial.Status is (BurialProcessStatus.Planned
                or BurialProcessStatus.Confirmed
                or BurialProcessStatus.Performed
                or BurialProcessStatus.Completed)
            && burial.PlanningDate is null)
        {
            throw new BurialProcessValidationException(
                "planningDate",
                "Ab dem Status Geplant ist ein Planungstag erforderlich.");
        }

        if (burial.Status is (BurialProcessStatus.Performed or BurialProcessStatus.Completed)
            && burial.ActualBurialDate is null)
        {
            throw new BurialProcessValidationException(
                "actualBurialDate",
                "Ab dem Status Durchgeführt ist der tatsächliche Beisetzungstag erforderlich.");
        }

        ValidateDates(birthDate, deathDate, burial.ActualBurialDate, today);
    }

    public static void ValidatePersonDates(DateOnly? birthDate, DateOnly? deathDate)
    {
        if (birthDate.HasValue && deathDate.HasValue && birthDate > deathDate)
        {
            throw new BurialProcessValidationException(
                "deathDate",
                "Das Sterbedatum darf nicht vor dem Geburtsdatum liegen.");
        }
    }

    public static void EnsureEditable(BurialProcessStatus status)
    {
        if (status is not (BurialProcessStatus.Draft
            or BurialProcessStatus.Planned
            or BurialProcessStatus.Performed))
        {
            throw new BurialProcessValidationException(
                "status",
                "Diese Beisetzung muss vor einer Korrektur in einen bearbeitbaren Zustand zurückgeführt werden.");
        }
    }

    private static void ValidateDates(
        DateOnly? birthDate,
        DateOnly? deathDate,
        DateOnly? actualBurialDate,
        DateOnly today)
    {
        ValidatePersonDates(birthDate, deathDate);

        if (actualBurialDate.HasValue && actualBurialDate > today)
        {
            throw new BurialProcessValidationException(
                "actualBurialDate",
                "Der tatsächliche Beisetzungstag darf nicht in der Zukunft liegen.");
        }

        if (deathDate.HasValue && actualBurialDate.HasValue && deathDate > actualBurialDate)
        {
            throw new BurialProcessValidationException(
                "actualBurialDate",
                "Der tatsächliche Beisetzungstag darf nicht vor dem Sterbedatum liegen.");
        }

        if (birthDate.HasValue && actualBurialDate.HasValue && birthDate > actualBurialDate)
        {
            throw new BurialProcessValidationException(
                "actualBurialDate",
                "Der tatsächliche Beisetzungstag darf nicht vor dem Geburtsdatum liegen.");
        }
    }
}

public sealed class BurialProcessValidationException(string field, string message)
    : Exception(message)
{
    public string Field { get; } = field;
}
