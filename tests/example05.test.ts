import { test } from "bun:test"
import { example05 } from "tests/fixtures/example05"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example05.name, async () => {
  await solveAndSnapshotExample({
    ...example05,
    testPath: import.meta.path,
  })
})
