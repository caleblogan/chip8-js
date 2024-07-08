## Chip 8 Emulator (Interpreter)
This is a web based interpreter for the chip 8 VM. The web-client directory contains the react app that handles all ui for the emulator.
The meat of the chip8 interpreter is in the chip8 directory. 

### Resources used
- Overview of all opcodes - http://devernay.free.fr/hacks/chip8/C8TECH10.HTM
- Test Rom - https://github.com/corax89/chip8-test-rom
- Roms - https://github.com/JohnEarnest/chip8Archive/tree/master/roms

### Build
Required node and npm.

#### chip8 lib
- `cd chip8 &&`
- `npm i && npx tsc` This should work. If not, install typescript globally and use `tsc`

#### web-client
- `cd web-client`
- `npm i`
- `npm run dev`
- `navigate in your browser to localhost:5173`

