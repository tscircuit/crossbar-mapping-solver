import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example01 = createExampleProblem({
  name: "example01 - one route, two columns, two buses",
  routeNetIds: ["N1"],
  busNetIds: createNumberedNetIds(2),
  columnCount: 2,
  sourceSpanRatio: 0,
})
