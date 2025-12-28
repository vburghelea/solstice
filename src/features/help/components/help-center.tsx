import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { helpFaqs, helpGuides } from "../help-content";

const normalize = (value: string) => value.toLowerCase();

export function HelpCenter() {
  const [search, setSearch] = useState("");

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return helpGuides;
    const term = normalize(search.trim());
    return helpGuides.filter((guide) =>
      [guide.title, guide.summary, guide.category, ...guide.sections.map((s) => s.title)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search]);

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return helpFaqs;
    const term = normalize(search.trim());
    return helpFaqs.filter((faq) =>
      [faq.question, faq.answer, faq.category].join(" ").toLowerCase().includes(term),
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Help Center</h1>
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
                    <Badge variant="outline">{guide.category}</Badge>
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
                    <Badge variant="outline">{faq.category}</Badge>
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
