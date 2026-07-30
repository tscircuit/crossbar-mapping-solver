import { test } from "bun:test"
import { example09 } from "tests/fixtures/example09"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example09.name, async () => {
  await solveAndSnapshotExample({
    ...example09,
    testPath: import.meta.path,
  })
})
