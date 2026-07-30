import { test } from "bun:test"
import { example01 } from "tests/fixtures/example01"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example01.name, async () => {
  await solveAndSnapshotExample({
    ...example01,
    testPath: import.meta.path,
  })
})
