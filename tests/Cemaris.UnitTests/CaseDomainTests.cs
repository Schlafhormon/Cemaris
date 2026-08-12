using Cemaris.Domain.Cases;

namespace Cemaris.UnitTests;

public sealed class CaseDomainTests
{
    [Fact]
    public void SyntheticCaseNormalizesFactsAndStartsWithStableServerIdAndVersion()
    {
        var id = Guid.NewGuid();
        var grave = GraveReference.Create("  Synthetischer Friedhof  ", " Testfeld ", " SYN-1 ");

        var record = CaseRecord.CreateSynthetic(id, grave);

        Assert.Equal(id, record.Id);
        Assert.True(record.IsSynthetic);
        Assert.Equal(CaseVersion.InitialValue, record.Version.Value);
        Assert.Equal("Synthetischer Friedhof", record.Grave.Cemetery);
        Assert.Equal("Testfeld", record.Grave.Field);
        Assert.Equal("SYN-1", record.Grave.GraveNumber);
    }

    [Fact]
    public void OptionalWhitespaceIsNormalizedAndPersonRequiresOneNamePart()
    {
        var person = DeceasedPerson.Create(
            Guid.NewGuid(),
            " Testvorname ",
            "  ",
            null,
            null);

        Assert.Equal("Testvorname", person.FirstName);
        Assert.Null(person.LastName);

        var exception = Assert.Throws<CaseValidationException>(() => DeceasedPerson.Create(
            Guid.NewGuid(),
            " ",
            null,
            null,
            null));
        Assert.Contains("lastName", exception.Errors.Keys);
    }

    [Fact]
    public void LengthLimitsAndRequiredBurialDateAreValidatedCentrally()
    {
        var graveException = Assert.Throws<CaseValidationException>(() =>
            GraveReference.Create(new string('S', 201), null, null));
        var burialException = Assert.Throws<CaseValidationException>(() =>
            Burial.Create(Guid.NewGuid(), null, null));

        Assert.Contains("cemetery", graveException.Errors.Keys);
        Assert.Contains("burialDate", burialException.Errors.Keys);
    }

    [Fact]
    public void CaseVersionIncrementsMonotonicallyAndRejectsInvalidValues()
    {
        var initial = new CaseVersion(CaseVersion.InitialValue);

        Assert.Equal(2, initial.Next().Value);
        Assert.Equal(3, initial.Next().Next().Value);
        Assert.Throws<ArgumentOutOfRangeException>(() => new CaseVersion(0));
    }
}
