using System.Data;
using System.Security.Cryptography;
using System.Text;
using Cemaris.Application.Cases;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.ReadModel;

/// <summary>
/// Explicitly resets the SQL read model to the repository-safe demonstration data.
/// The caller remains responsible for restricting this operation to Development.
/// </summary>
public sealed class SyntheticReadModelSeeder(CemarisDbContext dbContext)
{
    public async Task<SyntheticSeedResult> ResetAsync(
        string expectedDatabase,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(expectedDatabase))
        {
            throw new InvalidOperationException(
                "Maintenance:ExpectedDatabase must name the database that may be seeded.");
        }

        if (!dbContext.Database.IsSqlServer())
        {
            throw new InvalidOperationException("Synthetic SQL seeding is supported only for SQL Server.");
        }

        var mapping = MapCases(SyntheticCaseReadStore.CreateCases());

        await dbContext.Database.OpenConnectionAsync(cancellationToken);
        var actualDatabase = dbContext.Database.GetDbConnection().Database;
        if (!string.Equals(actualDatabase, expectedDatabase, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Seeding was refused because database '{actualDatabase}' does not match the expected database '{expectedDatabase}'.");
        }

        var pendingMigrations = await dbContext.Database
            .GetPendingMigrationsAsync(cancellationToken);
        if (pendingMigrations.Any())
        {
            throw new InvalidOperationException(
                "Seeding was refused because the database has pending migrations. Apply them first.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        if (await dbContext.Cases.AnyAsync(item => !item.IsSynthetic, cancellationToken))
        {
            throw new InvalidOperationException(
                "Seeding was refused because the database contains at least one non-synthetic case.");
        }

        await dbContext.Cases
            .Where(item => item.IsSynthetic)
            .ExecuteDeleteAsync(cancellationToken);

        dbContext.Cases.AddRange(mapping.Cases);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new SyntheticSeedResult(mapping.Cases.Count, mapping.SkippedUnresolvedUsageRightHolders);
    }

    private static SyntheticSeedMapping MapCases(IReadOnlyList<CaseOverview> cases)
    {
        if (cases.Any(item => !item.IsSynthetic))
        {
            throw new InvalidOperationException("The synthetic seed source contains a case without its synthetic marker.");
        }

        var mappedCases = new List<CaseReadEntity>(cases.Count);
        var skippedUnresolvedUsageRightHolders = 0;

        foreach (var source in cases)
        {
            var mappedCase = new CaseReadEntity
            {
                Id = source.Id,
                IsSynthetic = true,
                Version = source.Version,
                Grave = new GraveReadEntity
                {
                    CaseId = source.Id,
                    Cemetery = source.Grave.Cemetery
                        ?? throw new InvalidOperationException($"Synthetic case '{source.Id}' has no cemetery."),
                    Field = source.Grave.Field,
                    GraveNumber = source.Grave.GraveNumber,
                },
            };

            foreach (var deceased in source.DeceasedPersons)
            {
                mappedCase.DeceasedPersons.Add(new DeceasedReadEntity
                {
                    Id = deceased.Id,
                    CaseId = source.Id,
                    FirstName = deceased.FirstName,
                    LastName = deceased.LastName,
                    BirthDate = deceased.BirthDate,
                    DeathDate = deceased.DeathDate,
                });
            }

            foreach (var burial in source.Burials)
            {
                mappedCase.Burials.Add(new BurialReadEntity
                {
                    Id = burial.Id,
                    CaseId = source.Id,
                    DeceasedPersonId = burial.DeceasedPersonId,
                    BurialDate = burial.BurialDate,
                });
            }

            var entitledPersonIds = source.EntitledPersons
                .Select(item => item.Id)
                .ToHashSet();

            foreach (var usageRight in source.UsageRights)
            {
                var mappedUsageRight = new UsageRightReadEntity
                {
                    Id = usageRight.Id,
                    CaseId = source.Id,
                    Reference = usageRight.Reference,
                    ValidFrom = usageRight.ValidFrom,
                    ValidUntil = usageRight.ValidUntil,
                };

                foreach (var entitledPersonId in usageRight.EntitledPersonIds)
                {
                    if (!entitledPersonIds.Contains(entitledPersonId))
                    {
                        skippedUnresolvedUsageRightHolders++;
                        continue;
                    }

                    mappedUsageRight.Holders.Add(new UsageRightHolderReadEntity
                    {
                        Id = DeterministicId($"usage-right-holder:{usageRight.Id}:{entitledPersonId}"),
                        UsageRightId = usageRight.Id,
                        EntitledPersonId = entitledPersonId,
                    });
                }

                mappedCase.UsageRights.Add(mappedUsageRight);
            }

            foreach (var entitledPerson in source.EntitledPersons)
            {
                var mappedEntitledPerson = new EntitledPersonReadEntity
                {
                    Id = entitledPerson.Id,
                    CaseId = source.Id,
                    FirstName = entitledPerson.FirstName,
                    LastName = entitledPerson.LastName,
                    OrganizationName = entitledPerson.OrganizationName,
                };

                foreach (var address in entitledPerson.Addresses)
                {
                    mappedEntitledPerson.Addresses.Add(new AddressReadEntity
                    {
                        Id = address.Id,
                        EntitledPersonId = entitledPerson.Id,
                        Street = address.Street,
                        HouseNumber = address.HouseNumber,
                        PostalCode = address.PostalCode,
                        City = address.City,
                        AdditionalInformation = address.AdditionalInformation,
                    });
                }

                mappedCase.EntitledPersons.Add(mappedEntitledPerson);
            }

            foreach (var notice in source.Notices)
            {
                var mappedNotice = new NoticeReadEntity
                {
                    Id = notice.Id,
                    CaseId = source.Id,
                    NoticeNumber = notice.NoticeNumber,
                    NoticeDate = notice.NoticeDate,
                    DueDate = notice.DueDate,
                    AssessedAmount = notice.AssessedAmount,
                    CurrencyCode = notice.CurrencyCode,
                };

                foreach (var feeItem in notice.FeeItems)
                {
                    mappedNotice.FeeItems.Add(new FeeItemReadEntity
                    {
                        Id = feeItem.Id,
                        NoticeId = notice.Id,
                        Description = feeItem.Description,
                        Amount = feeItem.Amount,
                        CurrencyCode = feeItem.CurrencyCode,
                    });
                }

                mappedCase.Notices.Add(mappedNotice);
            }

            for (var index = 0; index < source.DataQualityNotes.Count; index++)
            {
                mappedCase.DataQualityNotes.Add(new DataQualityNoteReadEntity
                {
                    Id = DeterministicId($"data-quality-note:{source.Id}:{index}"),
                    CaseId = source.Id,
                    Text = source.DataQualityNotes[index],
                });
            }

            mappedCases.Add(mappedCase);
        }

        return new SyntheticSeedMapping(mappedCases, skippedUnresolvedUsageRightHolders);
    }

    private static Guid DeterministicId(string value)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return new Guid(hash.AsSpan(0, 16));
    }

    private sealed record SyntheticSeedMapping(
        IReadOnlyList<CaseReadEntity> Cases,
        int SkippedUnresolvedUsageRightHolders);
}

public sealed record SyntheticSeedResult(
    int CasesWritten,
    int SkippedUnresolvedUsageRightHolders);
