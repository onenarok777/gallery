declare module 'snowflake-id' {
  interface SnowflakeOptions {
    mid?: number;
    offset?: number;
  }

  class Snowflake {
    constructor(options?: SnowflakeOptions);
    generate(): bigint;
  }

  export default Snowflake;
}
