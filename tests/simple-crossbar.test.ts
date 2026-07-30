import { expect, test } from "bun:test"
import { CrossbarMappingSolver } from "lib/crossbar-mapping-solver"
import { simpleProblem } from "tests/fixtures/simple-problem"

test("routes a simple alternating crossbar and snapshots its output", async () => {
  const solver = new CrossbarMappingSolver(simpleProblem)

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)

  const output = solver.getOutput()
  expect(output.netOrder).toEqual(["D0", "D1", "D2", "D3"])
  expect(output.paths).toHaveLength(12)
  expect(output.columnGaps.map((gap) => gap.netParity)).toEqual([
    "even",
    "odd",
    "even",
    "odd",
  ])
  expect(
    output.paths
      .filter((path) => path.columnIndex === 0)
      .map((path) => [path.netId, path.turnDirection]),
  ).toEqual([
    ["D0", "left"],
    ["D1", "right"],
    ["D2", "left"],
    ["D3", "right"],
  ])

  await expect(solver.visualize()).toMatchGraphicsSvg(import.meta.path, {
    svgName: "simple-output",
  })
})
