const RUNTIME_ASSET_BUNDLE_MAGIC = 'MPTPAK01';
const MAGIC_BYTES = 8;
const HEADER_BYTES = MAGIC_BYTES + 4;
const BUNDLE_VERSION = 1;

interface RawBundleEntry {
  textureKey?: unknown;
  assetPath?: unknown;
  offset?: unknown;
  length?: unknown;
}

interface RawBundleIndex {
  version?: unknown;
  entries?: unknown;
}

export interface RuntimeAssetBundleEntry {
  textureKey: string;
  assetPath: string;
  offset: number;
  length: number;
  bytes: Uint8Array<ArrayBuffer>;
}

const readAscii = (bytes: Uint8Array<ArrayBuffer>, start: number, length: number): string => {
  let value = '';
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[start + index] ?? 0);
  }
  return value;
};

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const parseRuntimeAssetBundle = (buffer: ArrayBuffer): readonly RuntimeAssetBundleEntry[] => {
  if (buffer.byteLength < HEADER_BYTES) {
    throw new Error(`Runtime asset bundle is truncated: ${buffer.byteLength} bytes`);
  }

  const bytes = new Uint8Array(buffer);
  const magic = readAscii(bytes, 0, MAGIC_BYTES);
  if (magic !== RUNTIME_ASSET_BUNDLE_MAGIC) {
    throw new Error(`Invalid runtime asset bundle magic: ${JSON.stringify(magic)}`);
  }

  const view = new DataView(buffer);
  const indexLength = view.getUint32(MAGIC_BYTES, true);
  const payloadStart = HEADER_BYTES + indexLength;
  if (payloadStart > buffer.byteLength) {
    throw new Error(
      `Runtime asset bundle index is out of bounds: ${indexLength} bytes for ${buffer.byteLength}-byte bundle`,
    );
  }

  let index: RawBundleIndex;
  try {
    const json = new TextDecoder().decode(new Uint8Array(buffer, HEADER_BYTES, indexLength));
    index = JSON.parse(json) as RawBundleIndex;
  } catch (error: unknown) {
    throw new Error('Runtime asset bundle index is not valid JSON', { cause: error });
  }

  if (index.version !== BUNDLE_VERSION || !Array.isArray(index.entries)) {
    throw new Error('Unsupported runtime asset bundle index');
  }

  const seenKeys = new Set<string>();
  return index.entries.map((rawEntry: RawBundleEntry, entryIndex): RuntimeAssetBundleEntry => {
    const { textureKey, assetPath, offset, length } = rawEntry;
    if (
      typeof textureKey !== 'string' || textureKey.length === 0 ||
      typeof assetPath !== 'string' || assetPath.length === 0 ||
      !isNonNegativeInteger(offset) ||
      !isNonNegativeInteger(length) ||
      length === 0
    ) {
      throw new Error(`Invalid runtime asset bundle entry at index ${entryIndex}`);
    }
    if (seenKeys.has(textureKey)) {
      throw new Error(`Duplicate runtime asset bundle texture key: ${textureKey}`);
    }
    seenKeys.add(textureKey);

    const dataStart = payloadStart + offset;
    const dataEnd = dataStart + length;
    if (dataStart < payloadStart || dataEnd > buffer.byteLength || dataEnd < dataStart) {
      throw new Error(`Runtime asset bundle entry is out of bounds: ${textureKey}`);
    }

    return {
      textureKey,
      assetPath,
      offset,
      length,
      bytes: new Uint8Array(buffer, dataStart, length),
    };
  });
};
