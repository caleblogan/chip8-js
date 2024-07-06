export function getByte(instruction: number, index: number) {
    if (index < 0 || index >= 2) {
        throw new Error(`Index must be between 0 and 2`)
    }
    return (instruction >> index) & 0xFF
}

export function getNibble(instruction: number, index: number) {
    if (index < 0 || index >= 4) {
        throw new Error(`Index must be between 0 and 4`)
    }
    return (instruction >> index) & 0xF
}

export function assertNibble(value: number) {
    if (value > 0xF || value < 0x0) {
        throw new Error(`Value must be between 0 and 15`)
    }
}

export function assertUint8(value: number) {
    if (value > 0xFF || value < 0x00) {
        throw new Error(`Value must be between 0 and 255`)
    }
}