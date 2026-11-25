using System;

namespace CanteenManagement.API.Helpers
{
    /// <summary>
    /// Utility for Indian Standard Time (IST, UTC+05:30).
    /// Provides consistent, cross-platform timezone conversions across Windows and Linux.
    /// </summary>
    public static class IndianTime
    {
        public static readonly TimeZoneInfo Zone = ResolveIndianTimeZone();

        private static TimeZoneInfo ResolveIndianTimeZone()
        {
            // Windows ID: "India Standard Time"
            // Linux/macOS/IANA ID: "Asia/Kolkata" or "Asia/Calcutta"
            try
            {
                if (TimeZoneInfo.TryFindSystemTimeZoneById("India Standard Time", out var tzWin))
                    return tzWin;
            }
            catch { }

            try
            {
                if (TimeZoneInfo.TryFindSystemTimeZoneById("Asia/Kolkata", out var tzIana))
                    return tzIana;
            }
            catch { }

            try
            {
                if (TimeZoneInfo.TryFindSystemTimeZoneById("Asia/Calcutta", out var tzAlt))
                    return tzAlt;
            }
            catch { }

            // Fallback: Fixed UTC+05:30 offset
            return TimeZoneInfo.CreateCustomTimeZone("IST", TimeSpan.FromMinutes(330), "India Standard Time", "India Standard Time");
        }

        /// <summary>
        /// Current date and time in Indian Standard Time (IST, UTC+05:30).
        /// </summary>
        public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zone);

        /// <summary>
        /// Today's date at midnight (00:00:00) in Indian Standard Time.
        /// </summary>
        public static DateTime Today => Now.Date;

        /// <summary>
        /// Converts a UTC DateTime to Indian Standard Time (IST).
        /// </summary>
        public static DateTime ToIst(DateTime utcDateTime)
        {
            var utc = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
            return TimeZoneInfo.ConvertTimeFromUtc(utc, Zone);
        }

        /// <summary>
        /// Converts an IST DateTime to UTC.
        /// </summary>
        public static DateTime ToUtc(DateTime istDateTime)
        {
            return TimeZoneInfo.ConvertTimeToUtc(istDateTime, Zone);
        }
    }
}
