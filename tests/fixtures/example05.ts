import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example05 = createExampleProblem({
  name: "example05 - two asymmetric fanout clusters",
  routeNetIds: ["N1", "N2", "N3", "N4", "N1", "N5"],
  busNetIds: createNumberedNetIds(8),
  columnCount: 12,
  fanoutXFractions: [0.18, 0.22, 0.27, 0.66, 0.74, 0.9],
  fanoutSpacing: "clustered",
})
