import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example05 = createExampleProblem({
  name: "example05 - six routes with a repeated bus net",
  routeNetIds: ["N1", "N2", "N3", "N4", "N1", "N5"],
  busNetIds: createNumberedNetIds(8),
  columnCount: 12,
  sourceSpanRatio: 0.4,
})
