using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;

namespace Cemaris.Application.PersonUsageRights;

public sealed partial class PersonUsageRightService
{
    public Task<UsageRightPage> ReadUsageRightsAsync(Guid graveSiteId, int page, int pageSize, CancellationToken token)
    {
        if (page < 1 || pageSize is < 1 or > 50 || ((long)page - 1) * pageSize > int.MaxValue)
            throw new UsageRightValidationException("page", "Seite oder Seitengröße ist ungültig (1–50 Einträge).");
        return store.ReadUsageRightsAsync(graveSiteId, page, pageSize, token);
    }

    public Task<IReadOnlyList<UsageRightListItem>?> ReadUsageRightSequenceAsync(Guid id, CancellationToken token) => store.ReadUsageRightSequenceAsync(id, token);

    public Task<PersonUsageRightMutationResult> TerminateUsageRightAsync(Guid id, long version, TerminateUsageRightCommand command, CancellationToken token)
    {
        UsageRightLifecycleRules.ValidateTermination(command.TerminationDate, DateOnly.MinValue, DateOnly.MinValue, Today,
            command.Kind, command.Reason, command.SourceReference, command.ManualReviewConfirmed);
        return store.ChangeLifecycleAsync(Change(id, version, "Terminated", command.Reason!) with
        { Termination = command with { Reason = command.Reason!.Trim(), SourceReference = command.SourceReference!.Trim() } }, token);
    }

    public Task<PersonUsageRightMutationResult> ReverseUsageRightTerminationAsync(Guid id, long version, ReverseUsageRightTerminationCommand command, CancellationToken token)
        => store.ChangeLifecycleAsync(Change(id, version, "TerminationReversed", command.Reason), token);

    public Task<PersonUsageRightMutationResult> CreateUsageRightSuccessorAsync(Guid id, long version, CreateUsageRightSuccessorCommand command, CancellationToken token)
    {
        UsageRightLifecycleRules.RequireConfirmation(command.ManualReviewConfirmed);
        UsageRightRules.ValidateFacts(id, command.StartDate, command.EndDate, command.SourceReference);
        return store.ChangeLifecycleAsync(Change(id, version, "SuccessorCreated", command.Reason) with
        { Successor = command with { SourceReference = command.SourceReference!.Trim(), Reason = command.Reason!.Trim() } }, token);
    }

    public Task<PersonUsageRightMutationResult> CorrectUsageRightSequenceAsync(Guid id, long version, CorrectUsageRightSequenceCommand command, CancellationToken token)
    {
        if (!command.ConfirmSequenceCorrection) throw new UsageRightValidationException("confirmSequenceCorrection", "Die gemeinsame Korrektur aller angezeigten Rechte muss bestätigt werden.");
        if (command.Members is null || command.Members.Count == 0 || command.Members.Any(x => x is null || x.Id == Guid.Empty || x.Version < 1)
            || command.Members.Select(x => x.Id).Distinct().Count() != command.Members.Count)
            throw new UsageRightValidationException("members", "Alle betroffenen Rechte müssen genau einmal mit gültiger Version bestätigt werden.");
        return store.ChangeLifecycleAsync(Change(id, version, "SequenceCorrected", command.Reason) with { Correction = command }, token);
    }

    private UsageRightLifecycleChange Change(Guid id, long version, string operation, string? reason) => new(id, version, operation,
        PartyRules.Required(reason, 1000, "reason"), Audit("UsageRight", id, version, operation) with { OperationId = Guid.NewGuid() });
}

// Gemeinsame, nebenwirkungsfreie Vorbereitung. Provider veröffentlichen erst nach sämtlichen Prüfungen.
public static class UsageRightLifecycleChanges
{
    public static IReadOnlyList<UsageRightView> Sequence(Guid id, IReadOnlyList<UsageRightView> rights)
    {
        var first = rights.Single(x => x.Id == id);
        var result = new List<UsageRightView> { first };
        while (true)
        {
            var children = rights.Where(x => x.PredecessorId == result[^1].Id && x.Status != UsageRightStatus.Voided).ToArray();
            if (children.Length == 0) return result;
            if (children.Length != 1 || children[0].GraveSiteId != first.GraveSiteId || result.Any(x => x.Id == children[0].Id))
                throw new UsageRightStateException();
            result.Add(children[0]);
        }
    }

    public static UsageRightListItem ListItem(UsageRightView x) => new(x.Id, x.GraveSiteId, x.StartDate, x.EndDate, x.Status, x.PredecessorId, x.Version);

    public static IReadOnlyList<UsageRightView> Prepare(UsageRightLifecycleChange change, IReadOnlyList<UsageRightView> rights, UsageRightView? successor)
    {
        var current = rights.Single(x => x.Id == change.Id);
        var sequence = Sequence(current.Id, rights);
        var next = current with { Version = checked(current.Version + 1), OperationId = change.Audit.OperationId };
        switch (change.Operation)
        {
            case "Terminated":
                UsageRightLifecycleRules.RequireOpen(current.Status);
                var input = change.Termination!;
                var holder = current.HolderPeriods.Single(x => x.ValidUntilExclusive is null);
                UsageRightLifecycleRules.ValidateTermination(input.TerminationDate, current.StartDate, holder.ValidFromInclusive,
                    DateOnly.FromDateTime(change.Audit.OccurredAtUtc.UtcDateTime), input.Kind, input.Reason, input.SourceReference, input.ManualReviewConfirmed);
                next = next with
                {
                    Status = UsageRightStatus.Ended,
                    Termination = new(input.TerminationDate, input.Kind, input.Reason!, input.SourceReference!, true),
                    HolderPeriods = current.HolderPeriods.Select(x => x.Id == holder.Id ? x with { ValidUntilExclusive = input.TerminationDate } : x).ToArray()
                };
                break;
            case "SuccessorCreated":
                RequireEnded(current);
                if (sequence.Count != 1 || rights.Any(x => x.GraveSiteId == current.GraveSiteId && x.Status == UsageRightStatus.Open)) throw new UsageRightStateException();
                UsageRightLifecycleRules.ValidateSuccessor(successor!.StartDate, current.Termination!.TerminationDate);
                return [next, successor];
            case "TerminationReversed":
            case "SequenceCorrected":
                RequireEnded(current);
                if (change.Operation == "TerminationReversed" && sequence.Count != 1) throw new UsageRightStateException();
                if (rights.Any(x => x.GraveSiteId == current.GraveSiteId && x.Status == UsageRightStatus.Open && !sequence.Any(s => s.Id == x.Id))) throw new UsageRightStateException();
                var last = current.HolderPeriods.OrderBy(x => x.ValidFromInclusive).Last();
                next = next with
                {
                    Status = UsageRightStatus.Open,
                    Termination = null,
                    HolderPeriods = current.HolderPeriods.Select(x => x.Id == last.Id ? x with { ValidUntilExclusive = null } : x).ToArray()
                };
                return new[] { next }.Concat(sequence.Skip(1).Select(x => x with { Status = UsageRightStatus.Voided, Version = checked(x.Version + 1), OperationId = change.Audit.OperationId })).ToArray();
            default: throw new UsageRightStateException();
        }
        return [next];
    }

    public static bool Matches(UsageRightLifecycleChange change, IReadOnlyList<UsageRightView> rights)
    {
        if (rights.Single(x => x.Id == change.Id).Version != change.ExpectedVersion) return false;
        if (change.Correction is not { } correction) return true;
        var sequence = Sequence(change.Id, rights);
        return sequence.Count == correction.Members.Count && sequence.All(x => correction.Members.Any(m => m.Id == x.Id && m.Version == x.Version));
    }

    public static UsageRightView Evidence(UsageRightView view, PersonUsageRightAudit audit, string reason)
    {
        var revision = new UsageRightRevisionView(Guid.NewGuid(), view.Version, audit.Operation, reason, audit.OccurredAtUtc,
            audit.Actor.DisplayName, view.GraveSiteId, view.StartDate, view.EndDate, view.SourceReference, view.UsageRightStartRuleId,
            view.StartRuleCodeSnapshot, view.StartRuleDisplayNameSnapshot, view.HolderPeriods.ToArray(), view.Status, view.PredecessorId, view.Termination, view.OperationId, view.ManualGrantReviewConfirmed);
        return view with { Revisions = view.Revisions.Append(revision).ToArray() };
    }

    private static void RequireEnded(UsageRightView view)
    {
        if (view.Status != UsageRightStatus.Ended || view.Termination is null) throw new UsageRightStateException();
    }
}
