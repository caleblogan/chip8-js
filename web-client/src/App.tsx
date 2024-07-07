import { Chip8 } from "chip8-emulator/dest/chip8"
import { EmulatorScreen } from "chip8-emulator/dest/screen"

/**
 * [] setup client build
 * [] load rom
 * [] run in browser console
 */

const screen = new EmulatorScreen()
const chip = new Chip8(screen)
console.log(chip)

function App() {

  return (
    <>
    </>
  )
}

export default App
