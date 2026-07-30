import { test } from "bun:test"
import { example08 } from "tests/fixtures/example08"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example08.name, async () => {
  await solveAndSnapshotExample({
    ...example08,
    testPath: import.meta.path,
  })
})
