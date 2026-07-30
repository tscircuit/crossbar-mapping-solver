import type { InputProblem } from "lib/types"

export interface ExampleExpectations {
  routeCount: number
  columnCount: number
  busCount: number
  routedNetCount: number
  fanoutSpacing: "single" | "pair" | "nonuniform" | "clustered"
  routeNetCounts?: Record<string, number>
}

export interface ExampleProblemFixture {
  name: string
  inputProblem: InputProblem
  expected: ExampleExpectations
  animationSpeed: number
}

export interface CreateExampleProblemOptions {
  name: string
  routeNetIds: Array<string>
  busNetIds: Array<string>
  columnCount: number
  fanoutXFractions?: Array<number>
  fanoutSpacing: ExampleExpectations["fanoutSpacing"]
  sourceSpanRatio?: number
  columnPitch?: number
  rowPitch?: number
  spreadHeight?: number
  viaDiameter?: number
  varyViaDiameters?: boolean
  unsortedColumns?: boolean
  animationSpeed?: number
  expectedRouteNetCounts?: Record<string, number>
}

export const createNumberedNetIds = (count: number): Array<string> =>
  Array.from({ length: count }, (_, index) => `N${index + 1}`)

export const createExampleProblem = ({
  name,
  routeNetIds,
  busNetIds,
  columnCount,
  fanoutXFractions,
  fanoutSpacing,
  sourceSpanRatio = 0.4,
  columnPitch = 2,
  rowPitch = 2,
  spreadHeight = 7,
  viaDiameter = 0.8,
  varyViaDiameters = false,
  unsortedColumns = false,
  animationSpeed = 80,
  expectedRouteNetCounts,
}: CreateExampleProblemOptions): ExampleProblemFixture => {
  if (busNetIds.length === 0 || busNetIds.length % 2 !== 0) {
    throw new Error("busNetIds must contain an even number of bus nets")
  }
  if (columnCount < 2) {
    throw new Error("columnCount must be at least two")
  }
  if (routeNetIds.length === 0) {
    throw new Error("routeNetIds must contain at least one routed net")
  }
  if (fanoutXFractions && fanoutXFractions.length !== routeNetIds.length) {
    throw new Error(
      "fanoutXFractions must contain one position for every routed net",
    )
  }
  if (
    fanoutXFractions?.some(
      (fraction) => !Number.isFinite(fraction) || fraction < 0 || fraction > 1,
    )
  ) {
    throw new Error("fanoutXFractions must be finite values from zero to one")
  }
  if (
    fanoutXFractions &&
    new Set(fanoutXFractions).size !== fanoutXFractions.length
  ) {
    throw new Error("fanoutXFractions must contain unique positions")
  }

  const busNetIdSet = new Set(busNetIds)

  for (const netId of routeNetIds) {
    if (!busNetIdSet.has(netId)) {
      throw new Error(`Routed net ${netId} is not present in busNetIds`)
    }
  }

  const rowCount = busNetIds.length / 2
  const maxViaDiameter = varyViaDiameters ? viaDiameter + 0.16 : viaDiameter
  const topViaY = (rowCount - 1) * rowPitch
  const fanoutLineY = topViaY + maxViaDiameter / 2 + spreadHeight
  const maximumColumnX = (columnCount - 1) * columnPitch
  const sourceSpan = maximumColumnX * sourceSpanRatio
  const sourceMinX = (maximumColumnX - sourceSpan) / 2
  const sourceMaxX = sourceMinX + sourceSpan
  const fanoutPoints = routeNetIds.map((netId, routeIndex) => ({
    x: fanoutXFractions
      ? maximumColumnX * fanoutXFractions[routeIndex]!
      : routeNetIds.length === 1
        ? maximumColumnX / 2
        : sourceMinX +
          (sourceMaxX - sourceMinX) * (routeIndex / (routeNetIds.length - 1)),
    y: fanoutLineY,
    netId,
  }))
  const sortedColumns = Array.from(
    { length: columnCount },
    (_, columnIndex) => ({
      x: columnIndex * columnPitch,
      vias: Array.from({ length: rowCount }, (_, rowIndex) => ({
        y: (rowCount - rowIndex - 1) * rowPitch,
        diameter: varyViaDiameters
          ? viaDiameter + (((columnIndex * 7 + rowIndex * 3) % 5) - 2) * 0.08
          : viaDiameter,
        netId: busNetIds[rowIndex * 2 + (columnIndex % 2)]!,
      })),
    }),
  )
  const columns = unsortedColumns
    ? [
        ...sortedColumns.filter((_, index) => index % 2 === 1).reverse(),
        ...sortedColumns.filter((_, index) => index % 2 === 0),
      ]
    : sortedColumns

  return {
    name,
    inputProblem: {
      fanoutPoints,
      columns,
    },
    expected: {
      routeCount: routeNetIds.length,
      columnCount,
      busCount: busNetIds.length,
      routedNetCount: new Set(routeNetIds).size,
      fanoutSpacing,
      routeNetCounts: expectedRouteNetCounts,
    },
    animationSpeed,
  }
}
