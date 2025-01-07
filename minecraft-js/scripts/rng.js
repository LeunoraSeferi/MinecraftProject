// Implementation found here: https://stackoverflow.com/a/19301306/2258875

export class RNG {
    m_w = 123456789;
    m_z = 987654321;
    mask = 0xffffffff;

    constructor(seed) {
        this.m_w = (123456789 + seed) & this.mask;
        this.m_z = (987654321 - seed) & this.mask;
    }

    // Returns a number between 0 (inclusive) and 1.0 (exclusive), just like Math.random()
    random() {
        this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
        this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
        let result = ((this.m_z << 16) + (this.m_w & 65535)) >>> 0; // Ensure unsigned
        result /= 4294967296; // Convert to a number between 0 and 1
        return result;
    }
}
