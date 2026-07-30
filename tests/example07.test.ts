import { test } from "bun:test"
import { example07 } from "tests/fixtures/example07"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example07.name, async () => {
  await solveAndSnapshotExample({
    ...example07,
    testPath: import.meta.path,
  })
})
