import { Chip8 } from "./chip8";
import fs from "fs"
import { EmulatorScreen } from "./screen";

/**
 * input
 */

const CYCLE_RATE = 1000 / 160

export async function main() {
    const screen = new EmulatorScreen()
    const chip8 = new Chip8(screen)
    // const file = await readROM("../roms/test_opcode.ch8")
    // const file = await readROM("../roms/c8_test.c8")
    const file = await readROM(process.argv[2] ?? "../roms/IBM Logo.ch8")
    chip8.loadProgram(file)

    let lastUpdate = Date.now()
    while (true) {
        const dt = Date.now() - lastUpdate
        if (dt >= CYCLE_RATE) {
            chip8.cycle()
            lastUpdate = Date.now()
            screen.draw()
        }
    }
}

async function readROM(path: string) {
    const file = fs.readFileSync(path)
    const bytes = new Uint8Array(file)
    return bytes
}


main()