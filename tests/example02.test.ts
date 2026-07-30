import { test } from "bun:test"
import type { InputProblem } from "lib/types"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

const oddColumnVias = [
  { y: 2, diameter: 0.8, netId: "N1" },
  { y: 0, diameter: 0.8, netId: "N3" },
]
const evenColumnVias = [
  { y: 2, diameter: 0.8, netId: "N2" },
  { y: 0, diameter: 0.8, netId: "N4" },
]

const inputProblem: InputProblem = {
  fanoutPoints: [
    { x: 4, y: 10, netId: "N1" },
    { x: 5, y: 10, netId: "N2" },
    { x: 6, y: 10, netId: "N3" },
  ],
  columns: [
    { x: 0, vias: oddColumnVias },
    { x: 2, vias: evenColumnVias },
    { x: 4, vias: oddColumnVias },
    { x: 6, vias: evenColumnVias },
    { x: 8, vias: oddColumnVias },
    { x: 10, vias: evenColumnVias },
  ],
}

test("example02 - diagram layout with three fanouts and six columns", async () => {
  await solveAndSnapshotExample({
    inputProblem,
    testPath: import.meta.path,
  })
})
