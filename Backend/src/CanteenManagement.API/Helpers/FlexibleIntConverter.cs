using System.Text.Json;
using System.Text.Json.Serialization;

namespace CanteenManagement.API.Helpers
{
    public class FlexibleIntConverter : JsonConverter<int>
    {
        public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt32(out var intVal))
                {
                    return intVal;
                }
                if (reader.TryGetDouble(out var dblVal))
                {
                    return (int)Math.Round(dblVal);
                }
                return 0;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                if (string.IsNullOrWhiteSpace(stringValue)) return 0;

                // Try direct parse first
                if (int.TryParse(stringValue, out var directVal))
                {
                    return directVal;
                }

                // If string contains pattern like "canteen-001", "canteen-1", "cat-2", extract digits
                var digits = new string(stringValue.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(digits) && int.TryParse(digits, out var digitVal))
                {
                    return digitVal;
                }

                return 0;
            }

            if (reader.TokenType == JsonTokenType.Null)
            {
                return 0;
            }

            return 0;
        }

        public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
        {
            writer.WriteNumberValue(value);
        }
    }

    public class FlexibleNullableIntConverter : JsonConverter<int?>
    {
        public override int? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.Number)
            {
                if (reader.TryGetInt32(out var intVal))
                {
                    return intVal;
                }
                if (reader.TryGetDouble(out var dblVal))
                {
                    return (int)Math.Round(dblVal);
                }
                return null;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                if (string.IsNullOrWhiteSpace(stringValue) || stringValue.Equals("ALL", StringComparison.OrdinalIgnoreCase))
                {
                    return null;
                }

                if (int.TryParse(stringValue, out var directVal))
                {
                    return directVal;
                }

                var digits = new string(stringValue.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(digits) && int.TryParse(digits, out var digitVal))
                {
                    return digitVal;
                }

                return null;
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, int? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
            {
                writer.WriteNumberValue(value.Value);
            }
            else
            {
                writer.WriteNullValue();
            }
        }
    }
}
