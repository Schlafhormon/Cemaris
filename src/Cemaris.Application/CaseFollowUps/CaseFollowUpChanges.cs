using Cemaris.Domain.CaseFollowUps;

namespace Cemaris.Application.CaseFollowUps;

public static class CaseFollowUpChanges
{
    public static CaseFollowUpState? Apply(CaseFollowUpState current, CaseFollowUpFacts? facts, CaseFollowUpMutation mutation)
    {
        var target = CaseFollowUpRules.Target(current.Status, mutation.Operation);
        if (target is null) return null;
        CaseFollowUpRules.Reason(mutation.Reason);
        if (mutation.Operation == CaseFollowUpOperation.Changed)
        {
            ArgumentNullException.ThrowIfNull(facts);
            if (current.Title == facts.Title && current.Description == facts.Description && current.DueDate == facts.DueDate)
                throw new CaseFollowUpValidationException("title", "Die normalisierten Angaben sind unverändert.");
        }
        else if (facts is not null)
            throw new InvalidOperationException("Ein Statusübergang darf keine Angaben ändern.");
        return current with
        {
            Title = facts?.Title ?? current.Title,
            Description = facts is null ? current.Description : facts.Description,
            DueDate = facts?.DueDate ?? current.DueDate,
            Status = target.Value,
            Version = checked(current.Version + 1),
            UpdatedAtUtc = mutation.OccurredAtUtc,
        };
    }

    public static CaseFollowUpRevision Revision(CaseFollowUpState state, CaseFollowUpMutation mutation) =>
        new(mutation.RevisionId, state, mutation.Operation, mutation.Reason, mutation.Actor.Id,
            mutation.Actor.DisplayName, mutation.OccurredAtUtc);
}
