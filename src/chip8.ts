import { Chip8Error } from "./errors";
import { decode_$xkk, decode_$xy$, getAddress$NNN as decodeAddress_$nnn, getBit, getByte, getNibble } from "./instructionHelpers";
import { EmulatorScreen } from "./screen";
import { randInt } from "./utils";

const MEMORY_SIZE = 4096;
const PROGRAM_START = 0x200; // Most Chip-8 programs start at location 0x200 (512), but some begin at 0x600 (1536).


export class Chip8 {
    memory = new Uint8Array(MEMORY_SIZE)

    // 16 general purpose 8-bit registers, usually referred to as Vx, where x is a hexadecimal digit (0 through F).
    // VF should not be used by programs as it is used as a flag by some instructions.
    V = new Uint8Array(16)

    // 16-bit register called I. This register is generally used to store memory addresses, so only the lowest (rightmost) 12 bits are usually used.
    I = 0

    // Chip-8 also has two special purpose 8-bit registers, for the delay and sound timers. When these registers are non-zero,
    // they are automatically decremented at a rate of 60Hz.
    delayTimer = 0
    soundTimer = 0

    // There are also some "pseudo-registers" which are not accessable from Chip-8 programs.
    // The program counter (PC) should be 16-bit, and is used to store the currently executing address.
    PC = PROGRAM_START
    // The stack pointer (SP) can be 8-bit, it is used to point to the topmost level of the stack.
    SP = -1

    // The stack is an array of 16 16-bit values, used to store the address that the interpreter shoud return to when finished with a subroutine.
    // Chip-8 allows for up to 16 levels of nested subroutines.
    stack = new Uint16Array(16)

    // Keyboard
    // TODO: Not sure how this works

    // Screen
    // The original implementation of the Chip-8 language used a 64x32-pixel monochrome display with this format:
    // (x, y)
    // (0,0)	(63,0)
    // (0,31)	(63,31)
    // Size in bits
    screen: EmulatorScreen

    // these are stored in memory
    readonly fontset = new Uint8Array([
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ])

    constructor(screen: EmulatorScreen) {
        this.screen = screen
        console.log(`SPRITES LEN: ${this.fontset.length}`)

        if (this.fontset.length >= PROGRAM_START) {
            throw new Chip8Error("Default sprite definitions array is too large; trying to overwrite program memory", this, 0)
        }
        for (let i = 0; i < this.fontset.length; i++) {
            this.memory[i] = this.fontset[i]
        }
    }

    loadProgram(program: Uint8Array) {
        // TODO: Check if program is too large
        this.memory.set(program, PROGRAM_START)
    }

    cycle() {
        const nextInstruction = this.fetch()
        this.decodeAndExecute(nextInstruction)
        if (this.delayTimer > 0) {
            this.delayTimer -= 1
        }
        if (this.soundTimer > 0) {
            this.soundTimer -= 1
        }
    }

    // Each instruction is two bytes. The most significant byte is stored at the current address, and the least significant byte at the next address.
    fetch() {
        const instruction = (this.memory[this.PC] << 8) | this.memory[this.PC + 1]
        this.PC += 2
        return instruction
    }

    async decodeAndExecute(instruction: number) {
        const highNibble = getNibble(instruction, 3)
        const lowNibble = getNibble(instruction, 0)
        if (instruction === 0x00E0) {
            this.clearDisplay()
        } else if (instruction === 0x00EE) {
            this.returnFromSubroutine()
        } else if (highNibble === 0x1) {
            this.jumpToAddress(instruction)
        } else if (highNibble === 0x2) {
            this.callSubroutine(instruction)
        } else if (highNibble === 0x3) {
            this.skipNextInstructionIfVxEqualsKK(instruction)
        } else if (highNibble === 0x4) {
            this.skipNextInstructionIfVxNotEqualsKK(instruction)
        } else if (highNibble === 0x5) {
            this.skipNextInstructionIfVxEqualsVy(instruction)
        } else if (highNibble === 0x6) {
            this.setVxByteImmediate(instruction)
        } else if (highNibble === 0x7) {
            this.addVxByteImmediate(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x0) {
            this.setVxToVy(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x1) {
            this.bitwiseOrVxVy(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x2) {
            this.bitwiseAndVxVy(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x3) {
            this.bitwiseXorVxVy(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x4) {
            this.addVxVyCarry(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x5) {
            this.subVxVyCarry(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x6) {
            this.logicalShiftRight(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0x7) {
            this.subVyVxCarry(instruction)
        } else if (highNibble === 0x8 && lowNibble === 0xE) {
            this.logicalShiftLeft(instruction)
        } else if (highNibble === 0x9) {
            this.skipNextVxNotEqualsVy(instruction)
        } else if (highNibble === 0xA) {
            this.setIImmediate(instruction)
        } else if (highNibble === 0xB) {
            this.jumpAddressPlusV0(instruction)
        } else if (highNibble === 0xC) {
            this.setVxRandom(instruction)
        } else if (highNibble === 0xD) {
            this.displaySprite(instruction)
        } else if (highNibble === 0xE && lowNibble === 0xE) {
            this.skipNextVxKeyPressed(instruction)
        } else if (highNibble === 0xE && lowNibble === 0x1) {
            this.skipNextVxKeyNotPressed(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x07) {
            this.setVxDelayTimer(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x0A) {
            await this.waitVxKeyPressed(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x15) {
            this.setDelayTimerToVx(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x18) {
            this.setSoundTimerToVx(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x1E) {
            this.setItoIPlusVx(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x29) {
            this.setIToSpriteAddressVx(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x33) {
            this.storeBCD(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x55) {
            this.storeV0toVxAtI(instruction)
        } else if (highNibble === 0xF && getByte(instruction, 0) === 0x65) {
            this.loadIntoRegisters(instruction)
        } else {
            throw new Chip8Error(`Unknown instruction: 0x${instruction.toString(16)}`, this, instruction)
        }
    }

    // 0nnn - SYS addr
    // Jump to a machine code routine at nnn.
    // This instruction is only used on the old computers on which Chip-8 was originally implemented. It is ignored by modern interpreters.

    // 00E0 - CLS
    // Clear the display.
    clearDisplay() {
        this.screen.clearBuffer()
    }

    // 00EE - RET
    // Return from a subroutine.
    // The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
    returnFromSubroutine() {
        // TODO: Not sure if SP should be -1 or 0 when empty
        if (this.SP < 0) {
            throw new Chip8Error(`Stack underflow`, this, 0x00EE)
        }
        this.PC = this.stack[this.SP]
        this.SP--
    }


    // 1nnn - JP addr
    // Jump to location nnn.
    // The interpreter sets the program counter to nnn.
    jumpToAddress(instruction: number) {
        this.PC = decodeAddress_$nnn(instruction)
    }

    // 2nnn - CALL addr
    // Call subroutine at nnn.
    // The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
    callSubroutine(instruction: number) {
        this.SP++
        if (this.SP >= this.stack.length) {
            throw new Chip8Error(`Stack overflow`, this, instruction)
        }
        this.stack[this.SP] = this.PC
        this.PC = decodeAddress_$nnn(instruction)
    }

    // 3xkk - SE Vx, byte
    // Skip next instruction if Vx = kk.
    // The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.
    skipNextInstructionIfVxEqualsKK(instruction: number) {
        const { x, kk } = decode_$xkk(instruction)
        if (this.V[x] === kk) {
            this.PC += 2
        }
    }

    // 4xkk - SNE Vx, byte
    // Skip next instruction if Vx != kk.
    // The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
    skipNextInstructionIfVxNotEqualsKK(instruction: number) {
        const { x, kk } = decode_$xkk(instruction)
        if (this.V[x] !== kk) {
            this.PC += 2
        }
    }

    // 5xy0 - SE Vx, Vy
    // Skip next instruction if Vx = Vy.
    // The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
    skipNextInstructionIfVxEqualsVy(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        if (this.V[x] === this.V[y]) {
            this.PC += 2
        }
    }

    // 6xkk - LD Vx, byte
    // Set Vx = kk.
    // The interpreter puts the value kk into register Vx.
    setVxByteImmediate(instruction: number) {
        const { x, kk } = decode_$xkk(instruction)
        this.V[x] = kk
    }

    // 7xkk - ADD Vx, byte
    // Set Vx = Vx + kk.
    // Adds the value kk to the value of register Vx, then stores the result in Vx.
    addVxByteImmediate(instruction: number) {
        const { x, kk } = decode_$xkk(instruction)
        this.V[x] += kk
    }

    // 8xy0 - LD Vx, Vy
    // Set Vx = Vy.
    // Stores the value of register Vy in register Vx.
    setVxToVy(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        this.V[x] = this.V[y]
    }

    // 8xy1 - OR Vx, Vy
    // Set Vx = Vx OR Vy.
    // Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx.
    bitwiseOrVxVy(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        this.V[x] = this.V[x] | this.V[y]
    }

    // 8xy2 - AND Vx, Vy
    // Set Vx = Vx AND Vy.
    // Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx.
    bitwiseAndVxVy(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        this.V[x] = this.V[x] & this.V[y]
    }

    // 8xy3 - XOR Vx, Vy
    // Set Vx = Vx XOR Vy.
    // Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx.
    bitwiseXorVxVy(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        this.V[x] = this.V[x] ^ this.V[y]
    }

    // 8xy4 - ADD Vx, Vy
    // Set Vx = Vx + Vy, set VF = carry.
    // The values of Vx and Vy are added together.
    // If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0.
    // Only the lowest 8 bits of the result are kept, and stored in Vx.
    addVxVyCarry(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        const sum = this.V[x] + this.V[y]
        if (sum > 0xFF) {
            this.V[0xF] = 1
        } else {
            this.V[0xF] = 0
        }
        this.V[x] = sum
    }

    // 8xy5 - SUB Vx, Vy
    // Set Vx = Vx - Vy, set VF = NOT borrow.
    // Set vf to 0 if there is underflow
    // If Vx >= Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
    // TODO: possibly wrong - may be Vx > Vy then VF is set to 1; not sure if underflow resets
    subVxVyCarry(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        if (this.V[x] >= this.V[y]) {
            this.V[0xF] = 1
        } else {
            this.V[0xF] = 0
        }
        this.V[x] = this.V[x] - this.V[y]
    }

    // 8xy6 - SHR Vx {, Vy}
    // Set Vx = Vx SHR 1.
    // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
    logicalShiftRight(instruction: number) {
        const { x } = decode_$xy$(instruction)
        this.V[0xF] = this.V[x] & 1
        this.V[x] = this.V[x] >> 1
    }

    // 8xy7 - SUBN Vx, Vy
    // Set Vx = Vy - Vx, set VF = NOT borrow.
    // If Vy >= Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
    subVyVxCarry(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        if (this.V[y] >= this.V[x]) {
            this.V[0xF] = 1
        } else {
            this.V[0xF] = 0
        }
        this.V[x] = this.V[y] - this.V[x]
    }

    // 8xyE - SHL Vx {, Vy}
    // Set Vx = Vx SHL 1.
    // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
    logicalShiftLeft(instruction: number) {
        const { x } = decode_$xy$(instruction)
        this.V[0xF] = getBit(this.V[x], 7)
        this.V[x] = this.V[x] << 1
    }

    // 9xy0 - SNE Vx, Vy
    // Skip next instruction if Vx != Vy.
    // The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
    skipNextVxNotEqualsVy(instruction: number) {
        const { x, y } = decode_$xy$(instruction)
        if (this.V[x] != this.V[y]) {
            this.PC += 2
        }
    }

    // Annn - LD I, addr
    // Set I = nnn.
    // The value of register I is set to nnn.
    setIImmediate(instruction: number) {
        const nnn = decodeAddress_$nnn(instruction)
        this.I = nnn
    }

    // Bnnn - JP V0, addr
    // Jump to location nnn + V0.
    // The program counter is set to nnn plus the value of V0.
    jumpAddressPlusV0(instruction: number) {
        const address = decodeAddress_$nnn(instruction)
        this.PC = address + this.V[0]
    }

    // Cxkk - RND Vx, byte
    // Set Vx = random byte AND kk.
    // The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk.
    // The results are stored in Vx. See instruction 8xy2 for more information on AND.
    setVxRandom(instruction: number) {
        const { x, kk } = decode_$xkk(instruction)
        this.V[x] = randInt(0, 255) & kk
    }

    // Dxyn - DRW Vx, Vy, nibble
    // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
    // The interpreter reads n bytes from memory, starting at the address stored in I.
    // These bytes are then displayed as sprites on screen at coordinates (Vx, Vy). Sprites are XORed onto the existing screen.
    // If this causes any pixels to be erased, VF is set to 1, otherwise it is set to 0.
    // If the sprite is positioned so part of it is outside the coordinates of the display, it wraps around to the opposite side of the screen.
    displaySprite(instruction: number) {
        const x = this.V[getNibble(instruction, 2)]
        const y = this.V[getNibble(instruction, 1)]
        const n = getNibble(instruction, 0)
        this.V[0xF] = 0
        for (let i = 0; i < n; i++) {
            if (this.screen.writeByteToBuffer(x, y + i, this.memory[this.I + i])) {
                this.V[0xF] = 1
            }
        }
    }

    // Ex9E - SKP Vx
    // Skip next instruction if key with the value of Vx is pressed.
    // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.
    skipNextVxKeyPressed(instruction: number) {
        throw new Error("Not Implemented - keyboard")
    }

    // ExA1 - SKNP Vx
    // Skip next instruction if key with the value of Vx is not pressed.
    // Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
    skipNextVxKeyNotPressed(instruction: number) {
        throw new Error("Not Implemented - keyboard")
    }

    // Fx07 - LD Vx, DT
    // Set Vx = delay timer value.
    // The value of DT is placed into Vx.
    setVxDelayTimer(instruction: number) {
        const { x } = decode_$xy$(instruction)
        this.V[x] = this.delayTimer
    }

    // Fx0A - LD Vx, K
    // Wait for a key press, store the value of the key in Vx.
    // All execution stops until a key is pressed, then the value of that key is stored in Vx.
    async waitVxKeyPressed(instruction: number) {
        throw new Error("Not Implemented")
    }

    // Fx15 - LD DT, Vx
    // Set delay timer = Vx.
    // DT is set equal to the value of Vx.
    setDelayTimerToVx(instruction: number) {
        const { x } = decode_$xy$(instruction)
        this.delayTimer = this.V[x]
    }

    // Fx18 - LD ST, Vx
    // Set sound timer = Vx.
    // ST is set equal to the value of Vx.
    setSoundTimerToVx(instruction: number) {
        const { x } = decode_$xy$(instruction)
        this.soundTimer = this.V[x]
    }

    // Fx1E - ADD I, Vx
    // Set I = I + Vx.
    // The values of I and Vx are added, and the results are stored in I.
    setItoIPlusVx(instruction: number) {
        const { x } = decode_$xy$(instruction)
        this.I = (this.I + this.V[x]) & 0x0FFF
    }

    // Fx29 - LD F, Vx
    // Set I = location of sprite for digit Vx.
    // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx.
    setIToSpriteAddressVx(instruction: number) {
        const { x } = decode_$xy$(instruction)
        // TODO: Currently sprites are in their own buffer... we probably should move these to main memory
        this.I = x
    }

    // Fx33 - LD B, Vx
    // Store BCD representation of Vx in memory locations I, I+1, and I+2.
    // The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I,
    // the tens digit at location I+1, and the ones digit at location I+2.
    storeBCD(instruction: number) {
        const { x } = decode_$xy$(instruction)
        let value = this.V[x]
        this.memory[this.I] = Math.floor(value / 100)
        value = value % 100
        this.memory[this.I + 1] = Math.floor(value / 10)
        value = value % 10
        this.memory[this.I + 2] = value
    }

    // Fx55 - LD [I], Vx
    // Store registers V0 through Vx in memory starting at location I.
    // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
    storeV0toVxAtI(instruction: number) {
        const { x } = decode_$xy$(instruction)
        for (let reg = 0; reg <= x; reg++) {
            this.memory[this.I + reg] = this.V[reg]
        }
    }

    // Fx65 - LD Vx, [I]
    // Read registers V0 through Vx from memory starting at location I.
    // The interpreter reads values from memory starting at location I into registers V0 through Vx.
    loadIntoRegisters(instruction: number) {
        const { x } = decode_$xy$(instruction)
        for (let reg = 0; reg <= x; reg++) {
            this.V[reg] = this.memory[this.I + reg]
        }
    }
}


