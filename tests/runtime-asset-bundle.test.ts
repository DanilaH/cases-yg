import { describe, expect, it } from 'vitest';

import { parseRuntimeAssetBundle } from '../src/game/systems/runtimeAssetBundle';

const MAGIC = new TextEncoder().encode('MPTPAK01');
const HEADER_BYTES = MAGIC.length + 4;

interface TestEntry {
  textureKey: string;
  assetPath: string;
  bytes: readonly number[];
}

const createBundle = (entries: readonly TestEntry[]): ArrayBuffer => {
  let offset = 0;
  const indexEntries = entries.map((entry) => {
    const indexed = {
      textureKey: entry.textureKey,
      assetPath: entry.assetPath,
      offset,
      length: entry.bytes.length,
    };
    offset += entry.bytes.length;
    return indexed;
  });
  const indexBytes = new TextEncoder().encode(JSON.stringify({ version: 1, entries: indexEntries }));
  const buffer = new ArrayBuffer(HEADER_BYTES + indexBytes.length + offset);
  const bytes = new Uint8Array(buffer);
  bytes.set(MAGIC, 0);
  new DataView(buffer).setUint32(MAGIC.length, indexBytes.length, true);
  bytes.set(indexBytes, HEADER_BYTES);

  let payloadOffset = HEADER_BYTES + indexBytes.length;
  for (const entry of entries) {
    bytes.set(entry.bytes, payloadOffset);
    payloadOffset += entry.bytes.length;
  }
  return buffer;
};

describe('runtime asset bundle parser', () => {
  it('returns exact payload views and metadata for a valid bundle', () => {
    const buffer = createBundle([
      {
        textureKey: 'art:collectible:camera-common',
        assetPath: 'assets/collectibles/camera-common.webp',
        bytes: [0x52, 0x49, 0x46, 0x46],
      },
      {
        textureKey: 'art:static:opening-bg',
        assetPath: 'assets/backgrounds/opening-bg.webp',
        bytes: [7, 8, 9],
      },
    ]);

    const entries = parseRuntimeAssetBundle(buffer);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.textureKey).toBe('art:collectible:camera-common');
    expect(entries[0]?.assetPath).toBe('assets/collectibles/camera-common.webp');
    expect(Array.from(entries[0]?.bytes ?? [])).toEqual([0x52, 0x49, 0x46, 0x46]);
    expect(Array.from(entries[1]?.bytes ?? [])).toEqual([7, 8, 9]);
  });

  it('rejects bad magic and truncated index metadata', () => {
    const wrongMagic = createBundle([
      { textureKey: 'a', assetPath: 'a.webp', bytes: [1] },
    ]);
    new Uint8Array(wrongMagic)[0] = 0;
    expect(() => parseRuntimeAssetBundle(wrongMagic)).toThrow(/magic/i);

    const truncated = createBundle([
      { textureKey: 'a', assetPath: 'a.webp', bytes: [1] },
    ]);
    new DataView(truncated).setUint32(MAGIC.length, truncated.byteLength, true);
    expect(() => parseRuntimeAssetBundle(truncated)).toThrow(/out of bounds/i);
  });

  it('rejects duplicate keys and payload ranges outside the bundle', () => {
    const duplicateIndex = new TextEncoder().encode(JSON.stringify({
      version: 1,
      entries: [
        { textureKey: 'a', assetPath: 'a.webp', offset: 0, length: 1 },
        { textureKey: 'a', assetPath: 'b.webp', offset: 1, length: 1 },
      ],
    }));
    const duplicate = new ArrayBuffer(HEADER_BYTES + duplicateIndex.length + 2);
    const duplicateBytes = new Uint8Array(duplicate);
    duplicateBytes.set(MAGIC, 0);
    new DataView(duplicate).setUint32(MAGIC.length, duplicateIndex.length, true);
    duplicateBytes.set(duplicateIndex, HEADER_BYTES);
    duplicateBytes.set([1, 2], HEADER_BYTES + duplicateIndex.length);
    expect(() => parseRuntimeAssetBundle(duplicate)).toThrow(/Duplicate/i);

    const outOfBoundsIndex = new TextEncoder().encode(JSON.stringify({
      version: 1,
      entries: [{ textureKey: 'a', assetPath: 'a.webp', offset: 0, length: 99 }],
    }));
    const outOfBounds = new ArrayBuffer(HEADER_BYTES + outOfBoundsIndex.length + 1);
    const outOfBoundsBytes = new Uint8Array(outOfBounds);
    outOfBoundsBytes.set(MAGIC, 0);
    new DataView(outOfBounds).setUint32(MAGIC.length, outOfBoundsIndex.length, true);
    outOfBoundsBytes.set(outOfBoundsIndex, HEADER_BYTES);
    outOfBoundsBytes[HEADER_BYTES + outOfBoundsIndex.length] = 1;
    expect(() => parseRuntimeAssetBundle(outOfBounds)).toThrow(/out of bounds/i);
  });
});
