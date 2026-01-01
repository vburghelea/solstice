import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { unauthorized } from "~/lib/server/errors";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { globalSearchSchema, type GlobalSearchResult } from "./search.schemas";

const requireSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw unauthorized("User not authenticated");
  }

  return session.user.id;
};

export const searchGlobal = createServerFn({ method: "GET" })
  .inputValidator(zod$(globalSearchSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_global_search");
    const userId = await requireSessionUserId();
    const query = data.query.trim();
    if (query.length < 2) return [];

    const limit = Math.min(data.limit ?? 8, 15);
    const term = `%${query}%`;

    const { getDb } = await import("~/db/server-helpers");
    const {
      dataCatalogEntries,
      forms,
      organizationMembers,
      organizations,
      reportingCycles,
      reportingTasks,
      supportRequests,
      templates,
    } = await import("~/db/schema");
    const { and, asc, desc, eq, ilike, inArray, isNull, or } =
      await import("drizzle-orm");
    const { PermissionService } = await import("~/features/roles/permission.service");

    const db = await getDb();
    const memberships = await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.status, "active"),
        ),
      );

    const orgIds = memberships.map((membership) => membership.organizationId);
    const isAdmin = await PermissionService.isGlobalAdmin(userId);

    if (!isAdmin && orgIds.length === 0) return [];

    const orgRows =
      orgIds.length > 0
        ? await db
            .select({
              id: organizations.id,
              name: organizations.name,
              type: organizations.type,
            })
            .from(organizations)
            .where(inArray(organizations.id, orgIds))
        : [];

    const orgNameById = new Map(orgRows.map((org) => [org.id, org.name]));
    const orgTypes = Array.from(new Set(orgRows.map((org) => org.type)));

    const results: GlobalSearchResult[] = [];

    const organizationConditions = [ilike(organizations.name, term)];
    if (!isAdmin) {
      organizationConditions.push(inArray(organizations.id, orgIds));
    }

    const organizationsResult = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        type: organizations.type,
      })
      .from(organizations)
      .where(and(...organizationConditions))
      .orderBy(asc(organizations.name))
      .limit(limit);

    results.push(
      ...organizationsResult.map((org) => ({
        id: org.id,
        type: "organization" as const,
        title: org.name,
        subtitle: org.type ? `Type: ${org.type.replace(/_/g, " ")}` : null,
        href: isAdmin ? "/dashboard/admin/sin/organizations" : "/dashboard/organizations",
      })),
    );

    const formConditions = [ilike(forms.name, term)];
    if (!isAdmin) {
      formConditions.push(inArray(forms.organizationId, orgIds));
    }

    const formsResult = await db
      .select({
        id: forms.id,
        name: forms.name,
        description: forms.description,
        organizationId: forms.organizationId,
      })
      .from(forms)
      .where(and(...formConditions))
      .orderBy(asc(forms.name))
      .limit(limit);

    results.push(
      ...formsResult.map((form) => ({
        id: form.id,
        type: "form" as const,
        title: form.name,
        subtitle: form.organizationId
          ? (orgNameById.get(form.organizationId) ?? null)
          : (form.description ?? null),
        href: `/dashboard/sin/forms/${form.id}`,
      })),
    );

    const taskScopeConditions = [];
    if (orgIds.length > 0) {
      taskScopeConditions.push(inArray(reportingTasks.organizationId, orgIds));
    }
    if (orgTypes.length > 0) {
      taskScopeConditions.push(inArray(reportingTasks.organizationType, orgTypes));
    }

    if (isAdmin || taskScopeConditions.length > 0) {
      const taskSearch = or(
        ilike(reportingTasks.title, term),
        ilike(reportingTasks.description, term),
      );

      const taskConditions = isAdmin
        ? taskSearch
        : and(taskSearch, or(...taskScopeConditions));

      const reportingResult = await db
        .select({
          id: reportingTasks.id,
          title: reportingTasks.title,
          description: reportingTasks.description,
          dueDate: reportingTasks.dueDate,
          cycleName: reportingCycles.name,
        })
        .from(reportingTasks)
        .innerJoin(reportingCycles, eq(reportingTasks.cycleId, reportingCycles.id))
        .where(taskConditions)
        .orderBy(desc(reportingTasks.dueDate))
        .limit(limit);

      results.push(
        ...reportingResult.map((task) => ({
          id: task.id,
          type: "reporting_task" as const,
          title: task.title,
          subtitle: task.cycleName ?? task.description ?? null,
          href: "/dashboard/sin/reporting",
        })),
      );
    }

    const templateConditions = [
      eq(templates.isArchived, false),
      or(ilike(templates.name, term), ilike(templates.description, term)),
    ];
    if (!isAdmin) {
      templateConditions.push(
        or(inArray(templates.organizationId, orgIds), isNull(templates.organizationId)),
      );
    }

    const templatesResult = await db
      .select({
        id: templates.id,
        name: templates.name,
        description: templates.description,
        context: templates.context,
      })
      .from(templates)
      .where(and(...templateConditions))
      .orderBy(asc(templates.name))
      .limit(limit);

    results.push(
      ...templatesResult.map((template) => ({
        id: template.id,
        type: "template" as const,
        title: template.name,
        subtitle: template.context ? `Context: ${template.context}` : null,
        href: `/dashboard/sin/templates?context=${template.context}`,
      })),
    );

    if (isAdmin) {
      const catalogResult = await db
        .select({
          id: dataCatalogEntries.id,
          title: dataCatalogEntries.title,
          description: dataCatalogEntries.description,
          sourceType: dataCatalogEntries.sourceType,
        })
        .from(dataCatalogEntries)
        .where(
          or(
            ilike(dataCatalogEntries.title, term),
            ilike(dataCatalogEntries.description, term),
          ),
        )
        .orderBy(asc(dataCatalogEntries.title))
        .limit(limit);

      results.push(
        ...catalogResult.map((entry) => ({
          id: entry.id,
          type: "data_catalog" as const,
          title: entry.title,
          subtitle: entry.sourceType,
          href: "/dashboard/admin/sin/data-catalog",
        })),
      );
    }

    const supportConditions = [
      or(ilike(supportRequests.subject, term), ilike(supportRequests.message, term)),
    ];
    if (!isAdmin) {
      supportConditions.push(
        or(
          eq(supportRequests.userId, userId),
          inArray(supportRequests.organizationId, orgIds),
        ),
      );
    }

    const supportResult = await db
      .select({
        id: supportRequests.id,
        subject: supportRequests.subject,
        status: supportRequests.status,
      })
      .from(supportRequests)
      .where(and(...supportConditions))
      .orderBy(desc(supportRequests.createdAt))
      .limit(limit);

    results.push(
      ...supportResult.map((item) => ({
        id: item.id,
        type: "support_request" as const,
        title: item.subject,
        subtitle: `Status: ${item.status.replace(/_/g, " ")}`,
        href: "/dashboard/sin/support",
      })),
    );

    return results;
  });
