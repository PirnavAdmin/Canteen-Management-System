using Asp.Versioning;
using CanteenManagement.API.Data;
using CanteenManagement.API.Middleware;
using CanteenManagement.API.Repositories.Implementations;
using CanteenManagement.API.Repositories.Interfaces;
using CanteenManagement.API.Services.Implementations;
using CanteenManagement.API.Services.Interfaces;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 2. Add API Versioning
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

// 3. Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Canteen Management System - API",
        Version = "v1.0",
        Description = "Integrated Canteen & Food Ordering API for SMS and CMS portals. Includes Categories & Outlets modules.",
        Contact = new OpenApiContact
        {
            Name = "Engineering Team",
            Email = "support@college.edu"
        }
    });

    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// 4. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 5. Dependency Injection Registrations (Dapper + SPs Architecture)
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<ICanteenCategoryRepository, CanteenCategoryRepository>();
builder.Services.AddScoped<ICanteenCategoryService, CanteenCategoryService>();

var app = builder.Build();

// Global Exception Handler Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure Swagger for API documentation & testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Canteen API v1.0");
    c.RoutePrefix = string.Empty; // Serve Swagger at root URL (e.g. http://localhost:5000/)
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { Status = "Healthy", Service = "CanteenManagement.API", Timestamp = DateTime.UtcNow }));

app.Run();
