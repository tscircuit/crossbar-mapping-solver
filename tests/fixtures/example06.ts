import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example06 = createExampleProblem({
  name: "example06 - unsorted fanout points and columns",
  routeNetIds: ["N1", "N2", "N3", "N4", "N5", "N6", "N1", "N2"],
  busNetIds: createNumberedNetIds(8),
  columnCount: 16,
  fanoutXFractions: [0.78, 0.12, 0.18, 0.42, 0.47, 0.51, 0.83, 0.91],
  fanoutSpacing: "clustered",
  varyViaDiameters: true,
  unsortedColumns: true,
})
