declare module "fast-xml-parser" {
  export class XMLParser {
    constructor(options?: unknown);
    parse: (xml: string) => unknown;
  }
}
