using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CanteenManagement.API.Helpers
{
    /// <summary>
    /// Ensures all DateTime values are serialized with explicit ISO-8601 UTC ('Z') designator,
    /// enabling client browsers to accurately convert UTC timestamps to Indian Standard Time (IST).
    /// </summary>
    public class UtcDateTimeJsonConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String && DateTime.TryParse(reader.GetString(), out var date))
            {
                return DateTime.SpecifyKind(date, DateTimeKind.Utc);
            }
            return reader.GetDateTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            var utcValue = value.Kind == DateTimeKind.Utc 
                ? value 
                : DateTime.SpecifyKind(value, DateTimeKind.Utc);
            writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ssZ"));
        }
    }

    public class NullableUtcDateTimeJsonConverter : JsonConverter<DateTime?>
    {
        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            if (reader.TokenType == JsonTokenType.String && DateTime.TryParse(reader.GetString(), out var date))
            {
                return DateTime.SpecifyKind(date, DateTimeKind.Utc);
            }
            return reader.GetDateTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (!value.HasValue)
            {
                writer.WriteNullValue();
                return;
            }

            var utcValue = value.Value.Kind == DateTimeKind.Utc 
                ? value.Value 
                : DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
            writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ssZ"));
        }
    }
}
