import { useState } from "react";
import {
  getPasswordStrength,
  getPasswordStrengthLabel,
  validatePassword,
} from "~/lib/security";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

/**
 * Example password input component with validation and strength indicator
 */
export function PasswordInput() {
  const [password, setPassword] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const validation = validatePassword(password);
  const strength = getPasswordStrength(password);
  const strengthLabel = getPasswordStrengthLabel(strength);

  const strengthColors = {
    0: "bg-red-500",
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-green-500",
    5: "bg-green-600",
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setPassword(e.target.value);
          setShowValidation(true);
        }}
        placeholder="Enter a secure password"
        className={validation.isValid ? "" : "border-red-500"}
      />

      {showValidation && password && (
        <>
          {/* Password strength indicator */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Strength:</span>
              <span className="font-medium">{strengthLabel}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-300 ${strengthColors[strength as keyof typeof strengthColors]}`}
                style={{ width: `${(strength / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Validation errors */}
          {!validation.isValid && (
            <ul className="space-y-1 text-sm text-red-600">
              {validation.errors.map((error) => (
                <li key={error} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
