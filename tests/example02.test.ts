import { test } from "bun:test"
import { example02 } from "tests/fixtures/example02"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example02.name, async () => {
  await solveAndSnapshotExample({
    ...example02,
    testPath: import.meta.path,
  })
})
