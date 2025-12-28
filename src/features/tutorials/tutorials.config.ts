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
    suggestedRoutes: ["/dashboard/sin/imports"],
  },
] as const;

export type TutorialDefinition = (typeof tutorials)[number];
export type TutorialId = TutorialDefinition["id"];

export const tutorialIds = tutorials.map((tutorial) => tutorial.id);
