import { test } from "bun:test"
import type { InputProblem } from "lib/types"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

const inputProblem: InputProblem = {
  fanoutPoints: [
    { x: 1, y: 8, netId: "N1" },
    { x: 3, y: 8, netId: "N2" },
  ],
  columns: [
    {
      x: 0,
      vias: [
        { y: 2, diameter: 0.8, netId: "N1" },
        { y: 0, diameter: 0.8, netId: "N3" },
      ],
    },
    {
      x: 2,
      vias: [
        { y: 2, diameter: 0.8, netId: "N2" },
        { y: 0, diameter: 0.8, netId: "N4" },
      ],
    },
    {
      x: 4,
      vias: [
        { y: 2, diameter: 0.8, netId: "N1" },
        { y: 0, diameter: 0.8, netId: "N3" },
      ],
    },
  ],
}

test("example01 - aligned fanout maps into alternating columns", async () => {
  await solveAndSnapshotExample({
    inputProblem,
    testPath: import.meta.path,
  })
})
