import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example04 = createExampleProblem({
  name: "example04 - one tight fanout cluster and one outlier",
  routeNetIds: ["N1", "N2", "N3", "N4"],
  busNetIds: createNumberedNetIds(6),
  columnCount: 8,
  fanoutXFractions: [0.28, 0.33, 0.39, 0.72],
  fanoutSpacing: "clustered",
  varyViaDiameters: true,
})
