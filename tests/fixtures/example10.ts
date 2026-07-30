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

export const example10 = createExampleProblem({
  name: "example10 - forty routes, sixteen routed nets, eighty columns, twenty buses",
  routeNetIds,
  busNetIds,
  columnCount: 80,
  sourceSpanRatio: 0.88,
  varyViaDiameters: true,
  animationSpeed: 30,
  expectedRouteNetCounts: {
    NET: 13,
    VCC: 13,
  },
})
