using System.Text;
using Asp.Versioning;
using CanteenManagement.API.Data;
using CanteenManagement.API.Helpers;
using CanteenManagement.API.Repositories.Implementations.Auth;
using CanteenManagement.API.Repositories.Implementations.Categories;
using CanteenManagement.API.Repositories.Implementations.Dashboard;
using CanteenManagement.API.Repositories.Implementations.Feedback;
using CanteenManagement.API.Repositories.Implementations.Inventory;
using CanteenManagement.API.Repositories.Implementations.Menu;
using CanteenManagement.API.Repositories.Implementations.Orders;
using CanteenManagement.API.Repositories.Implementations.Outlets;
using CanteenManagement.API.Repositories.Implementations.Reports;
using CanteenManagement.API.Repositories.Implementations.Settings;
using CanteenManagement.API.Repositories.Implementations.Slots;
using CanteenManagement.API.Repositories.Interfaces.Auth;
using CanteenManagement.API.Repositories.Interfaces.Categories;
using CanteenManagement.API.Repositories.Interfaces.Dashboard;
using CanteenManagement.API.Repositories.Interfaces.Feedback;
using CanteenManagement.API.Repositories.Interfaces.Inventory;
using CanteenManagement.API.Repositories.Interfaces.Menu;
using CanteenManagement.API.Repositories.Interfaces.Orders;
using CanteenManagement.API.Repositories.Interfaces.Outlets;
using CanteenManagement.API.Repositories.Interfaces.Reports;
using CanteenManagement.API.Repositories.Interfaces.Settings;
using CanteenManagement.API.Repositories.Interfaces.Slots;
using CanteenManagement.API.Services.Implementations.Auth;
using CanteenManagement.API.Services.Implementations.Categories;
using CanteenManagement.API.Services.Implementations.Common;
using CanteenManagement.API.Services.Implementations.Dashboard;
using CanteenManagement.API.Services.Implementations.Feedback;
using CanteenManagement.API.Services.Implementations.Inventory;
using CanteenManagement.API.Services.Implementations.Menu;
using CanteenManagement.API.Services.Implementations.Orders;
using CanteenManagement.API.Services.Implementations.Outlets;
using CanteenManagement.API.Services.Implementations.Reports;
using CanteenManagement.API.Services.Implementations.Settings;
using CanteenManagement.API.Services.Implementations.Slots;
using CanteenManagement.API.Services.Interfaces.Auth;
using CanteenManagement.API.Services.Interfaces.Categories;
using CanteenManagement.API.Services.Interfaces.Common;
using CanteenManagement.API.Services.Interfaces.Dashboard;
using CanteenManagement.API.Services.Interfaces.Feedback;
using CanteenManagement.API.Services.Interfaces.Inventory;
using CanteenManagement.API.Services.Interfaces.Menu;
using CanteenManagement.API.Services.Interfaces.Orders;
using CanteenManagement.API.Services.Interfaces.Outlets;
using CanteenManagement.API.Services.Interfaces.Reports;
using CanteenManagement.API.Services.Interfaces.Settings;
using CanteenManagement.API.Services.Interfaces.Slots;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Connection String & EF Core MySQL DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=srv1061.hstgr.io;Port=3306;Database=u819242402_canteendb;User=u819242402_canteendbuser;Password=Pirnav@2026;SslMode=None;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    });
});

// 2. Configure Dapper Connection Factory (Dual ORM Pattern)
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();

// 3. Configure JWT Bearer Authentication & Authorization
var jwtKey = builder.Configuration["Jwt:Key"] ?? "CanteenManagementUltraSecureJwtSecretSigningKey2026!#";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CanteenManagementAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CanteenManagementClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireStaffOrAdmin", policy => policy.RequireRole("Admin", "Staff"));
});

// 4. Register Services & Repositories (N-Tier Clean Architecture)
builder.Services.AddScoped<IJwtTokenHelper, JwtTokenHelper>();
builder.Services.AddScoped<IAuditLoggingService, AuditLoggingService>();

// Auth
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Outlets
builder.Services.AddScoped<ICanteenOutletRepository, CanteenOutletRepository>();
builder.Services.AddScoped<ICanteenOutletService, CanteenOutletService>();

// Categories
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICategoryService, CategoryService>();

// Menu
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IMenuService, MenuService>();

// Slots
builder.Services.AddScoped<ISlotRepository, SlotRepository>();
builder.Services.AddScoped<ISlotService, SlotService>();

// Orders
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

// Dashboard (Dapper)
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Inventory
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IInventoryService, InventoryService>();

// Feedback
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();

// Reports (Dapper)
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IReportService, ReportService>();

// Settings
builder.Services.AddScoped<ISettingsRepository, SettingsRepository>();
builder.Services.AddScoped<ISettingsService, SettingsService>();

// 5. Add Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 6. Configure API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// 7. Configure CORS ("AllowFrontend")
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 8. Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Canteen Management System - API",
        Version = "v1.0",
        Description = "N-Tier Modular .NET 8 Web API with Dual ORM (EF Core + Dapper), JWT Auth & Multi-Project integration."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and your valid JWT token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 9. Initialize Database Schema and Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    await DatabaseInitializer.InitializeAsync(connectionString, logger);
}

// 10. Configure Middleware Pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Canteen API v1.0");
    c.RoutePrefix = string.Empty; // Swagger UI served at root URL
});

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    Status = "Healthy",
    Service = "CanteenManagement.API",
    Framework = ".NET 8.0",
    Timestamp = DateTime.UtcNow
}));

app.Run();
