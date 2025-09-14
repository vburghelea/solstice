declare module "resend" {
  export class Resend {
    constructor(...args: unknown[]);
    emails: {
      send: (...args: unknown[]) => Promise<{ data?: { id?: string } }>;
    };
  }
}
