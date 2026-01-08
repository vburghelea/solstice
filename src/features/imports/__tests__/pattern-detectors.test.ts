import { describe, expect, it } from "vitest";
import {
  analyzePatterns,
  calculateConfidence,
  detectBestPattern,
  getHeaderHint,
  isBoolean,
  isCurrency,
  isDateLike,
  isEmail,
  isEuDate,
  isIsoDate,
  isNumber,
  isPercentage,
  isPhone,
  isPostalCode,
  isUrl,
  isUsDate,
  isUuid,
} from "../pattern-detectors";

describe("pattern-detectors", () => {
  describe("isEmail", () => {
    it("detects valid emails", () => {
      expect(isEmail("test@example.com")).toBe(true);
      expect(isEmail("user.name@domain.org")).toBe(true);
      expect(isEmail("a@b.co")).toBe(true);
      expect(isEmail(" test@example.com ")).toBe(true); // trims whitespace
    });

    it("rejects invalid emails", () => {
      expect(isEmail("not-an-email")).toBe(false);
      expect(isEmail("@example.com")).toBe(false);
      expect(isEmail("test@")).toBe(false);
      expect(isEmail("test@domain")).toBe(false);
      expect(isEmail("")).toBe(false);
    });
  });

  describe("isIsoDate", () => {
    it("detects ISO dates", () => {
      expect(isIsoDate("2024-01-15")).toBe(true);
      expect(isIsoDate("2000-12-31")).toBe(true);
      expect(isIsoDate(" 2024-01-15 ")).toBe(true); // trims whitespace
    });

    it("rejects non-ISO dates", () => {
      expect(isIsoDate("01/15/2024")).toBe(false);
      expect(isIsoDate("15.01.2024")).toBe(false);
      expect(isIsoDate("2024/01/15")).toBe(false);
      expect(isIsoDate("not-a-date")).toBe(false);
    });
  });

  describe("isUsDate", () => {
    it("detects US dates", () => {
      expect(isUsDate("01/15/2024")).toBe(true);
      expect(isUsDate("1/5/2024")).toBe(true);
      expect(isUsDate("12/31/2000")).toBe(true);
    });

    it("rejects non-US dates", () => {
      expect(isUsDate("2024-01-15")).toBe(false);
      expect(isUsDate("15.01.2024")).toBe(false);
      expect(isUsDate("not-a-date")).toBe(false);
    });
  });

  describe("isEuDate", () => {
    it("detects EU dates", () => {
      expect(isEuDate("15.01.2024")).toBe(true);
      expect(isEuDate("5.1.2024")).toBe(true);
      expect(isEuDate("31.12.2000")).toBe(true);
    });

    it("rejects non-EU dates", () => {
      expect(isEuDate("2024-01-15")).toBe(false);
      expect(isEuDate("01/15/2024")).toBe(false);
      expect(isEuDate("not-a-date")).toBe(false);
    });
  });

  describe("isDateLike", () => {
    it("detects any date format", () => {
      expect(isDateLike("2024-01-15")).toBe(true);
      expect(isDateLike("01/15/2024")).toBe(true);
      expect(isDateLike("15.01.2024")).toBe(true);
    });

    it("rejects non-dates", () => {
      expect(isDateLike("not-a-date")).toBe(false);
      expect(isDateLike("12345")).toBe(false);
    });
  });

  describe("isNumber", () => {
    it("detects numbers", () => {
      expect(isNumber("123")).toBe(true);
      expect(isNumber("123.45")).toBe(true);
      expect(isNumber("-123.45")).toBe(true);
      expect(isNumber("1,234.56")).toBe(true);
      expect(isNumber("1,234,567")).toBe(true);
      expect(isNumber(" 123 ")).toBe(true); // trims whitespace
    });

    it("rejects non-numbers", () => {
      expect(isNumber("not-a-number")).toBe(false);
      expect(isNumber("$123")).toBe(false);
      expect(isNumber("123%")).toBe(false);
    });
  });

  describe("isBoolean", () => {
    it("detects boolean values", () => {
      expect(isBoolean("true")).toBe(true);
      expect(isBoolean("false")).toBe(true);
      expect(isBoolean("TRUE")).toBe(true);
      expect(isBoolean("yes")).toBe(true);
      expect(isBoolean("NO")).toBe(true);
      expect(isBoolean("y")).toBe(true);
      expect(isBoolean("n")).toBe(true);
      expect(isBoolean("1")).toBe(true);
      expect(isBoolean("0")).toBe(true);
      expect(isBoolean("on")).toBe(true);
      expect(isBoolean("off")).toBe(true);
      expect(isBoolean("enabled")).toBe(true);
      expect(isBoolean("disabled")).toBe(true);
    });

    it("rejects non-booleans", () => {
      expect(isBoolean("maybe")).toBe(false);
      expect(isBoolean("2")).toBe(false);
      expect(isBoolean("")).toBe(false);
    });
  });

  describe("isPhone", () => {
    it("detects phone numbers", () => {
      expect(isPhone("123-456-7890")).toBe(true);
      expect(isPhone("(123) 456-7890")).toBe(true);
      expect(isPhone("+1 123-456-7890")).toBe(true);
      expect(isPhone("123.456.7890")).toBe(true);
      expect(isPhone("1234567890")).toBe(true);
    });

    it("rejects non-phone numbers", () => {
      expect(isPhone("123")).toBe(false); // too short
      expect(isPhone("not-a-phone")).toBe(false);
      expect(isPhone("")).toBe(false);
    });
  });

  describe("isCurrency", () => {
    it("detects currency values", () => {
      expect(isCurrency("$123.45")).toBe(true);
      expect(isCurrency("$1,234.56")).toBe(true);
      expect(isCurrency("123.45")).toBe(true);
      expect(isCurrency("-$123.45")).toBe(false); // negative with symbol at start
      expect(isCurrency("$-123.45")).toBe(true);
    });

    it("detects various currency symbols", () => {
      expect(isCurrency("$100")).toBe(true);
      expect(isCurrency("100")).toBe(true);
      expect(isCurrency("1,234")).toBe(true);
    });

    it("rejects non-currency", () => {
      expect(isCurrency("not-currency")).toBe(false);
      expect(isCurrency("123.456")).toBe(false); // too many decimal places
    });
  });

  describe("isPercentage", () => {
    it("detects percentages", () => {
      expect(isPercentage("75%")).toBe(true);
      expect(isPercentage("0.75")).toBe(true);
      expect(isPercentage("-5%")).toBe(true);
      expect(isPercentage("100%")).toBe(true);
      expect(isPercentage("0.5")).toBe(true);
    });

    it("rejects non-percentages", () => {
      expect(isPercentage("not-percent")).toBe(false);
      expect(isPercentage("75")).toBe(false); // No % sign and not decimal
    });
  });

  describe("isUrl", () => {
    it("detects URLs", () => {
      expect(isUrl("https://example.com")).toBe(true);
      expect(isUrl("http://example.com/path")).toBe(true);
      expect(isUrl("https://sub.domain.com/path?query=1")).toBe(true);
      expect(isUrl(" HTTPS://EXAMPLE.COM ")).toBe(true); // case insensitive, trims
    });

    it("rejects non-URLs", () => {
      expect(isUrl("example.com")).toBe(false); // no protocol
      expect(isUrl("ftp://example.com")).toBe(false); // wrong protocol
      expect(isUrl("not-a-url")).toBe(false);
    });
  });

  describe("isPostalCode", () => {
    describe("US postal codes", () => {
      it("detects 5-digit zip codes", () => {
        expect(isPostalCode("12345")).toBe(true);
        expect(isPostalCode("90210")).toBe(true);
      });

      it("detects 9-digit zip codes", () => {
        expect(isPostalCode("12345-6789")).toBe(true);
      });
    });

    describe("Canadian postal codes", () => {
      it("detects with space", () => {
        expect(isPostalCode("A1A 1A1")).toBe(true);
        expect(isPostalCode("V6B 2G9")).toBe(true);
      });

      it("detects without space", () => {
        expect(isPostalCode("A1A1A1")).toBe(true);
      });

      it("is case insensitive", () => {
        expect(isPostalCode("a1a 1a1")).toBe(true);
      });
    });

    it("rejects non-postal codes", () => {
      expect(isPostalCode("1234")).toBe(false); // too short
      expect(isPostalCode("not-postal")).toBe(false);
    });
  });

  describe("isUuid", () => {
    it("detects valid UUIDs", () => {
      expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
      expect(isUuid(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe(true); // trims
    });

    it("is case insensitive", () => {
      expect(isUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    });

    it("rejects invalid UUIDs", () => {
      expect(isUuid("not-a-uuid")).toBe(false);
      expect(isUuid("550e8400-e29b-41d4-a716")).toBe(false); // incomplete
      expect(isUuid("")).toBe(false);
    });
  });

  describe("analyzePatterns", () => {
    it("returns ratios for all pattern types", () => {
      const values = ["test@example.com", "user@domain.org", "not-email"];
      const result = analyzePatterns(values);

      expect(result.email).toBeCloseTo(2 / 3);
      expect(result.number).toBe(0);
    });

    it("handles empty arrays", () => {
      const result = analyzePatterns([]);

      expect(result.email).toBe(0);
      expect(result.number).toBe(0);
    });

    it("ignores empty strings", () => {
      const values = ["test@example.com", "", "   ", "user@domain.org"];
      const result = analyzePatterns(values);

      expect(result.email).toBe(1); // 2/2 non-empty are emails
    });
  });

  describe("detectBestPattern", () => {
    it("returns highest matching pattern above threshold", () => {
      const values = ["test@example.com", "user@domain.org", "admin@site.net"];
      const result = detectBestPattern(values);

      expect(result).not.toBeNull();
      expect(result?.pattern).toBe("email");
      expect(result?.ratio).toBe(1);
    });

    it("returns null when no pattern meets threshold", () => {
      const values = ["random", "text", "values"];
      const result = detectBestPattern(values);

      expect(result).toBeNull();
    });

    it("respects custom threshold", () => {
      const values = ["test@example.com", "not-email", "random"];
      const result = detectBestPattern(values, 0.5);

      expect(result).toBeNull(); // 1/3 = 0.33 < 0.5
    });
  });

  describe("getHeaderHint", () => {
    it("detects email hints", () => {
      expect(getHeaderHint("Email")).toBe("email");
      expect(getHeaderHint("email_address")).toBe("email");
      expect(getHeaderHint("E-Mail")).toBe("email");
    });

    it("detects phone hints", () => {
      expect(getHeaderHint("Phone")).toBe("phone");
      expect(getHeaderHint("phone_number")).toBe("phone");
      expect(getHeaderHint("Mobile")).toBe("phone");
      expect(getHeaderHint("Tel")).toBe("phone");
    });

    it("detects date hints", () => {
      expect(getHeaderHint("Date")).toBe("dateLike");
      expect(getHeaderHint("CreatedTime")).toBe("dateLike");
      expect(getHeaderHint("DateOfBirth")).toBe("dateLike");
      expect(getHeaderHint("DOB")).toBe("dateLike");
    });

    it("detects URL hints", () => {
      expect(getHeaderHint("URL")).toBe("url");
      expect(getHeaderHint("Website")).toBe("url");
      expect(getHeaderHint("Link")).toBe("url");
    });

    it("detects postal code hints", () => {
      expect(getHeaderHint("ZipCode")).toBe("postalCode");
      expect(getHeaderHint("Postal Code")).toBe("postalCode");
    });

    it("detects percentage hints", () => {
      expect(getHeaderHint("Percentage")).toBe("percentage");
      expect(getHeaderHint("Rate")).toBe("percentage");
    });

    it("detects currency hints", () => {
      expect(getHeaderHint("Price")).toBe("currency");
      expect(getHeaderHint("Cost")).toBe("currency");
      expect(getHeaderHint("Amount")).toBe("currency");
    });

    it("detects UUID hints", () => {
      expect(getHeaderHint("UUID")).toBe("uuid");
      expect(getHeaderHint("GUID")).toBe("uuid");
      expect(getHeaderHint("user_id")).toBe("uuid");
      expect(getHeaderHint("id")).toBe("uuid");
    });

    it("returns null for unrecognized headers", () => {
      expect(getHeaderHint("Name")).toBeNull();
      expect(getHeaderHint("Description")).toBeNull();
      expect(getHeaderHint("Random")).toBeNull();
    });
  });

  describe("calculateConfidence", () => {
    it("calculates base confidence from pattern match ratio", () => {
      const result = calculateConfidence({
        patternMatchRatio: 1.0,
        headerHintMatch: false,
        conflictingPatterns: 0,
        sampleSize: 10,
      });

      // 1.0 * 0.6 = 0.6
      expect(result).toBeCloseTo(0.6);
    });

    it("adds bonus for header hint match", () => {
      const result = calculateConfidence({
        patternMatchRatio: 1.0,
        headerHintMatch: true,
        conflictingPatterns: 0,
        sampleSize: 10,
      });

      // 1.0 * 0.6 + 0.2 = 0.8
      expect(result).toBeCloseTo(0.8);
    });

    it("applies penalty for conflicting patterns", () => {
      const result = calculateConfidence({
        patternMatchRatio: 1.0,
        headerHintMatch: false,
        conflictingPatterns: 2,
        sampleSize: 10,
      });

      // 1.0 * 0.6 - 0.15 = 0.45
      expect(result).toBeCloseTo(0.45);
    });

    it("applies penalty for small sample size", () => {
      const result = calculateConfidence({
        patternMatchRatio: 1.0,
        headerHintMatch: false,
        conflictingPatterns: 0,
        sampleSize: 3,
      });

      // 1.0 * 0.6 - 0.1 = 0.5
      expect(result).toBeCloseTo(0.5);
    });

    it("adds bonus for large sample size", () => {
      const result = calculateConfidence({
        patternMatchRatio: 1.0,
        headerHintMatch: false,
        conflictingPatterns: 0,
        sampleSize: 50,
      });

      // 1.0 * 0.6 + 0.05 = 0.65
      expect(result).toBeCloseTo(0.65);
    });

    it("combines all factors", () => {
      const result = calculateConfidence({
        patternMatchRatio: 0.9,
        headerHintMatch: true,
        conflictingPatterns: 0,
        sampleSize: 25,
      });

      // 0.9 * 0.6 + 0.2 + 0.05 = 0.79
      expect(result).toBeCloseTo(0.79);
    });

    it("clamps to 0-1 range", () => {
      const high = calculateConfidence({
        patternMatchRatio: 1.0,
        headerHintMatch: true,
        conflictingPatterns: 0,
        sampleSize: 100,
      });
      expect(high).toBeLessThanOrEqual(1);

      const low = calculateConfidence({
        patternMatchRatio: 0.1,
        headerHintMatch: false,
        conflictingPatterns: 5,
        sampleSize: 2,
      });
      expect(low).toBeGreaterThanOrEqual(0);
    });
  });
});
