import { assertUint8 } from "./instructionHelpers"

export const SCREEN_WIDTH = 64
export const SCREEN_HEIGHT = 32

export class EmulatorScreen {
    data = new Uint8Array((SCREEN_WIDTH * SCREEN_HEIGHT) / 8)
    constructor() {
        this.clear()
    }

    clear() {
        this.data.fill(0)
    }

    drawByte(x: number, y: number, byte: number) {
        if (x < 0 || x >= SCREEN_WIDTH) {
            throw new Error(`invalid x when drawing; value should be between 0 and ${SCREEN_WIDTH}`)
        }
        if (y < 0 || y >= SCREEN_HEIGHT) {
            throw new Error(`invalid y when drawing; value hsould be between 0 and ${SCREEN_HEIGHT}`)
        }
        assertUint8(byte)
        console.log(byte.toString(2).padStart(8, "0").split("").map(c => c === "1" ? "*" : " ").join(""))
    }

}