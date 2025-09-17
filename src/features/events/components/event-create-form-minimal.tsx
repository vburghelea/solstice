import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function EventCreateFormMinimal() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Event (Test)</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is a minimal test form to isolate the rendering issue.</p>
        <Button>Test Button</Button>
      </CardContent>
    </Card>
  );
}
