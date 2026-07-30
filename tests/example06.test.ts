import { test } from "bun:test"
import { example06 } from "tests/fixtures/example06"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example06.name, async () => {
  await solveAndSnapshotExample({
    ...example06,
    testPath: import.meta.path,
  })
})
