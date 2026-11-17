using CanteenManagement.API.Services.Interfaces.Menu;

namespace CanteenManagement.API.Services.Background
{
    /// <summary>
    /// Background service that automatically resets menu items' remaining capacity to their full daily capacity
    /// at midnight (00:00:00) every day, ensuring daily quotas are fresh for the new operational day.
    /// Also performs an immediate auto-check on startup.
    /// </summary>
    public class DailyMenuCapacityResetWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DailyMenuCapacityResetWorker> _logger;

        public DailyMenuCapacityResetWorker(IServiceProvider serviceProvider, ILogger<DailyMenuCapacityResetWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyMenuCapacityResetWorker initialized and running.");

            // 1. Initial startup check: reset if server booted up on a new day
            try
            {
                await DoCapacityResetAsync("System-Startup");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during startup daily capacity reset check.");
            }

            // 2. Loop until cancellation: sleep until next midnight
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now; // local time (IST)
                    var nextMidnight = now.Date.AddDays(1); // exactly 00:00:00 tomorrow
                    var delay = nextMidnight - now;

                    // Add a tiny buffer (e.g. 2 seconds) so we are securely past midnight
                    delay = delay.Add(TimeSpan.FromSeconds(2));

                    _logger.LogInformation("DailyMenuCapacityResetWorker scheduled next midnight reset in {Hours} hours and {Minutes} minutes (at {NextMidnight}).",
                        (int)delay.TotalHours, delay.Minutes, nextMidnight);

                    await Task.Delay(delay, stoppingToken);

                    // Execute reset
                    await DoCapacityResetAsync("System-Midnight-Cron");
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error in DailyMenuCapacityResetWorker. Retrying in 10 minutes.");
                    await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
                }
            }

            _logger.LogInformation("DailyMenuCapacityResetWorker is stopping.");
        }

        private async Task DoCapacityResetAsync(string trigger)
        {
            using var scope = _serviceProvider.CreateScope();
            var menuService = scope.ServiceProvider.GetRequiredService<IMenuService>();

            // Institution 0 = all institutions
            int resetCount = await menuService.ResetDailyCapacityAsync(0, trigger, force: false);
            if (resetCount > 0)
            {
                _logger.LogInformation("DailyMenuCapacityResetWorker [{Trigger}]: Successfully reset capacity for {Count} menu items.", trigger, resetCount);
            }
            else
            {
                _logger.LogInformation("DailyMenuCapacityResetWorker [{Trigger}]: Capacities already up-to-date for today.", trigger);
            }
        }
    }
}
