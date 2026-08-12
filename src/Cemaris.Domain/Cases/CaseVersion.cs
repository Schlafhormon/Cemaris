namespace Cemaris.Domain.Cases;

public readonly record struct CaseVersion
{
    public const long InitialValue = 1;

    public CaseVersion(long value)
    {
        if (value < InitialValue)
        {
            throw new ArgumentOutOfRangeException(
                nameof(value),
                value,
                "Die Fallversion muss mindestens 1 betragen.");
        }

        Value = value;
    }

    public long Value { get; }

    public CaseVersion Next() => new(checked(Value + 1));
}
