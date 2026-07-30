import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example03 = createExampleProblem({
  name: "example03 - three unevenly spaced routes",
  routeNetIds: ["N1", "N2", "N3"],
  busNetIds: createNumberedNetIds(4),
  columnCount: 6,
  fanoutXFractions: [0.38, 0.46, 0.65],
  fanoutSpacing: "nonuniform",
})
