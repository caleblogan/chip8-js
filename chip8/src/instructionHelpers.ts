export function getByte(instruction: number, index: number) {
    if (index < 0 || index >= 2) {
        throw new Error(`Index must be between 0 and 2`)
    }
    return (instruction >> index * 8) & 0xFF
}

export function getNibble(instruction: number, index: number) {
    if (index < 0 || index >= 4) {
        throw new Error(`Index must be between 0 and 4`)
    }
    return (instruction >> index * 4) & 0x000F
}

export function getBit(num: number, index: number) {
    if (index < 0 || index >= 15) {
        throw new Error(`Index must be between 0 and 16`)
    }
    return (num >> index) & 1
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

export function getAddress$NNN(instruction: number) {
    return instruction & 0x0FFF
}

export function decode_$xkk(instruction: number) {
    const x = getNibble(instruction, 2)
    const kk = getByte(instruction, 0)
    return { x, kk }
}

export function decode_$xy$(instruction: number) {
    const x = getNibble(instruction, 2)
    const y = getNibble(instruction, 1)
    return { x, y }

}