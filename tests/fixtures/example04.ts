import {
  createExampleProblem,
  createNumberedNetIds,
} from "./create-example-problem"

export const example04 = createExampleProblem({
  name: "example04 - four routes with mixed via diameters",
  routeNetIds: ["N1", "N2", "N3", "N4"],
  busNetIds: createNumberedNetIds(6),
  columnCount: 8,
  sourceSpanRatio: 0.3,
  varyViaDiameters: true,
})
