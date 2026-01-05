import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useOrgContext } from "~/features/organizations/org-context";
import { helpFaqs, helpGuides, type HelpAudience } from "../help-content";

const normalize = (value: string) => value.toLowerCase();

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  reporter: "Reporter",
  viewer: "Viewer",
  member: "Member",
};

export function HelpCenter() {
  const { activeOrganizationId, isLoading, organizationRole } = useOrgContext();
  const [search, setSearch] = useState("");

  const matchesAudience = (audience?: HelpAudience) => {
    if (!audience) return true;
    if (audience.requiresOrganization && !activeOrganizationId) return false;
    if (audience.roles && audience.roles.length > 0) {
      if (!organizationRole) return false;
      return audience.roles.includes(organizationRole);
    }
    return true;
  };

  const formatAudienceLabel = (audience?: HelpAudience) => {
    if (!audience?.roles || audience.roles.length === 0) return null;
    const labels = audience.roles.map((role) => roleLabels[role] ?? role);
    return `For ${labels.join(", ")}`;
  };

  const visibleGuides = useMemo(
    () => helpGuides.filter((guide) => matchesAudience(guide.audience)),
    [activeOrganizationId, organizationRole],
  );

  const visibleFaqs = useMemo(
    () => helpFaqs.filter((faq) => matchesAudience(faq.audience)),
    [activeOrganizationId, organizationRole],
  );

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return visibleGuides;
    const term = normalize(search.trim());
    return visibleGuides.filter((guide) =>
      [guide.title, guide.summary, guide.category, ...guide.sections.map((s) => s.title)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search, visibleGuides]);

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return visibleFaqs;
    const term = normalize(search.trim());
    return visibleFaqs.filter((faq) =>
      [faq.question, faq.answer, faq.category].join(" ").toLowerCase().includes(term),
    );
  }, [search, visibleFaqs]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Help Center</h1>
          {isLoading ? (
            <Badge variant="outline">Loading role…</Badge>
          ) : organizationRole ? (
            <Badge variant="secondary">{roleLabels[organizationRole]} role</Badge>
          ) : (
            <Badge variant="outline">All roles</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Browse guides and FAQs to unblock common tasks.
        </p>
      </div>

      <Input
        placeholder="Search guides and FAQs"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />

      <Tabs defaultValue="guides">
        <TabsList>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        <TabsContent value="guides">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGuides.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No guides found.</CardTitle>
                </CardHeader>
              </Card>
            ) : (
              filteredGuides.map((guide) => (
                <Card key={guide.id}>
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">{guide.title}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{guide.category}</Badge>
                      {formatAudienceLabel(guide.audience) ? (
                        <Badge variant="secondary">
                          {formatAudienceLabel(guide.audience)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs">{guide.summary}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {guide.sections.map((section) => (
                      <div key={section.title} className="space-y-1">
                        <p className="font-medium">{section.title}</p>
                        <p className="text-muted-foreground text-xs">{section.body}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="faq">
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No FAQs found.</CardTitle>
                </CardHeader>
              </Card>
            ) : (
              filteredFaqs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base">{faq.question}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{faq.category}</Badge>
                      {formatAudienceLabel(faq.audience) ? (
                        <Badge variant="secondary">
                          {formatAudienceLabel(faq.audience)}
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
