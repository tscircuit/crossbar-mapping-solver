import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example02 = createExampleProblem({
  name: "example02 - two routes, four columns, four buses",
  routeNetIds: ["N1", "N2"],
  busNetIds: createNumberedNetIds(4),
  columnCount: 4,
  sourceSpanRatio: 0.15,
})
