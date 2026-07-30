import type {
  BusPad,
  ColumnGap,
  CrossbarMappingOutput,
  FanoutColumn,
  FanoutPoint,
  InputProblem,
  NetParity,
  Point2D,
  RoutedFanoutPath,
} from "./types"

interface IndexedColumn {
  column: FanoutColumn
  originalColumnIndex: number
  maxRadius: number
}

interface IndexedVia {
  column: IndexedColumn
  sortedColumnIndex: number
  via: FanoutPoint
  viaIndex: number
}

const getParity = (index: number): NetParity =>
  index % 2 === 0 ? "even" : "odd"

const assertFiniteNumber = (value: number, name: string) => {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

const removeConsecutiveDuplicatePoints = (
  points: Array<Point2D>,
): Array<Point2D> =>
  points.filter(
    (point, index) =>
      index === 0 ||
      point.x !== points[index - 1]?.x ||
      point.y !== points[index - 1]?.y,
  )

const validateAndSortColumns = (
  inputProblem: InputProblem,
): Array<IndexedColumn> => {
  if (inputProblem.columns.length === 0) {
    throw new Error("InputProblem.columns must contain at least one column")
  }

  const columns = inputProblem.columns.map((column, columnIndex) => {
    assertFiniteNumber(column.x, `columns[${columnIndex}].x`)

    if (column.vias.length === 0) {
      throw new Error(
        `columns[${columnIndex}].vias must contain at least one via`,
      )
    }

    for (const [viaIndex, via] of column.vias.entries()) {
      assertFiniteNumber(via.y, `columns[${columnIndex}].vias[${viaIndex}].y`)
      assertFiniteNumber(
        via.diameter,
        `columns[${columnIndex}].vias[${viaIndex}].diameter`,
      )
      if (via.diameter <= 0) {
        throw new Error(
          `columns[${columnIndex}].vias[${viaIndex}].diameter must be greater than zero`,
        )
      }
      if (via.netId.trim() === "") {
        throw new Error(
          `columns[${columnIndex}].vias[${viaIndex}].netId must not be empty`,
        )
      }
    }

    return {
      column,
      originalColumnIndex: columnIndex,
      maxRadius: Math.max(...column.vias.map((via) => via.diameter / 2)),
    }
  })

  columns.sort((a, b) => a.column.x - b.column.x)

  for (let index = 1; index < columns.length; index++) {
    if (columns[index - 1]!.column.x === columns[index]!.column.x) {
      throw new Error("Fanout columns must have unique X coordinates")
    }
  }

  return columns
}

const getNetOrder = (columns: Array<IndexedColumn>): Array<string> => {
  const netOrder: Array<string> = []
  const seenNetIds = new Set<string>()

  for (const { column } of columns) {
    const viasTopToBottom = column.vias
      .map((via, viaIndex) => ({ via, viaIndex }))
      .sort((a, b) => b.via.y - a.via.y || a.viaIndex - b.viaIndex)

    for (const { via } of viasTopToBottom) {
      if (seenNetIds.has(via.netId)) continue
      seenNetIds.add(via.netId)
      netOrder.push(via.netId)
    }
  }

  return netOrder
}

const createColumnGaps = (
  columns: Array<IndexedColumn>,
  maxViaDiameter: number,
): Array<ColumnGap> => {
  const internalBounds: Array<{ minX: number; maxX: number }> = []

  for (let index = 1; index < columns.length; index++) {
    const leftColumn = columns[index - 1]!
    const rightColumn = columns[index]!
    const minX = leftColumn.column.x + leftColumn.maxRadius
    const maxX = rightColumn.column.x - rightColumn.maxRadius

    if (maxX <= minX) {
      throw new Error(
        `Fanout columns at x=${leftColumn.column.x} and x=${rightColumn.column.x} do not leave a routing gap`,
      )
    }

    internalBounds.push({ minX, maxX })
  }

  const fallbackExteriorWidth = Math.max(maxViaDiameter * 2, 1)
  const exteriorWidth =
    internalBounds.length === 0
      ? fallbackExteriorWidth
      : Math.max(
          fallbackExteriorWidth,
          ...internalBounds.map(({ minX, maxX }) => maxX - minX),
        )
  const firstColumn = columns[0]!
  const lastColumn = columns[columns.length - 1]!
  const gaps: Array<ColumnGap> = [
    {
      columnGapIndex: 0,
      netParity: "even",
      minX: firstColumn.column.x - firstColumn.maxRadius - exteriorWidth,
      maxX: firstColumn.column.x - firstColumn.maxRadius,
      tracks: [],
    },
  ]

  for (const [index, bounds] of internalBounds.entries()) {
    gaps.push({
      columnGapIndex: index + 1,
      netParity: getParity(index + 1),
      ...bounds,
      tracks: [],
    })
  }

  gaps.push({
    columnGapIndex: columns.length,
    netParity: getParity(columns.length),
    minX: lastColumn.column.x + lastColumn.maxRadius,
    maxX: lastColumn.column.x + lastColumn.maxRadius + exteriorWidth,
    tracks: [],
  })

  return gaps
}

export const planCrossbarMapping = (
  inputProblem: InputProblem,
): CrossbarMappingOutput => {
  const columns = validateAndSortColumns(inputProblem)
  const indexedVias: Array<IndexedVia> = columns.flatMap(
    (column, sortedColumnIndex) =>
      column.column.vias.map((via, viaIndex) => ({
        column,
        sortedColumnIndex,
        via,
        viaIndex,
      })),
  )
  const maxViaDiameter = Math.max(...indexedVias.map(({ via }) => via.diameter))
  const netOrder = getNetOrder(columns)
  const netIndexById = new Map(
    netOrder.map((netId, netIndex) => [netId, netIndex]),
  )
  const columnGaps = createColumnGaps(columns, maxViaDiameter)
  const assignedNetIdsByGap = columnGaps.map(() => new Set<string>())

  for (const { sortedColumnIndex, via } of indexedVias) {
    const netIndex = netIndexById.get(via.netId)!
    const leftGapIndex = sortedColumnIndex
    const requiredParity = getParity(netIndex)
    const selectedGapIndex =
      columnGaps[leftGapIndex]!.netParity === requiredParity
        ? leftGapIndex
        : leftGapIndex + 1
    assignedNetIdsByGap[selectedGapIndex]!.add(via.netId)
  }

  for (const gap of columnGaps) {
    const assignedNetIds = [...assignedNetIdsByGap[gap.columnGapIndex]!].sort(
      (a, b) => netIndexById.get(a)! - netIndexById.get(b)!,
    )
    const gapWidth = gap.maxX - gap.minX

    gap.tracks = assignedNetIds.map((netId, trackIndex) => ({
      netId,
      x: gap.minX + (gapWidth * (trackIndex + 1)) / (assignedNetIds.length + 1),
    }))
  }

  const minViaEdgeY = Math.min(
    ...indexedVias.map(({ via }) => via.y - via.diameter / 2),
  )
  const fanoutLineY = minViaEdgeY
  const spreadPitch = Math.max(maxViaDiameter * 0.45, 0.2)
  const spreadClearance = Math.max(maxViaDiameter, 0.5)
  const firstSpreadY = fanoutLineY - spreadClearance
  const spreadYByRoute = indexedVias.map(
    (_, routeIndex) => firstSpreadY - routeIndex * spreadPitch,
  )
  const lastSpreadY = spreadYByRoute[spreadYByRoute.length - 1]!
  const spreadZone = {
    minY: lastSpreadY - spreadPitch / 2,
    maxY: firstSpreadY + spreadPitch / 2,
  }
  const busPitch = maxViaDiameter * 1.5
  const firstBusY = spreadZone.minY - maxViaDiameter * 1.5
  const rightmostGap = columnGaps[columnGaps.length - 1]!
  const busPadX =
    rightmostGap.maxX + Math.max(rightmostGap.maxX - rightmostGap.minX, 1)
  const diameterByNet = new Map<string, number>()

  for (const { via } of indexedVias) {
    diameterByNet.set(
      via.netId,
      Math.max(diameterByNet.get(via.netId) ?? 0, via.diameter),
    )
  }

  const busPads: Array<BusPad> = netOrder.map((netId, netIndex) => ({
    netId,
    x: busPadX,
    y: firstBusY - netIndex * busPitch,
    diameter: diameterByNet.get(netId)!,
  }))
  const busPadByNetId = new Map(busPads.map((pad) => [pad.netId, pad]))
  const paths: Array<RoutedFanoutPath> = indexedVias.map(
    ({ column, sortedColumnIndex, via, viaIndex }, routeIndex) => {
      const netIndex = netIndexById.get(via.netId)!
      const leftGapIndex = sortedColumnIndex
      const selectedGapIndex =
        columnGaps[leftGapIndex]!.netParity === getParity(netIndex)
          ? leftGapIndex
          : leftGapIndex + 1
      const selectedGap = columnGaps[selectedGapIndex]!
      const track = selectedGap.tracks.find(({ netId }) => netId === via.netId)!
      const busPad = busPadByNetId.get(via.netId)!
      const start = { x: column.column.x, y: via.y }
      const spreadY = spreadYByRoute[routeIndex]!

      return {
        columnIndex: column.originalColumnIndex,
        viaIndex,
        netId: via.netId,
        columnGapIndex: selectedGapIndex,
        turnDirection: track.x < start.x ? "left" : "right",
        spreadY,
        points: removeConsecutiveDuplicatePoints([
          start,
          { x: start.x, y: spreadY },
          { x: track.x, y: spreadY },
          { x: track.x, y: busPad.y },
          { x: busPad.x, y: busPad.y },
        ]),
      }
    },
  )

  return {
    netOrder,
    columnGaps,
    busPads,
    paths,
    fanoutLineY,
    spreadZone,
  }
}
