using Cemaris.Application.PersonUsageRights;
using Cemaris.Domain.Parties;
using Cemaris.Domain.UsageRights;

namespace Cemaris.UnitTests;

public sealed class PersonUsageRightRulesTests
{
    [Fact]
    public void PartyTypesRequireOnlyTheirOwnNameFields()
    {
        var person = PartyName.Create(PartyType.NaturalPerson, "Synthetik", "Beispiel", null);
        var organization = PartyName.Create(PartyType.Organization, null, null, "Synthetische Organisation");
        Assert.Equal("Synthetik", person.FirstName);
        Assert.Equal("Synthetische Organisation", organization.OrganizationName);
        Assert.Throws<PartyValidationException>(() => PartyName.Create(PartyType.NaturalPerson, null, "Beispiel", null));
        Assert.Throws<PartyValidationException>(() => PartyName.Create(PartyType.Organization, "Nicht", null, "Organisation"));
    }

    [Fact]
    public void PeriodsAndManualUsageRightDatesHaveStrictBoundaries()
    {
        PartyRules.ValidatePeriod(new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 2));
        Assert.Throws<PartyValidationException>(() => PartyRules.ValidatePeriod(new(2026, 1, 1), new(2026, 1, 1)));
        UsageRightRules.ValidateFacts(Guid.NewGuid(), new(2026, 1, 1), new(2056, 1, 1), "SYN-REF");
        Assert.Throws<UsageRightValidationException>(() => UsageRightRules.ValidateFacts(Guid.NewGuid(), new(2026, 1, 1), new(2026, 1, 1), "SYN-REF"));
        Assert.Throws<UsageRightValidationException>(() => UsageRightRules.ValidateExtension(new(2056, 1, 1), new(2056, 1, 1)));
    }
}
