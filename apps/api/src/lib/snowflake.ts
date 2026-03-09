/**
 * Snowflake ID Generator
 * 
 * Structure:
 * - 41 bits: Timestamp (milliseconds since custom epoch)
 * - 10 bits: Machine ID / Node ID
 * - 12 bits: Sequence number per millisecond
 */
export class Snowflake {
  private static readonly EPOCH = 1704067200000n; // 2024-01-01T00:00:00Z
  private static readonly NODE_ID_BITS = 10n;
  private static readonly SEQUENCE_BITS = 12n;

  private static readonly MAX_NODE_ID = -1n ^ (-1n << Snowflake.NODE_ID_BITS);
  private static readonly MAX_SEQUENCE = -1n ^ (-1n << Snowflake.SEQUENCE_BITS);

  private static nodeID = 1n; // Default to 1
  private static lastTimestamp = -1n;
  private static sequence = 0n;

  static init(nodeID: number) {
    if (BigInt(nodeID) > Snowflake.MAX_NODE_ID) {
      throw new Error(`Node ID must be between 0 and ${Snowflake.MAX_NODE_ID}`);
    }
    Snowflake.nodeID = BigInt(nodeID);
  }

  static generate(): string {
    let timestamp = BigInt(Date.now());

    if (timestamp < Snowflake.lastTimestamp) {
      throw new Error("Clock moved backwards!");
    }

    if (timestamp === Snowflake.lastTimestamp) {
      Snowflake.sequence = (Snowflake.sequence + 1n) & Snowflake.MAX_SEQUENCE;
      if (Snowflake.sequence === 0n) {
        // Sequence exhausted, wait for next millisecond
        while (timestamp <= Snowflake.lastTimestamp) {
          timestamp = BigInt(Date.now());
        }
      }
    } else {
      Snowflake.sequence = 0n;
    }

    Snowflake.lastTimestamp = timestamp;

    const id = ((timestamp - Snowflake.EPOCH) << (Snowflake.NODE_ID_BITS + Snowflake.SEQUENCE_BITS)) |
               (Snowflake.nodeID << Snowflake.SEQUENCE_BITS) |
               Snowflake.sequence;

    return id.toString();
  }
}
