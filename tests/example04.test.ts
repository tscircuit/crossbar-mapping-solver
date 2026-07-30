import { test } from "bun:test"
import { example04 } from "tests/fixtures/example04"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example04.name, async () => {
  await solveAndSnapshotExample({
    ...example04,
    testPath: import.meta.path,
  })
})
