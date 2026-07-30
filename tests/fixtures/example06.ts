import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example06 = createExampleProblem({
  name: "example06 - eight routes with unsorted input columns",
  routeNetIds: ["N1", "N2", "N3", "N4", "N5", "N6", "N1", "N2"],
  busNetIds: createNumberedNetIds(8),
  columnCount: 16,
  sourceSpanRatio: 0.48,
  varyViaDiameters: true,
  unsortedColumns: true,
})
