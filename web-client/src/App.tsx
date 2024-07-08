import { Chip8 } from "chip8-emulator/dest/chip8"
import { EmulatorScreen, SCREEN_WIDTH } from "chip8-emulator/dest/screen"
import "./App.css"
import { useState } from "react"

/**
 * [*] setup client build
 * [*] load rom
 * [*] run in browser console
 * [*] draw to screen
 * [*] rom uploading
 * [ ] input handling
 * [ ] sound
 */

const CYCLE_RATE = 1000 / 160
const PIXEL_WIDTH = 12

const rom = new Uint8Array([
  0x00, 0xE0, 0xA2, 0x2A, 0x60, 0x0C, 0x61, 0x08, 0xD0, 0x1F, 0x70, 0x09, 0xA2, 0x39, 0xD0, 0x1F, 0xA2, 0x48, 0x70, 0x08, 0xD0, 0x1F, 0x70, 0x04, 0xA2, 0x57, 0xD0, 0x1F, 0x70, 0x08, 0xA2, 0x66, 0xD0, 0x1F, 0x70, 0x08, 0xA2, 0x75, 0xD0, 0x1F, 0x12, 0x28, 0xFF, 0x00, 0xFF, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0x3C, 0x00, 0xFF, 0x00, 0xFF, 0xFF, 0x00, 0xFF, 0x00, 0x38, 0x00, 0x3F, 0x00, 0x3F, 0x00, 0x38, 0x00, 0xFF, 0x00, 0xFF, 0x80, 0x00, 0xE0, 0x00, 0xE0, 0x00, 0x80, 0x00, 0x80, 0x00, 0xE0, 0x00, 0xE0, 0x00, 0x80, 0xF8, 0x00, 0xFC, 0x00, 0x3E, 0x00, 0x3F, 0x00, 0x3B, 0x00, 0x39, 0x00, 0xF8, 0x00, 0xF8, 0x03, 0x00, 0x07, 0x00, 0x0F, 0x00, 0xBF, 0x00, 0xFB, 0x00, 0xF3, 0x00, 0xE3, 0x00, 0x43, 0xE0, 0x00, 0xE0, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0x80, 0x00, 0xE0, 0x00, 0xE0
])

let screen = new EmulatorScreen()
let chip = new Chip8(screen)
chip.loadProgram(rom)

setInterval(() => {
  chip.cycle()
  draw(screen.buffer)
}, CYCLE_RATE)

const DEFAULT_PALLETTE = {
  background: "#996600",
  foreground: "#FFCC00"
} as const

function draw(buffer: Uint8Array) {
  const canvas = document.getElementById("screen") as HTMLCanvasElement | null;
  if (canvas === null) {
    console.warn("Canvas not found")
    return
  }
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    console.warn("Context not found")
    return
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.moveTo(0, 0);
  ctx.beginPath();
  for (let i = 0; i < buffer.length; i++) {
    ctx.fillStyle = buffer[i] ? DEFAULT_PALLETTE.foreground : DEFAULT_PALLETTE.background
    const x = (i % SCREEN_WIDTH) * PIXEL_WIDTH
    const y = Math.floor(i / SCREEN_WIDTH) * PIXEL_WIDTH
    ctx.fillRect(x, y, PIXEL_WIDTH, PIXEL_WIDTH);
  }
  ctx.closePath();
}

function App() {
  const [selectedFileName, setSelectedFileName] = useState("ibm_logo.ch8")

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files === null) {
      console.warn("No files found")
      return
    }
    const file = event.target.files[0]
    file.arrayBuffer().then(bytes => {
      setSelectedFileName(file.name)
      screen = new EmulatorScreen()
      chip = new Chip8(screen)
      chip.loadProgram(new Uint8Array(bytes))
    })
  }

  return (
    <div className="container">
      <canvas id="screen" width={64 * PIXEL_WIDTH} height={32 * PIXEL_WIDTH} />
      <p>Program: {selectedFileName}</p>
      <input type="file" accept=".ch8,.c8" onChange={handleFile} />
    </div>
  )
}

export default App
