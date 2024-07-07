import { Chip8 } from "./chip8";


export class Chip8Error extends Error {
    constructor(message: string, public chip8: Chip8, public instruction: number) {
        super(message);
        this.name = "Chip8Error";
    }
}
