import { Chip8 } from "./chip8";

const chip8 = new Chip8()
chip8.loadProgram(new Uint8Array([0x70, 0xFF, 0x61, 0x02]))
chip8.cycle()

console.log(`PC: ${chip8.PC} V0: ${chip8.V[0]} V1: ${chip8.V[1]}`)
