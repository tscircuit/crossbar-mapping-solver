import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example03 = createExampleProblem({
  name: "example03 - three routes, six alternating columns",
  routeNetIds: ["N1", "N2", "N3"],
  busNetIds: createNumberedNetIds(4),
  columnCount: 6,
  sourceSpanRatio: 0.2,
})
