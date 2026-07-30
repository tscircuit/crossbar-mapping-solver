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
  fanoutXFractions: [
    0.08, 0.11, 0.15, 0.19, 0.43, 0.46, 0.52, 0.55, 0.79, 0.82, 0.88, 0.94,
  ],
  fanoutSpacing: "clustered",
})
