using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;

namespace Cemaris.UnitTests;

public sealed class CaseWriteServiceTests
{
    [Fact]
    public async Task AllWriteCasesReceiveDeterministicUtcActorOperationTargetAndVersion()
    {
        var changedAtUtc = new DateTimeOffset(2026, 8, 13, 7, 45, 0, TimeSpan.Zero);
        var store = new RecordingCaseStore();
        var service = new CaseWriteService(
            store,
            store,
            new SyntheticDevelopmentActorProvider(),
            new FixedTimeProvider(changedAtUtc));

        var created = await service.CreateAsync(
            new CreateCaseCommand("Synthetischer Service-Testfriedhof", "Testfeld", "SYN-SVC-1"),
            CancellationToken.None);
        var withPerson = await service.AddDeceasedPersonAsync(
            created.Id,
            created.Version,
            new SaveDeceasedPersonCommand("Testvorname", "Testname", null, null),
            CancellationToken.None);
        var personId = Assert.Single(withPerson.DeceasedPersons).Id;
        var changedPerson = await service.ChangeDeceasedPersonAsync(
            created.Id,
            personId,
            withPerson.Version,
            new SaveDeceasedPersonCommand("Testvorname-Neu", "Testname", null, null),
            CancellationToken.None);
        var withBurial = await service.AddBurialAsync(
            created.Id,
            changedPerson.Version,
            new SaveBurialCommand(personId, new DateOnly(2026, 8, 14)),
            CancellationToken.None);
        var burialId = Assert.Single(withBurial.Burials).Id;
        var changedBurial = await service.ChangeBurialAsync(
            created.Id,
            burialId,
            withBurial.Version,
            new SaveBurialCommand(personId, new DateOnly(2026, 8, 15)),
            CancellationToken.None);
        var final = await service.ChangeGraveAsync(
            created.Id,
            changedBurial.Version,
            new ChangeGraveCommand("Synthetischer Service-Testfriedhof", "Testfeld", "SYN-SVC-2"),
            CancellationToken.None);

        Assert.Equal(6, final.Version);
        Assert.Equal(
            [
                CaseChangeOperation.CaseCreated,
                CaseChangeOperation.DeceasedPersonAdded,
                CaseChangeOperation.DeceasedPersonChanged,
                CaseChangeOperation.BurialAdded,
                CaseChangeOperation.BurialChanged,
                CaseChangeOperation.GraveChanged,
            ],
            store.Changes.Select(item => item.Operation));
        Assert.Equal([1L, 2L, 3L, 4L, 5L, 6L], store.Changes.Select(item => item.ResultingVersion.Value));
        Assert.Equal([null, personId, personId, burialId, burialId, null], store.Changes.Select(item => item.TargetEntityId));
        Assert.All(store.Changes, change =>
        {
            Assert.NotEqual(Guid.Empty, change.Id);
            Assert.Equal(created.Id, change.CaseId);
            Assert.Equal(changedAtUtc, change.OccurredAtUtc);
            Assert.Equal(SyntheticDevelopmentActorProvider.Actor, change.Actor);
            Assert.Equal(TimeSpan.Zero, change.OccurredAtUtc.Offset);
        });
        Assert.Equal(store.Changes.Count, store.Changes.Select(item => item.Id).Distinct().Count());
        Assert.Equal(SyntheticDevelopmentActorProvider.ActorDisplayName, final.LastChange?.ActorDisplayName);
        Assert.Equal(changedAtUtc, final.LastChange?.ChangedAtUtc);
    }

    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }

    private sealed class RecordingCaseStore : ICaseReadStore, ICaseWriteStore
    {
        private CaseOverview? current;

        public List<CaseChange> Changes { get; } = [];

        public Task CreateAsync(
            CaseRecord caseRecord,
            CaseChange change,
            CancellationToken cancellationToken)
        {
            current = new CaseOverview(
                caseRecord.Id,
                true,
                caseRecord.Version.Value,
                new GraveDetails(
                    caseRecord.Grave.Cemetery,
                    caseRecord.Grave.Field,
                    caseRecord.Grave.GraveNumber),
                [],
                [],
                [],
                [],
                [],
                [],
                ToLastChange(change));
            Changes.Add(change);
            return Task.CompletedTask;
        }

        public Task<CaseMutationResult> ChangeGraveAsync(
            Guid caseId,
            CaseVersion expectedVersion,
            GraveReference grave,
            CaseChange change,
            CancellationToken cancellationToken) =>
            Mutate(expectedVersion, change, item => item with
            {
                Grave = new GraveDetails(grave.Cemetery, grave.Field, grave.GraveNumber),
            });

        public Task<CaseMutationResult> AddDeceasedPersonAsync(
            Guid caseId,
            CaseVersion expectedVersion,
            DeceasedPerson deceasedPerson,
            CaseChange change,
            CancellationToken cancellationToken) =>
            Mutate(expectedVersion, change, item => item with
            {
                DeceasedPersons =
                [
                    .. item.DeceasedPersons,
                    new DeceasedDetails(
                        deceasedPerson.Id,
                        deceasedPerson.FirstName,
                        deceasedPerson.LastName,
                        deceasedPerson.BirthDate,
                        deceasedPerson.DeathDate),
                ],
            });

        public Task<CaseMutationResult> ChangeDeceasedPersonAsync(
            Guid caseId,
            Guid personId,
            CaseVersion expectedVersion,
            DeceasedPerson deceasedPerson,
            CaseChange change,
            CancellationToken cancellationToken) =>
            Mutate(expectedVersion, change, item => item with
            {
                DeceasedPersons = item.DeceasedPersons.Select(person => person.Id == personId
                    ? new DeceasedDetails(
                        personId,
                        deceasedPerson.FirstName,
                        deceasedPerson.LastName,
                        deceasedPerson.BirthDate,
                        deceasedPerson.DeathDate)
                    : person).ToArray(),
            });

        public Task<CaseMutationResult> AddBurialAsync(
            Guid caseId,
            CaseVersion expectedVersion,
            Burial burial,
            CaseChange change,
            CancellationToken cancellationToken) =>
            Mutate(expectedVersion, change, item => item with
            {
                Burials =
                [
                    .. item.Burials,
                    new BurialDetails(burial.Id, burial.DeceasedPersonId, burial.BurialDate),
                ],
            });

        public Task<CaseMutationResult> ChangeBurialAsync(
            Guid caseId,
            Guid burialId,
            CaseVersion expectedVersion,
            Burial burial,
            CaseChange change,
            CancellationToken cancellationToken) =>
            Mutate(expectedVersion, change, item => item with
            {
                Burials = item.Burials.Select(savedBurial => savedBurial.Id == burialId
                    ? new BurialDetails(burialId, burial.DeceasedPersonId, burial.BurialDate)
                    : savedBurial).ToArray(),
            });

        public Task<CaseSearchStoreResult> SearchAsync(
            SearchCriteria criteria,
            int offset,
            int maximumResults,
            CancellationToken cancellationToken) =>
            Task.FromResult(new CaseSearchStoreResult([], 0));

        public Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(current?.Id == id ? current : null);

        private Task<CaseMutationResult> Mutate(
            CaseVersion expectedVersion,
            CaseChange change,
            Func<CaseOverview, CaseOverview> mutation)
        {
            Assert.NotNull(current);
            Assert.Equal(expectedVersion.Value, current.Version);
            current = mutation(current) with
            {
                Version = change.ResultingVersion.Value,
                LastChange = ToLastChange(change),
            };
            Changes.Add(change);
            return Task.FromResult(CaseMutationResult.Succeeded(change.ResultingVersion));
        }

        private static LastCaseChangeDetails ToLastChange(CaseChange change) =>
            new(change.Actor.DisplayName, change.OccurredAtUtc);
    }
}
