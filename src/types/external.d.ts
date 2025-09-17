declare module "cloudinary" {
  export interface UploadApiOptions {
    resource_type?: string;
    transformation?: string;
    context?: Record<string, string | undefined>;
  }
  export const v2: {
    config: (options: Record<string, string>) => void;
    uploader: {
      upload: (
        file: string,
        options: UploadApiOptions,
      ) => Promise<{
        public_id: string;
        secure_url: string;
        width: number;
        height: number;
        format: string;
      }>;
      destroy: (
        publicId: string,
        options?: { resource_type?: string },
      ) => Promise<unknown>;
    };
  };
}

declare module "resend" {
  export interface SendResponse {
    data?: { id?: string };
  }
  export class Resend {
    constructor(apiKey: string);
    emails: { send: (data: unknown) => Promise<SendResponse> };
  }
}

declare module "@radix-ui/react-tooltip";

declare module "crawlee" {
  import type { CheerioAPI } from "cheerio";

  export interface CheerioCrawlingContext {
    request: {
      url: string;
      headers?: Record<string, string | undefined>;
    };
    $: CheerioAPI;
    enqueueLinks: (options: { urls: string[] }) => Promise<void>;
    log: {
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string) => void;
    };
  }

  export interface CheerioCrawlerOptions {
    maxConcurrency?: number;
    requestHandler?: (context: CheerioCrawlingContext) => Promise<void> | void;
    preNavigationHooks?: Array<(context: CheerioCrawlingContext) => Promise<void> | void>;
  }

  export class CheerioCrawler {
    constructor(options?: CheerioCrawlerOptions);
    run(inputs: string[]): Promise<void>;
  }
}
