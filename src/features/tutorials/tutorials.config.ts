export const tutorials = [
  {
    id: "onboarding",
    title: "SIN portal onboarding",
    description: "Get oriented with reporting, forms, and analytics.",
    steps: [
      {
        title: "Select your organization",
        body: "Use the org switcher to focus on the right club or league.",
      },
      {
        title: "Review reporting tasks",
        body: "Open Reporting to see deadlines and required submissions.",
      },
      {
        title: "Complete forms",
        body: "Fill in any assigned forms before uploading data.",
      },
      {
        title: "Check analytics",
        body: "Explore saved reports or build a pivot for quick insights.",
      },
    ],
    tourSteps: [
      {
        title: "Review reporting tasks",
        body: "Open Reporting to see deadlines and required submissions.",
        target: "[data-tour='sin-reporting-card']",
        route: "/dashboard/sin",
      },
      {
        title: "Complete forms",
        body: "Access your assigned forms and submit updates.",
        target: "[data-tour='sin-forms-card']",
        route: "/dashboard/sin",
      },
      {
        title: "Check analytics",
        body: "Build charts and export insights for your organization.",
        target: "[data-tour='sin-analytics-card']",
        route: "/dashboard/sin",
      },
      {
        title: "Grab templates",
        body: "Find the latest reporting and import templates.",
        target: "[data-tour='sin-templates-card']",
        route: "/dashboard/sin",
      },
    ],
    suggestedRoutes: ["/dashboard/sin"],
  },
  {
    id: "data_upload",
    title: "Data upload walkthrough",
    description: "Learn how to prepare files and run an import.",
    steps: [
      {
        title: "Download the right template",
        body: "Grab the latest upload template to ensure column matching.",
      },
      {
        title: "Validate file format",
        body: "Ensure the file is CSV or Excel and matches the template headers.",
      },
      {
        title: "Run the import",
        body: "Upload the file, map fields, and confirm validation results.",
      },
      {
        title: "Review status",
        body: "Track import status and resolve any validation issues.",
      },
    ],
    tourSteps: [
      {
        title: "Download the right template",
        body: "Open the template library for the latest import files.",
        target: "[data-tour='imports-templates']",
        route: "/dashboard/sin/imports",
      },
      {
        title: "Review import activity",
        body: "Track recent imports and their processing status.",
        target: "[data-tour='imports-list']",
        route: "/dashboard/sin/imports",
      },
    ],
    suggestedRoutes: ["/dashboard/sin/imports"],
  },
] as const;

export type TutorialDefinition = (typeof tutorials)[number];
export type TutorialId = TutorialDefinition["id"];

export const tutorialIds = tutorials.map((tutorial) => tutorial.id);
