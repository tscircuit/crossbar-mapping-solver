import { test } from "bun:test"
import type { InputProblem } from "lib/types"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

const inputProblem: InputProblem = {
  columns: [
    {
      x: 0,
      vias: [
        { y: 7, diameter: 0.8, netId: "D0" },
        { y: 5, diameter: 0.8, netId: "D1" },
        { y: 3, diameter: 0.8, netId: "D2" },
        { y: 1, diameter: 0.8, netId: "D3" },
      ],
    },
    {
      x: 4,
      vias: [
        { y: 7, diameter: 0.8, netId: "D0" },
        { y: 5, diameter: 0.8, netId: "D1" },
        { y: 3, diameter: 0.8, netId: "D2" },
        { y: 1, diameter: 0.8, netId: "D3" },
      ],
    },
  ],
}

test("example02 - two columns alternate left and right", async () => {
  await solveAndSnapshotExample({
    inputProblem,
    testPath: import.meta.path,
  })
})
