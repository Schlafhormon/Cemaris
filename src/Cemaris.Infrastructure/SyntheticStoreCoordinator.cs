namespace Cemaris.Infrastructure;

public sealed class SyntheticStoreCoordinator
{
    internal object Gate { get; } = new();
}
