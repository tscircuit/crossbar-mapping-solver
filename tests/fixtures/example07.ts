import { createExampleProblem } from "./create-example-problem"

const busNetIds = ["NET", "VCC", "N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"]

export const example07 = createExampleProblem({
  name: "example07 - twelve routes introduce shared NET and VCC buses",
  routeNetIds: [
    "NET",
    "VCC",
    "N1",
    "N2",
    "NET",
    "VCC",
    "N3",
    "N4",
    "NET",
    "VCC",
    "N5",
    "N6",
  ],
  busNetIds,
  columnCount: 24,
  sourceSpanRatio: 0.58,
})
