import SnowflakeID from 'snowflake-id';

export class Snowflake {
  private static instance: SnowflakeID;

  static init(nodeID: number) {
    this.instance = new SnowflakeID({
      mid: nodeID,
      offset: (2024 - 1970) * 31536000 * 1000 // 2024-01-01 Epoch
    });
  }

  static generate(): string {
    if (!this.instance) {
      this.init(1);
    }
    return this.instance.generate().toString();
  }
}
