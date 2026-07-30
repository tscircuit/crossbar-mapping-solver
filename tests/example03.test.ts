import { test } from "bun:test"
import type { InputProblem } from "lib/types"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

const inputProblem: InputProblem = {
  columns: [
    {
      x: 8,
      vias: [
        { y: 8, diameter: 1, netId: "CLK" },
        { y: 5.5, diameter: 0.8, netId: "DATA0" },
        { y: 3, diameter: 0.9, netId: "DATA1" },
      ],
    },
    {
      x: 0,
      vias: [
        { y: 8, diameter: 1, netId: "CLK" },
        { y: 5.5, diameter: 0.8, netId: "DATA0" },
        { y: 3, diameter: 0.9, netId: "DATA1" },
      ],
    },
    {
      x: 4,
      vias: [
        { y: 8, diameter: 1, netId: "CLK" },
        { y: 5.5, diameter: 0.8, netId: "DATA0" },
        { y: 3, diameter: 0.9, netId: "DATA1" },
      ],
    },
  ],
}

test("example03 - unsorted columns and mixed via sizes", async () => {
  await solveAndSnapshotExample({
    inputProblem,
    testPath: import.meta.path,
  })
})
