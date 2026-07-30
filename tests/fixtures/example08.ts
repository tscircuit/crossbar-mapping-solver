import { createExampleProblem } from "./create-example-problem"

const busNetIds = [
  "NET",
  "VCC",
  "N1",
  "N2",
  "N3",
  "N4",
  "N5",
  "N6",
  "N7",
  "N8",
  "N9",
  "N10",
]

export const example08 = createExampleProblem({
  name: "example08 - eighteen routes across thirty-six columns",
  routeNetIds: [
    "NET",
    "VCC",
    "N1",
    "NET",
    "VCC",
    "N2",
    "NET",
    "VCC",
    "N3",
    "N4",
    "N5",
    "N6",
    "N7",
    "N8",
    "N9",
    "N10",
    "NET",
    "VCC",
  ],
  busNetIds,
  columnCount: 36,
  fanoutXFractions: [
    0.04, 0.06, 0.09, 0.14, 0.18, 0.37, 0.39, 0.42, 0.48, 0.53, 0.57, 0.73,
    0.75, 0.78, 0.82, 0.87, 0.92, 0.96,
  ],
  fanoutSpacing: "clustered",
  varyViaDiameters: true,
})
