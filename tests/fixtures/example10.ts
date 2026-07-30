import { createExampleProblem } from "./create-example-problem"

const signalNetIds = Array.from(
  { length: 18 },
  (_, index) => `BUS${String(index + 1).padStart(2, "0")}`,
)
const busNetIds = ["NET", "VCC", ...signalNetIds]
const routedSignalNetIds = signalNetIds.slice(0, 14)
const routeNetIds = routedSignalNetIds.flatMap((netId, index) => [
  netId,
  ...(index < 13 ? ["NET", "VCC"] : []),
])
const fanoutXFractions = [
  ...Array.from({ length: 10 }, (_, index) => 0.02 + index * 0.012),
  ...Array.from({ length: 10 }, (_, index) => 0.3 + index * 0.014),
  ...Array.from({ length: 10 }, (_, index) => 0.58 + index * 0.016),
  ...Array.from({ length: 10 }, (_, index) => 0.82 + index * 0.017),
]

export const example10 = createExampleProblem({
  name: "example10 - forty routes, sixteen routed nets, eighty columns, twenty buses",
  routeNetIds,
  busNetIds,
  columnCount: 80,
  fanoutXFractions,
  fanoutSpacing: "clustered",
  varyViaDiameters: true,
  animationSpeed: 30,
  expectedRouteNetCounts: {
    NET: 13,
    VCC: 13,
  },
})
