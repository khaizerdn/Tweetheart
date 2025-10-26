class SnowflakeID {
  constructor(machineId = 1) {
    // Constants (could be static)
    this.MACHINE_ID_BITS = 10;
    this.SEQUENCE_BITS = 12;
    this.MAX_MACHINE_ID = 2 ** this.MACHINE_ID_BITS - 1;
    this.MAX_SEQUENCE = -1 ^ (-1 << this.SEQUENCE_BITS);
    this.MACHINE_ID_SHIFT = this.SEQUENCE_BITS;
    this.TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.MACHINE_ID_BITS;
    this.TWEPOCH = 1288834974657n;

    // Validate machine ID
    if (machineId < 0 || machineId > this.MAX_MACHINE_ID) {
      throw new Error(`Machine ID must be between 0 and ${this.MAX_MACHINE_ID}.`);
    }
    this.machineId = machineId;

    this.sequence = 0;
    this.lastTimestamp = -1n; // Use BigInt for consistency
  }

  generate() {
    let timestamp = this.currentTimestamp();

    if (timestamp < this.lastTimestamp) {
      throw new Error(`Clock moved backward. Refusing to generate ID for ${this.lastTimestamp - timestamp}ms.`);
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & this.MAX_SEQUENCE;
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(timestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    return ((timestamp - this.TWEPOCH) << BigInt(this.TIMESTAMP_SHIFT)) |
      (BigInt(this.machineId) << BigInt(this.MACHINE_ID_SHIFT)) |
      BigInt(this.sequence);
  }

  waitNextMillis(currentTimestamp) {
    while (currentTimestamp <= this.lastTimestamp) {
      currentTimestamp = this.currentTimestamp();
    }
    return currentTimestamp;
  }

  currentTimestamp() {
    return BigInt(Date.now());
  }
}

export default SnowflakeID;