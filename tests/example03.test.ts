import { test } from "bun:test"
import { example03 } from "tests/fixtures/example03"
import { solveAndSnapshotExample } from "tests/fixtures/solve-and-snapshot-example"

test(example03.name, async () => {
  await solveAndSnapshotExample({
    ...example03,
    testPath: import.meta.path,
  })
})
