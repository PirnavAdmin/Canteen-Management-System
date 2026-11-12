using CanteenManagement.API.Helpers;
using CanteenManagement.API.Models.Auth;
using CanteenManagement.API.Models.Common;
using CanteenManagement.API.Models.Outlets;
using Microsoft.EntityFrameworkCore;

namespace CanteenManagement.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<CanteenOutlet> CanteenOutlets => Set<CanteenOutlet>();
        public DbSet<CanteenOutletSetting> CanteenOutletSettings => Set<CanteenOutletSetting>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => new { u.InstitutionId, u.Username }).IsUnique();
                entity.HasIndex(u => new { u.InstitutionId, u.Email }).IsUnique();
                entity.Property(u => u.Role).HasDefaultValue("Student");
                entity.Property(u => u.IsActive).HasDefaultValue(true);
            });

            // CanteenOutlet configuration
            modelBuilder.Entity<CanteenOutlet>(entity =>
            {
                entity.HasIndex(o => new { o.InstitutionId, o.Code }).IsUnique();
                entity.HasOne(o => o.Settings)
                      .WithOne(s => s.Outlet)
                      .HasForeignKey<CanteenOutletSetting>(s => s.OutletId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed initial admin user and default outlet
            var adminPasswordHash = PasswordHasher.HashPassword("Admin@123");
            var studentPasswordHash = PasswordHasher.HashPassword("Student@123");
            var staffPasswordHash = PasswordHasher.HashPassword("Staff@123");

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    InstitutionId = 1,
                    Username = "admin",
                    Email = "admin@canteen.edu",
                    PasswordHash = adminPasswordHash,
                    FullName = "Mrs. Sunitha (Canteen Admin)",
                    Role = "Admin",
                    PhoneNumber = "+91 98765 43210",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    UserId = 2,
                    InstitutionId = 1,
                    Username = "staff",
                    Email = "ravi.staff@canteen.edu",
                    PasswordHash = staffPasswordHash,
                    FullName = "Ravi (Kitchen & Counter Staff)",
                    Role = "Staff",
                    PhoneNumber = "+91 98765 43211",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new User
                {
                    UserId = 3,
                    InstitutionId = 1,
                    Username = "aarav",
                    Email = "aarav.student@git.edu",
                    PasswordHash = studentPasswordHash,
                    FullName = "Aarav (B.Tech 2nd Year)",
                    Role = "Student",
                    PhoneNumber = "+91 98765 43212",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<CanteenOutlet>().HasData(
                new CanteenOutlet
                {
                    OutletId = 1,
                    InstitutionId = 1,
                    Code = "MC-01",
                    Name = "Main Canteen",
                    Location = "Campus Central Building, Ground Floor",
                    OpenTime = "08:00",
                    CloseTime = "16:30",
                    FssaiLicenseNo = "10022044000123",
                    ContactNumber = "+91 40 2345 6789",
                    Status = "Active",
                    IsOrderAcceptanceEnabled = true,
                    WorkingDays = "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
                    AdminContactJson = "{\"name\":\"Mrs. Sunitha\",\"email\":\"admin@canteen.edu\",\"phone\":\"+91 98765 43210\"}",
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            modelBuilder.Entity<CanteenOutletSetting>().HasData(
                new CanteenOutletSetting
                {
                    SettingId = 1,
                    OutletId = 1,
                    AutoExpireUnpaidMinutes = 10,
                    PickupHoldMinutes = 30,
                    CancellationPolicy = "UntilAccepted",
                    AllowUpi = true,
                    AllowCards = true,
                    AllowWallet = true,
                    AllowCash = true,
                    UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            ApplyAuditTimestamps();
            return base.SaveChanges();
        }

        private void ApplyAuditTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is User || e.Entity is CanteenOutlet);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Property("CreatedAt").CurrentValue == null || (DateTime)entry.Property("CreatedAt").CurrentValue! == default)
                    {
                        entry.Property("CreatedAt").CurrentValue = DateTime.UtcNow;
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
                }
            }
        }
    }
}

