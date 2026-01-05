import type { OrganizationRole } from "~/lib/auth/guards/org-guard";

export type HelpAudience = {
  roles?: OrganizationRole[];
  requiresOrganization?: boolean;
};

export type HelpGuide = {
  id: string;
  title: string;
  category: string;
  summary: string;
  sections: Array<{ title: string; body: string }>;
  audience?: HelpAudience;
};

export type HelpFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  audience?: HelpAudience;
};

export const helpGuides: HelpGuide[] = [
  {
    id: "getting-started",
    title: "Getting started in the SIN portal",
    category: "Getting started",
    summary: "Pick your organization, review tasks, and find the right templates.",
    sections: [
      {
        title: "Select an organization",
        body: "Use the organization selector to scope reporting, forms, and analytics.",
      },
      {
        title: "Review reporting tasks",
        body: "Visit Reporting to see upcoming deadlines and required submissions.",
      },
      {
        title: "Locate templates",
        body: "Open the Templates hub to download the latest file formats.",
      },
    ],
  },
  {
    id: "imports",
    title: "Preparing data imports",
    category: "Imports",
    summary: "Use templates, validate your files, and track import status.",
    audience: {
      roles: ["owner", "admin", "reporter"],
      requiresOrganization: true,
    },
    sections: [
      {
        title: "Download the latest template",
        body: "Always start with the template provided for your organization.",
      },
      {
        title: "Validate the file",
        body: "Confirm the file is CSV or Excel and headers match the template.",
      },
      {
        title: "Track progress",
        body: "Monitor import status and address validation errors quickly.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Building analytics pivots",
    category: "Analytics",
    summary: "Drag fields into rows, columns, and measures to explore data.",
    audience: {
      roles: ["owner", "admin", "reporter"],
      requiresOrganization: true,
    },
    sections: [
      {
        title: "Choose a data source",
        body: "Pick organizations, reporting submissions, or form submissions.",
      },
      {
        title: "Define measures",
        body: "Select count, sum, or average metrics for your pivot table.",
      },
      {
        title: "Export results",
        body: "Download pivot output as CSV or Excel for offline analysis.",
      },
    ],
  },
];

export const helpFaqs: HelpFaq[] = [
  {
    id: "template-location",
    category: "Templates",
    question: "Where do I find the latest upload template?",
    answer:
      "Use the Templates hub and filter by Imports to download the most recent file.",
    audience: {
      roles: ["owner", "admin", "reporter"],
      requiresOrganization: true,
    },
  },
  {
    id: "reporting-deadlines",
    category: "Reporting",
    question: "How do I see my reporting deadlines?",
    answer: "Open the Reporting page to view due dates and the status of submissions.",
    audience: {
      roles: ["owner", "admin", "reporter", "viewer"],
      requiresOrganization: true,
    },
  },
  {
    id: "support-response",
    category: "Support",
    question: "How will I get a response to my support request?",
    answer:
      "Support responses appear in your Support requests list and trigger in-app " +
      "and email notifications based on your preferences.",
  },
  {
    id: "data-quality",
    category: "Data quality",
    question: "What checks are monitored for data quality?",
    answer:
      "We track missing fields, validation errors, and low completeness scores in submissions.",
    audience: {
      roles: ["owner", "admin", "reporter"],
      requiresOrganization: true,
    },
  },
];
