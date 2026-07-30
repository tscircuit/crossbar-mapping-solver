import { test } from "bun:test"
import type { InputProblem } from "lib/types"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

const inputProblem: InputProblem = {
  fanoutPoints: [
    { x: 1, y: 12, netId: "N4" },
    { x: 4.5, y: 12, netId: "N1" },
    { x: 7, y: 12, netId: "N2" },
  ],
  columns: [
    {
      x: 8,
      vias: [
        { y: 3, diameter: 1, netId: "N1" },
        { y: 1, diameter: 0.8, netId: "N3" },
      ],
    },
    {
      x: 0,
      vias: [
        { y: 3, diameter: 0.9, netId: "N1" },
        { y: 1, diameter: 0.7, netId: "N3" },
      ],
    },
    {
      x: 6,
      vias: [
        { y: 3, diameter: 0.8, netId: "N2" },
        { y: 1, diameter: 1, netId: "N4" },
      ],
    },
    {
      x: 2,
      vias: [
        { y: 3, diameter: 0.8, netId: "N2" },
        { y: 1, diameter: 0.9, netId: "N4" },
      ],
    },
    {
      x: 4,
      vias: [
        { y: 3, diameter: 0.7, netId: "N1" },
        { y: 1, diameter: 0.8, netId: "N3" },
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
