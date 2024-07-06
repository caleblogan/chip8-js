import { Chip8 } from "./chip8";
import fs from "fs"

async function main() {
    const chip8 = new Chip8()
    // chip8.loadProgram(new Uint8Array([0x70, 0xFF, 0x61, 0x02]))
    // const file = await readFile("./roms/IBM Logo.ch8")
    const file = await readFile("./roms/test_opcode.ch8")
    chip8.loadProgram(file)
    for (let i = 0; i < 1000; i++) {
        chip8.cycle()

    }

    console.log(`PC: ${chip8.PC} V0: ${chip8.V[0]} V1: ${chip8.V[1]}`)
}

async function readFile(path: string) {
    const file = fs.readFileSync(path)
    const bytes = new Uint8Array(file)
    return bytes
}


main()