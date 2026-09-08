using System.Reflection;
using System.Text.Json;
using Cemaris.Application.CaseFollowUps;
using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.CaseFollowUps;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.CaseFollowUps;
using Cemaris.Infrastructure.ReadModel;

namespace Cemaris.IntegrationTests;

public sealed class SyntheticCaseFollowUpStoreTests
{
    internal static readonly Guid CaseId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    internal static readonly Guid OtherCaseId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    internal static readonly ActorIdentity Actor = new("synthetic-follow-up", "Synthetische Bearbeitung", SystemRole.Sachbearbeitung);
    internal static CaseFollowUpMutation Mutation(CaseFollowUpOperation operation = CaseFollowUpOperation.Created) =>
        new(Guid.NewGuid(), Guid.NewGuid(), operation, operation == CaseFollowUpOperation.Created ? null : "Synthetischer Grund", Actor, DateTimeOffset.UnixEpoch);

    [Fact]
    public async Task VollstaendigerAblaufMitAtomarerHistorieUndUnveraendertenFachaggregaten()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var cases = new SyntheticCaseReadStore(coordinator: coordinator);
        var store = new SyntheticCaseFollowUpStore(coordinator, cases);
        var before = JsonSerializer.Serialize(await cases.FindAsync(CaseId, CancellationToken.None));
        var id = Guid.NewGuid();
        var created = await store.CreateAsync(CaseId, id, new("Titel", null, new(2024, 2, 29)), Mutation(), CancellationToken.None);
        Assert.Equal(CaseFollowUpOutcome.Success, created.Outcome);
        var version = 1L;
        foreach (var operation in new[] { CaseFollowUpOperation.Changed, CaseFollowUpOperation.Completed, CaseFollowUpOperation.Reopened,
            CaseFollowUpOperation.Cancelled, CaseFollowUpOperation.Reopened })
        {
            var next = await store.ChangeAsync(CaseId, id, version, operation == CaseFollowUpOperation.Changed ? new("Verschoben", "Text", new(2026, 9, 10)) : null,
                Mutation(operation), CancellationToken.None);
            Assert.Equal(CaseFollowUpOutcome.Success, next.Outcome);
            Assert.Equal(++version, next.Value!.State.Version);
            Assert.Equal(version, next.Value.Revisions.Count);
        }
        Assert.Equal((1, 6, 6), store.Diagnostics);
        Assert.Single(created.Value!.Revisions);
        Assert.Equal(before, JsonSerializer.Serialize(await cases.FindAsync(CaseId, CancellationToken.None)));
        Assert.Null(await store.FindAsync(OtherCaseId, id, CancellationToken.None));
        Assert.Equal(CaseFollowUpOutcome.NotFound, (await store.ChangeAsync(OtherCaseId, id, 6, null, Mutation(CaseFollowUpOperation.Completed), CancellationToken.None)).Outcome);
    }

    [Fact]
    public async Task KonkurrierendeAenderungenUndNachweisfehlerHinterlassenKeineTeilwirkung()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var store = new SyntheticCaseFollowUpStore(coordinator, new(coordinator: coordinator));
        var id = Guid.NewGuid(); var initial = Mutation();
        await store.CreateAsync(CaseId, id, new("Titel", null, new(2024, 2, 29)), initial, CancellationToken.None);
        foreach (var invalid in new[] { Mutation(CaseFollowUpOperation.Completed) with { AuditId = initial.AuditId },
            Mutation(CaseFollowUpOperation.Completed) with { RevisionId = initial.RevisionId } })
        {
            await Assert.ThrowsAsync<InvalidOperationException>(() => store.ChangeAsync(CaseId, id, 1, null, invalid, CancellationToken.None));
            Assert.Equal((1, 1, 1), store.Diagnostics);
            Assert.Equal(1, (await store.FindAsync(CaseId, id, CancellationToken.None))!.State.Version);
        }
        var results = await Task.WhenAll(Enumerable.Range(0, 2).Select(_ => Task.Run(() => store.ChangeAsync(CaseId, id, 1, null,
            Mutation(CaseFollowUpOperation.Completed), CancellationToken.None))));
        Assert.Single(results, x => x.Outcome == CaseFollowUpOutcome.Success);
        Assert.Single(results, x => x.Outcome == CaseFollowUpOutcome.VersionConflict);
        Assert.Equal(CaseFollowUpOutcome.InvalidState, (await store.ChangeAsync(CaseId, id, 2, null, Mutation(CaseFollowUpOperation.Cancelled), CancellationToken.None)).Outcome);
        Assert.Equal((1, 2, 2), store.Diagnostics);
        Assert.Equal(["Id", "FollowUpId", "CaseId", "ResultingVersion", "Operation", "ActorId", "OccurredAtUtc"],
            typeof(SyntheticCaseFollowUpStore.Audit).GetProperties().Select(p => p.Name));
    }

    [Fact]
    public async Task FilterKalendertagLetzteLeereSeiteUndSqlGuidGleichstaende()
    {
        var coordinator = new SyntheticStoreCoordinator();
        var store = new SyntheticCaseFollowUpStore(coordinator, new(coordinator: coordinator));
        var ids = new[] { Guid.Parse("ffffffff-ffff-ffff-ffff-000000000001"), Guid.Parse("00000000-0000-0000-0000-000000000002") };
        foreach (var id in ids.Reverse()) await store.CreateAsync(CaseId, id, new("Gleichstand", null, new(2024, 2, 29)), Mutation(), CancellationToken.None);
        for (var i = 0; i < 11; i++)
        {
            var id = Guid.NewGuid();
            await store.CreateAsync(OtherCaseId, id, new("Weitere", null, new(2026, 9, 10)), Mutation(), CancellationToken.None);
            if (i < 2) await store.ChangeAsync(OtherCaseId, id, 1, null, Mutation(i == 0 ? CaseFollowUpOperation.Completed : CaseFollowUpOperation.Cancelled), CancellationToken.None);
        }
        var exact = await store.ReadAsync(null, new(DueUntil: new(2024, 2, 29)), CancellationToken.None);
        Assert.Equal(ids, exact!.Items.Select(x => x.Id));
        Assert.Equal(2, exact.TotalMatches);
        Assert.Equal(0, (await store.ReadAsync(null, new(DueUntil: new(2024, 2, 28)), CancellationToken.None))!.TotalMatches);
        var last = await store.ReadAsync(null, new(Status: null, Page: 2), CancellationToken.None);
        Assert.Equal(13, last!.TotalMatches); Assert.Equal(3, last.Items.Count);
        Assert.Empty((await store.ReadAsync(null, new(Status: null, Page: 3), CancellationToken.None))!.Items);
        Assert.Single((await store.ReadAsync(OtherCaseId, new(Status: CaseFollowUpStatus.Cancelled), CancellationToken.None))!.Items);
        Assert.Single((await store.ReadAsync(null, new(Status: CaseFollowUpStatus.Completed), CancellationToken.None))!.Items);
        Assert.Null(await store.ReadAsync(Guid.NewGuid(), new(), CancellationToken.None));
    }

    [Fact]
    public async Task NichtsynthetischeZieleWerdenAuchNachAnlageAbgewiesen()
    {
        var coordinator = new SyntheticStoreCoordinator(); var cases = new SyntheticCaseReadStore(coordinator: coordinator);
        var store = new SyntheticCaseFollowUpStore(coordinator, cases); var id = Guid.NewGuid();
        await store.CreateAsync(CaseId, id, new("Titel", null, new(2024, 2, 29)), Mutation(), CancellationToken.None);
        MarkNonSynthetic(cases);
        Assert.Equal(CaseFollowUpOutcome.NonSynthetic, (await store.CreateAsync(CaseId, Guid.NewGuid(), new("Titel", null, new(2024, 2, 29)), Mutation(), CancellationToken.None)).Outcome);
        Assert.Equal(CaseFollowUpOutcome.NonSynthetic, (await store.ChangeAsync(CaseId, id, 1, null, Mutation(CaseFollowUpOperation.Completed), CancellationToken.None)).Outcome);
        Assert.Equal((1, 1, 1), store.Diagnostics);
    }

    internal static void MarkNonSynthetic(SyntheticCaseReadStore store)
    {
        // Ausschließlich der isolierte Speicher des Tests; kein Produktmutationspfad.
        var list = (List<CaseOverview>)typeof(SyntheticCaseReadStore).GetField("cases", BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(store)!;
        var index = list.FindIndex(x => x.Id == CaseId);
        list[index] = list[index] with { IsSynthetic = false };
    }
}
