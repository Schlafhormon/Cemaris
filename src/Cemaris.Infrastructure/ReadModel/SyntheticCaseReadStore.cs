using Cemaris.Application.Cases;
using Cemaris.Domain.Cases;

namespace Cemaris.Infrastructure.ReadModel;

/// <summary>
/// Repository-safe demonstration data. Every name, address and identifier is
/// intentionally artificial and must never be interpreted as production data.
/// </summary>
public sealed class SyntheticCaseReadStore : ICaseReadStore, ICaseWriteStore
{
    private readonly object gate = new();
    private readonly List<CaseOverview> cases = CreateCases().ToList();

    public Task<CaseSearchStoreResult> SearchAsync(
        SearchCriteria criteria,
        int maximumResults,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (gate)
        {
            return Task.FromResult(InMemoryCaseSearch.Search(cases, criteria, maximumResults));
        }
    }

    public Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (gate)
        {
            return Task.FromResult(cases.SingleOrDefault(item => item.Id == id));
        }
    }

    public Task CreateAsync(CaseRecord caseRecord, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(caseRecord);
        cancellationToken.ThrowIfCancellationRequested();

        lock (gate)
        {
            if (cases.Any(item => item.Id == caseRecord.Id))
            {
                throw new InvalidOperationException("Die serverseitig erzeugte Fall-ID ist bereits vorhanden.");
            }

            cases.Add(new CaseOverview(
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
                ["Ausschließlich synthetische Development-Fallakte."]));
        }

        return Task.CompletedTask;
    }

    public Task<CaseMutationResult> ChangeGraveAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        GraveReference grave,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(grave);
        return MutateAsync(caseId, expectedVersion, current => current with
        {
            Grave = new GraveDetails(grave.Cemetery, grave.Field, grave.GraveNumber),
        }, cancellationToken);
    }

    public Task<CaseMutationResult> AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(deceasedPerson);
        return MutateAsync(caseId, expectedVersion, current => current with
        {
            DeceasedPersons =
            [
                .. current.DeceasedPersons,
                new DeceasedDetails(
                    deceasedPerson.Id,
                    deceasedPerson.FirstName,
                    deceasedPerson.LastName,
                    deceasedPerson.BirthDate,
                    deceasedPerson.DeathDate),
            ],
        }, cancellationToken);
    }

    public Task<CaseMutationResult> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(deceasedPerson);
        return MutateAsync(
            caseId,
            expectedVersion,
            current => current with
            {
                DeceasedPersons = current.DeceasedPersons
                    .Select(person => person.Id == personId
                        ? new DeceasedDetails(
                            personId,
                            deceasedPerson.FirstName,
                            deceasedPerson.LastName,
                            deceasedPerson.BirthDate,
                            deceasedPerson.DeathDate)
                        : person)
                    .ToArray(),
            },
            cancellationToken,
            current => current.DeceasedPersons.Any(person => person.Id == personId));
    }

    public Task<CaseMutationResult> AddBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        Burial burial,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(burial);
        return MutateAsync(
            caseId,
            expectedVersion,
            current => current with
            {
                Burials =
                [
                    .. current.Burials,
                    new BurialDetails(burial.Id, burial.DeceasedPersonId, burial.BurialDate),
                ],
            },
            cancellationToken,
            referenceIsValid: current => burial.DeceasedPersonId is null
                || current.DeceasedPersons.Any(person => person.Id == burial.DeceasedPersonId));
    }

    public Task<CaseMutationResult> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        Burial burial,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(burial);
        return MutateAsync(
            caseId,
            expectedVersion,
            current => current with
            {
                Burials = current.Burials
                    .Select(item => item.Id == burialId
                        ? new BurialDetails(burialId, burial.DeceasedPersonId, burial.BurialDate)
                        : item)
                    .ToArray(),
            },
            cancellationToken,
            current => current.Burials.Any(item => item.Id == burialId),
            current => burial.DeceasedPersonId is null
                || current.DeceasedPersons.Any(person => person.Id == burial.DeceasedPersonId));
    }

    private Task<CaseMutationResult> MutateAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        Func<CaseOverview, CaseOverview> mutation,
        CancellationToken cancellationToken,
        Func<CaseOverview, bool>? childExists = null,
        Func<CaseOverview, bool>? referenceIsValid = null)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (gate)
        {
            var index = cases.FindIndex(item => item.Id == caseId);
            if (index < 0)
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.CaseNotFound));
            }

            var current = cases[index];
            if (!current.IsSynthetic)
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.CaseNotFound));
            }

            if (current.Version != expectedVersion.Value)
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.VersionConflict));
            }

            if (childExists is not null && !childExists(current))
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.ChildNotFound));
            }

            if (referenceIsValid is not null && !referenceIsValid(current))
            {
                return Task.FromResult(CaseMutationResult.Failed(
                    CaseMutationOutcome.InvalidDeceasedPersonReference));
            }

            var nextVersion = expectedVersion.Next();
            cases[index] = mutation(current) with { Version = nextVersion.Value };
            return Task.FromResult(CaseMutationResult.Succeeded(nextVersion));
        }
    }

    internal static IReadOnlyList<CaseOverview> CreateCases()
    {
        var cases = new List<CaseOverview>
        {
            CreateLinkedExample(),
            CreateIncompleteExample(),
        };

        for (var index = 3; index <= 15; index++)
        {
            cases.Add(CreateGeneratedExample(index));
        }

        return cases;
    }

    private static CaseOverview CreateLinkedExample()
    {
        var firstDeceasedId = Id(101);
        var secondDeceasedId = Id(102);
        var entitledPersonId = Id(201);

        return new CaseOverview(
            Id(1),
            true,
            CaseVersion.InitialValue,
            new GraveDetails("Synthetischer Testfriedhof Nord", "Testfeld A", "1001"),
            [
                new DeceasedDetails(
                    firstDeceasedId,
                    "Erika-Test",
                    "Muster-Testperson",
                    new DateOnly(1940, 1, 2),
                    new DateOnly(2024, 2, 3)),
                new DeceasedDetails(
                    secondDeceasedId,
                    "Emil-Test",
                    "Muster-Testperson",
                    new DateOnly(1938, 4, 5),
                    new DateOnly(2020, 6, 7)),
            ],
            [
                new BurialDetails(Id(301), firstDeceasedId, new DateOnly(2024, 2, 12)),
                new BurialDetails(Id(302), secondDeceasedId, new DateOnly(2020, 6, 15)),
            ],
            [
                new UsageRightDetails(
                    Id(401),
                    "SYN-NR-2020-001",
                    new DateOnly(2020, 6, 15),
                    new DateOnly(2040, 6, 14),
                    [entitledPersonId]),
            ],
            [
                new EntitledPersonDetails(
                    entitledPersonId,
                    "Alex-Test",
                    "Beispielperson",
                    null,
                    [
                        new AddressDetails(
                            Id(501),
                            "Künstlicher Testweg",
                            "1",
                            "00000",
                            "Beispielstadt",
                            "Synthetische Hauptanschrift"),
                        new AddressDetails(
                            Id(502),
                            "Demoallee",
                            "2",
                            "00001",
                            "Testort",
                            "Synthetische Nebenanschrift"),
                    ]),
            ],
            [
                new NoticeDetails(
                    Id(601),
                    "SYN-B-2024-0001",
                    new DateOnly(2024, 2, 20),
                    new DateOnly(2024, 3, 20),
                    1250.00m,
                    "EUR",
                    [
                        new FeeItemDetails(
                            Id(701),
                            "Synthetische Gebührenposition A",
                            1000.00m,
                            "EUR"),
                        new FeeItemDetails(
                            Id(702),
                            "Synthetische Gebührenposition B",
                            250.00m,
                            "EUR"),
                    ]),
            ],
            ["Alle Angaben dieses Falls sind ausschließlich synthetische Demonstrationsdaten."]);
    }

    private static CaseOverview CreateIncompleteExample()
    {
        var deceasedId = Id(110);
        var missingEntitledPersonId = Id(299);

        return new CaseOverview(
            Id(2),
            true,
            CaseVersion.InitialValue,
            new GraveDetails("Synthetischer Testfriedhof Süd", null, "2"),
            [
                new DeceasedDetails(
                    deceasedId,
                    null,
                    "Unvollständige-Testperson",
                    null,
                    new DateOnly(2023, 8, 9)),
            ],
            [new BurialDetails(Id(310), null, new DateOnly(2023, 8, 18))],
            [
                new UsageRightDetails(
                    Id(410),
                    null,
                    new DateOnly(2023, 8, 18),
                    null,
                    [missingEntitledPersonId]),
            ],
            [],
            [
                new NoticeDetails(
                    Id(610),
                    "2",
                    null,
                    null,
                    null,
                    null,
                    []),
            ],
            [
                "Die Beisetzung ist absichtlich keiner verstorbenen Person zugeordnet.",
                "Der technische Berechtigtenbezug verweist absichtlich auf keinen vorhandenen Datensatz.",
                "Feld, Vorname und mehrere Bescheidangaben fehlen absichtlich.",
            ]);
    }

    private static CaseOverview CreateGeneratedExample(int index)
    {
        var deceasedId = Id(1000 + index);
        var entitledPersonId = Id(2000 + index);

        return new CaseOverview(
            Id(index),
            true,
            CaseVersion.InitialValue,
            new GraveDetails(
                index % 2 == 0
                    ? "Synthetischer Testfriedhof Nord"
                    : "Synthetischer Testfriedhof West",
                $"Testfeld {index:00}",
                $"{1000 + index}"),
            [
                new DeceasedDetails(
                    deceasedId,
                    $"Testvorname-{index:00}",
                    $"Synthetische-Person-{index:00}",
                    new DateOnly(1940 + index, 1, 1),
                    new DateOnly(2020 + (index % 5), 2, 1)),
            ],
            [
                new BurialDetails(
                    Id(3000 + index),
                    deceasedId,
                    new DateOnly(2020 + (index % 5), 2, 10)),
            ],
            [
                new UsageRightDetails(
                    Id(4000 + index),
                    $"SYN-NR-{index:000}",
                    new DateOnly(2020 + (index % 5), 2, 10),
                    new DateOnly(2040 + (index % 5), 2, 9),
                    [entitledPersonId]),
            ],
            [
                new EntitledPersonDetails(
                    entitledPersonId,
                    $"Testberechtigt-{index:00}",
                    $"Beispiel-{index:00}",
                    null,
                    [
                        new AddressDetails(
                            Id(5000 + index),
                            "Künstlicher Datenweg",
                            index.ToString(System.Globalization.CultureInfo.InvariantCulture),
                            "00000",
                            "Beispielstadt",
                            "Nur Testdaten"),
                    ]),
            ],
            [
                new NoticeDetails(
                    Id(6000 + index),
                    $"SYN-B-2024-{index:0000}",
                    new DateOnly(2024, 3, 1),
                    new DateOnly(2024, 4, 1),
                    index * 100m,
                    "EUR",
                    [
                        new FeeItemDetails(
                            Id(7000 + index),
                            $"Synthetische Gebührenposition {index:00}",
                            index * 100m,
                            "EUR"),
                    ]),
            ],
            ["Automatisch erzeugter, vollständig synthetischer MVP-Demonstrationsfall."]);
    }

    private static Guid Id(int value) =>
        Guid.Parse($"00000000-0000-0000-0000-{value:000000000000}");
}
