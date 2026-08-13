using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;
using Cemaris.Infrastructure.ReadModel;

namespace Cemaris.IntegrationTests;

public sealed class SyntheticCaseChangeStoreTests
{
    [Fact]
    public async Task AuditPersistenceFailureLeavesCaseVersionLastChangeAndFactsUnchanged()
    {
        var store = new SyntheticCaseReadStore();
        var caseId = Guid.NewGuid();
        var occurredAtUtc = new DateTimeOffset(2026, 8, 13, 8, 0, 0, TimeSpan.Zero);
        var caseRecord = CaseRecord.CreateSynthetic(
            caseId,
            GraveReference.Create("Synthetischer Rollback-Testfriedhof", null, "SYN-RB-1"));
        var createdChange = new CaseChange(
            Guid.NewGuid(),
            caseId,
            caseRecord.Version,
            occurredAtUtc,
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.CaseCreated,
            null);
        await store.CreateAsync(caseRecord, createdChange, CancellationToken.None);

        var failingChange = new CaseChange(
            createdChange.Id,
            caseId,
            caseRecord.Version.Next(),
            occurredAtUtc.AddMinutes(1),
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.GraveChanged,
            null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => store.ChangeGraveAsync(
            caseId,
            caseRecord.Version,
            GraveReference.Create("Darf nicht gespeichert werden", null, "SYN-RB-2"),
            failingChange,
            CancellationToken.None));

        var unchanged = await store.FindAsync(caseId, CancellationToken.None);
        Assert.NotNull(unchanged);
        Assert.Equal(1, unchanged.Version);
        Assert.Equal("Synthetischer Rollback-Testfriedhof", unchanged.Grave.Cemetery);
        Assert.Equal(occurredAtUtc, unchanged.LastChange?.ChangedAtUtc);
        Assert.Single(store.GetChanges(caseId));
    }
}
