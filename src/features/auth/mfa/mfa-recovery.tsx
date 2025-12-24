import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { auth } from "~/lib/auth-client";

export function MfaRecoveryCard() {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await auth.twoFactor.verifyBackupCode({ code });
      if (result?.error) {
        throw new Error(result.error.message || "Invalid backup code");
      }
    } catch (error) {
      setErrorMessage((error as Error)?.message || "Invalid backup code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Use Backup Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value.trim())}
          placeholder="Enter backup code"
        />
        <Button onClick={handleVerify} disabled={isLoading || !code}>
          {isLoading ? "Verifying..." : "Verify backup code"}
        </Button>
        {errorMessage && <p className="text-destructive text-sm">{errorMessage}</p>}
      </CardContent>
    </Card>
  );
}
