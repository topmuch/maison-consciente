declare module 'negotiator' {
  export default class Negotiator {
    constructor(req: { headers: { 'accept-language'?: string } });
    language(available?: string[]): string | undefined;
    languages(available?: string[]): string[];
    charset(available?: string[]): string | undefined;
    charsets(available?: string[]): string[];
    encoding(available?: string[]): string | undefined;
    encodings(available?: string[]): string[];
  }
}
