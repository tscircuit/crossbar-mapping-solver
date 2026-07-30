import { test } from "bun:test"
import type { InputProblem } from "lib/types"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

const inputProblem: InputProblem = {
  columns: [
    {
      x: 0,
      vias: [
        { y: 4, diameter: 0.8, netId: "D0" },
        { y: 3.2, diameter: 0.8, netId: "D1" },
      ],
    },
  ],
}

test("example01 - one column selects both exterior gaps", async () => {
  await solveAndSnapshotExample({
    inputProblem,
    testPath: import.meta.path,
  })
})
