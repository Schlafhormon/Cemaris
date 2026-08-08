using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.Persistence;

/// <summary>
/// Technical EF Core entry point. Entity mappings are intentionally absent until the domain model is validated.
/// </summary>
public sealed class CemarisDbContext(DbContextOptions<CemarisDbContext> options) : DbContext(options);
