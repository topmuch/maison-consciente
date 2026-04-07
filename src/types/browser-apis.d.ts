/* ═══════════════════════════════════════════════════════
   Type augmentations for browser APIs not in TS lib
   ═══════════════════════════════════════════════════════ */

// NDEFReader (Web NFC API)
interface NDEFReader extends EventTarget {
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => void) | null;
  onerror: ((this: NDEFReader, ev: Event) => void) | null;
  scan(options?: { signal?: AbortSignal }): Promise<void>;
}

interface NDEFReadingEvent extends Event {
  readonly message: NDEFMessage;
  readonly serialNumber: string;
}

interface NDEFMessage {
  readonly records: NDEFRecord[];
}

interface NDEFRecord {
  readonly recordType: string;
  readonly mediaType: string;
  readonly id: string;
  readonly data: DataView;
  toText(): string | undefined;
}
