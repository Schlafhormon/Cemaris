using System.Text;

namespace Cemaris.Domain.Parties;

public enum PartyType
{
    NaturalPerson = 1,
    Organization = 2,
}

public sealed record PartyName
{
    private PartyName(PartyType type, string? firstName, string? lastName, string? organizationName)
    {
        Type = type;
        FirstName = firstName;
        LastName = lastName;
        OrganizationName = organizationName;
    }

    public PartyType Type { get; }
    public string? FirstName { get; }
    public string? LastName { get; }
    public string? OrganizationName { get; }

    public static PartyName Create(PartyType type, string? firstName, string? lastName, string? organizationName)
    {
        if (!Enum.IsDefined(type)) throw new PartyValidationException("partyType", "Die Beteiligtenart ist ungültig.");
        firstName = PartyRules.Optional(firstName, 200, "firstName");
        lastName = PartyRules.Optional(lastName, 200, "lastName");
        organizationName = PartyRules.Optional(organizationName, 250, "organizationName");
        if (type == PartyType.NaturalPerson && (firstName is null || lastName is null))
            throw new PartyValidationException(firstName is null ? "firstName" : "lastName", "Vor- und Nachname sind für natürliche Personen erforderlich.");
        if (type == PartyType.NaturalPerson && organizationName is not null)
            throw new PartyValidationException("organizationName", "Ein Organisationsname ist für natürliche Personen nicht zulässig.");
        if (type == PartyType.Organization && organizationName is null)
            throw new PartyValidationException("organizationName", "Der Organisationsname ist erforderlich.");
        if (type == PartyType.Organization && (firstName is not null || lastName is not null))
            throw new PartyValidationException("firstName", "Personennamen sind für Organisationen nicht zulässig.");
        return new(type, firstName, lastName, organizationName);
    }

    public string NormalizedValue => PartyRules.Normalize(Type == PartyType.Organization
        ? OrganizationName!
        : $"{FirstName} {LastName}");
}

public sealed record PostalAddress
{
    private PostalAddress(string street, string houseNumber, string postalCode, string city, string? additionalInformation)
    {
        Street = street; HouseNumber = houseNumber; PostalCode = postalCode; City = city; AdditionalInformation = additionalInformation;
    }

    public string Street { get; }
    public string HouseNumber { get; }
    public string PostalCode { get; }
    public string City { get; }
    public string? AdditionalInformation { get; }

    public static PostalAddress Create(string? street, string? houseNumber, string? postalCode, string? city, string? additionalInformation) => new(
        PartyRules.Required(street, 200, "street"), PartyRules.Required(houseNumber, 30, "houseNumber"),
        PartyRules.Required(postalCode, 20, "postalCode"), PartyRules.Required(city, 200, "city"),
        PartyRules.Optional(additionalInformation, 250, "additionalInformation"));

    public string NormalizedValue => PartyRules.Normalize($"{Street}|{HouseNumber}|{PostalCode}|{City}|{AdditionalInformation}");
}

public static class PartyRules
{
    public static void ValidatePeriod(DateOnly validFromInclusive, DateOnly? validUntilExclusive)
    {
        if (validUntilExclusive.HasValue && validUntilExclusive <= validFromInclusive)
            throw new PartyValidationException("validUntilExclusive", "Das exklusive Ende muss nach dem Beginn liegen.");
    }

    public static string Required(string? value, int maximumLength, string field)
        => Optional(value, maximumLength, field) ?? throw new PartyValidationException(field, "Der Wert ist erforderlich.");

    public static string? Optional(string? value, int maximumLength, string field)
    {
        var clean = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (clean?.Length > maximumLength) throw new PartyValidationException(field, $"Der Wert darf höchstens {maximumLength} Zeichen enthalten.");
        return clean;
    }

    public static string Normalize(string value) => string.Join(' ', value.Normalize(NormalizationForm.FormKC)
        .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).ToUpperInvariant();
}

public sealed class PartyValidationException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}
