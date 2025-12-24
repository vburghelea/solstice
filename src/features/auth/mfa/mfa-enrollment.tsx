import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth-client";
import { markMfaEnrolled } from "./mfa.mutations";

export function MfaEnrollmentCard() {
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [backupCodeError, setBackupCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleEnable = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await auth.twoFactor.enable({ password });
      if (result?.error) {
        throw new Error(result.error.message || "Failed to enable MFA");
      }
      setTotpUri(result?.data?.totpURI ?? "");
      setBackupCodes(result?.data?.backupCodes ?? []);
    } catch (error) {
      setErrorMessage((error as Error)?.message || "Failed to enable MFA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError("");
    try {
      const result = await auth.twoFactor.verifyTotp({ code: verificationCode });
      if (result?.error) {
        throw new Error(result.error.message || "Invalid verification code");
      }
      await markMfaEnrolled();
      setIsVerified(true);
    } catch (error) {
      setVerifyError((error as Error)?.message || "Failed to verify MFA");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!password) {
      setBackupCodeError("Password required to regenerate backup codes.");
      return;
    }

    setIsRegenerating(true);
    setBackupCodeError("");
    try {
      const result = await auth.twoFactor.generateBackupCodes({ password });
      if (result?.error) {
        throw new Error(result.error.message || "Failed to regenerate backup codes");
      }
      setBackupCodes(result?.data?.backupCodes ?? []);
    } catch (error) {
      setBackupCodeError(
        (error as Error)?.message || "Failed to regenerate backup codes",
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="mfa-password">
            Confirm your password
          </label>
          <Input
            id="mfa-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />
        </div>
        <Button onClick={handleEnable} disabled={isLoading || !password}>
          {isLoading ? "Enabling..." : "Enable MFA"}
        </Button>

        {totpUri && (
          <div className="space-y-3 rounded-md border border-gray-200 p-3 text-sm">
            <div>
              <p className="font-semibold">Scan QR code</p>
              <p className="text-muted-foreground text-xs">
                Use your authenticator app to scan this code.
              </p>
            </div>
            <div className="w-fit rounded-md border bg-white p-3">
              <QRCode value={totpUri} size={160} />
            </div>
            <div>
              <p className="font-semibold">TOTP URI</p>
              <p className="text-muted-foreground text-xs break-all">{totpUri}</p>
            </div>
          </div>
        )}

        {backupCodes.length > 0 && (
          <div className="space-y-2 rounded-md border border-gray-200 p-3 text-sm">
            <p className="font-semibold">Backup codes</p>
            <p className="text-muted-foreground text-xs">
              Save these codes now. Each code can be used once.
            </p>
            <ul className="text-muted-foreground list-inside list-disc text-xs">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerateBackupCodes}
              disabled={isRegenerating}
            >
              {isRegenerating ? "Regenerating..." : "Regenerate codes"}
            </Button>
            {backupCodeError ? (
              <p className="text-destructive text-xs">{backupCodeError}</p>
            ) : null}
          </div>
        )}

        {totpUri ? (
          <div className="space-y-3">
            <label className="text-sm font-medium" htmlFor="mfa-verify">
              Enter the code from your authenticator app
            </label>
            <Input
              id="mfa-verify"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.trim())}
              placeholder="123456"
              inputMode="numeric"
            />
            <Button
              type="button"
              onClick={handleVerify}
              disabled={!verificationCode || isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify MFA"}
            </Button>
            {isVerified ? (
              <p className="text-sm text-emerald-600">MFA verified and enabled.</p>
            ) : null}
            {verifyError ? (
              <p className="text-destructive text-sm">{verifyError}</p>
            ) : null}
          </div>
        ) : null}

        {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
      </CardContent>
    </Card>
  );
}
