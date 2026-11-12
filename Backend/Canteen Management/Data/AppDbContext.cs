using CanteenManagement.API.Helpers;
using CanteenManagement.API.Models.Auth;
using CanteenManagement.API.Models.Categories;
using CanteenManagement.API.Models.Common;
using CanteenManagement.API.Models.Feedback;
using CanteenManagement.API.Models.Inventory;
using CanteenManagement.API.Models.Menu;
using CanteenManagement.API.Models.Orders;
using CanteenManagement.API.Models.Outlets;
using CanteenManagement.API.Models.Settings;
using CanteenManagement.API.Models.Slots;
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
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<MenuItem> MenuItems => Set<MenuItem>();
        public DbSet<MenuItemVariant> MenuItemVariants => Set<MenuItemVariant>();
        public DbSet<MenuItemAddon> MenuItemAddons => Set<MenuItemAddon>();
        public DbSet<Slot> Slots => Set<Slot>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<OrderTimeline> OrderTimelines => Set<OrderTimeline>();
        public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
        public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
        public DbSet<FeedbackTicket> FeedbackTickets => Set<FeedbackTicket>();
        public DbSet<FeedbackHistory> FeedbackHistories => Set<FeedbackHistory>();
        public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
        public DbSet<DsarRequest> DsarRequests => Set<DsarRequest>();

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

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasIndex(c => new { c.InstitutionId, c.Name }).IsUnique();
            });

            // MenuItem configuration
            modelBuilder.Entity<MenuItem>(entity =>
            {
                entity.HasIndex(m => new { m.InstitutionId, m.Code }).IsUnique();
                entity.HasOne(m => m.Outlet)
                      .WithMany()
                      .HasForeignKey(m => m.OutletId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(m => m.Category)
                      .WithMany(c => c.MenuItems)
                      .HasForeignKey(m => m.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Slot configuration
            modelBuilder.Entity<Slot>(entity =>
            {
                entity.HasIndex(s => new { s.OutletId, s.Date, s.StartTime });
            });

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasIndex(o => o.Token);
                entity.HasIndex(o => o.Status);
                entity.HasIndex(o => o.OrderDate);
            });

            // InventoryItem configuration
            modelBuilder.Entity<InventoryItem>(entity =>
            {
                entity.HasIndex(i => new { i.OutletId, i.IngredientName });
            });
        }
    }
}
