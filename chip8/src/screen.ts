import { assertUint8, getBit } from "./instructionHelpers"

export const SCREEN_WIDTH = 64
export const SCREEN_HEIGHT = 32

export class EmulatorScreen {
    buffer = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT)
    constructor() {
        this.clearBuffer()
    }

    clearBuffer() {
        this.buffer.fill(0)
    }

    writeByteToBuffer(x: number, y: number, byte: number) {
        // Ignore this check for now; it seems that the original implementation does not throw an error
        // if (x < 0 || x >= SCREEN_WIDTH) {
        //     throw new Error(`invalid x when drawing; value should be between 0 and ${SCREEN_WIDTH}`)
        // }
        // if (y < 0 || y >= SCREEN_HEIGHT) {
        // }
        assertUint8(byte)
        let collision = false

        for (let i = 7; i >= 0; i--) {
            const col = (x + 7 - i) % SCREEN_WIDTH
            const index = col + (y * SCREEN_WIDTH)
            if (this.buffer[index] && getBit(byte, i)) {
                collision = true
            }
            this.buffer[index] ^= getBit(byte, i)
        }
        return collision
    }

    drawConsole() {
        console.clear()
        const line = []
        for (let row = 0; row < SCREEN_HEIGHT; row++) {
            for (let col = 0; col < SCREEN_WIDTH; col++) {
                if (this.buffer[col + (row * SCREEN_WIDTH)]) {
                    line.push("*")
                } else {
                    line.push(" ")
                }
            }
            line.push("\n")
        }
        console.log(line.join(""))
    }

}