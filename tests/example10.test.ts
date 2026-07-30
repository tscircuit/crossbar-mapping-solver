import { test } from "bun:test"
import { example10 } from "tests/fixtures/example10"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example10.name, async () => {
  await solveAndSnapshotExample({
    ...example10,
    testPath: import.meta.path,
  })
})
