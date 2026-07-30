import type {
  ColumnGap,
  CrossbarColumn,
  CrossbarMappingOutput,
  CrossbarPad,
  CrossbarTrack,
  CrossbarVia,
  FanoutPoint,
  InputProblem,
  RoutedFanoutPath,
} from "./types"

interface IndexedColumn {
  column: CrossbarColumn
  originalColumnIndex: number
  maxRadius: number
}

interface TargetVia {
  column: IndexedColumn
  via: CrossbarVia
  viaIndex: number
}

interface RouteAssignment {
  fanoutPointIndex: number
  gap: ColumnGap
  targetCandidates: Array<TargetVia>
}

const assertFiniteNumber = (value: number, name: string) => {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

const validateFanoutPoints = (fanoutPoints: Array<FanoutPoint>): number => {
  if (fanoutPoints.length === 0) {
    throw new Error("InputProblem.fanoutPoints must contain at least one point")
  }

  const fanoutLineY = fanoutPoints[0]!.y
  const seenXCoordinates = new Set<number>()

  for (const [fanoutPointIndex, fanoutPoint] of fanoutPoints.entries()) {
    assertFiniteNumber(fanoutPoint.x, `fanoutPoints[${fanoutPointIndex}].x`)
    assertFiniteNumber(fanoutPoint.y, `fanoutPoints[${fanoutPointIndex}].y`)

    if (fanoutPoint.netId.trim() === "") {
      throw new Error(
        `fanoutPoints[${fanoutPointIndex}].netId must not be empty`,
      )
    }
    if (fanoutPoint.y !== fanoutLineY) {
      throw new Error(
        "All fanoutPoints must share one Y coordinate on the horizontal fanout line",
      )
    }
    if (seenXCoordinates.has(fanoutPoint.x)) {
      throw new Error("Fanout points must have unique X coordinates")
    }

    seenXCoordinates.add(fanoutPoint.x)
  }

  return fanoutLineY
}

const validateAndSortColumns = (
  columnsInput: Array<CrossbarColumn>,
  fanoutLineY: number,
): Array<IndexedColumn> => {
  if (columnsInput.length < 2) {
    throw new Error(
      "InputProblem.columns must contain at least two crossbar columns",
    )
  }

  const columns = columnsInput.map((column, columnIndex) => {
    assertFiniteNumber(column.x, `columns[${columnIndex}].x`)

    if (column.vias.length === 0) {
      throw new Error(
        `columns[${columnIndex}].vias must contain at least one via`,
      )
    }

    const seenNetIds = new Set<string>()

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
      if (seenNetIds.has(via.netId)) {
        throw new Error(
          `columns[${columnIndex}] must not contain duplicate vias for net ${via.netId}`,
        )
      }
      if (via.y + via.diameter / 2 >= fanoutLineY) {
        throw new Error(
          `columns[${columnIndex}].vias[${viaIndex}] must be below the horizontal fanout line`,
        )
      }

      seenNetIds.add(via.netId)
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
      throw new Error("Crossbar columns must have unique X coordinates")
    }
  }

  return columns
}

const createColumnGaps = (columns: Array<IndexedColumn>): Array<ColumnGap> => {
  const gaps: Array<ColumnGap> = []

  for (
    let columnGapIndex = 0;
    columnGapIndex < columns.length - 1;
    columnGapIndex++
  ) {
    const leftColumn = columns[columnGapIndex]!
    const rightColumn = columns[columnGapIndex + 1]!
    const minX = leftColumn.column.x + leftColumn.maxRadius
    const maxX = rightColumn.column.x - rightColumn.maxRadius

    if (maxX <= minX) {
      throw new Error(
        `Crossbar columns at x=${leftColumn.column.x} and x=${rightColumn.column.x} do not leave a routing gap`,
      )
    }

    gaps.push({
      columnGapIndex,
      leftColumnIndex: leftColumn.originalColumnIndex,
      rightColumnIndex: rightColumn.originalColumnIndex,
      minX,
      maxX,
      tracks: [],
    })
  }

  return gaps
}

const getTargetCandidates = ({
  columns,
  gap,
  netId,
}: {
  columns: Array<IndexedColumn>
  gap: ColumnGap
  netId: string
}): Array<TargetVia> => {
  const adjacentColumns = [
    columns[gap.columnGapIndex]!,
    columns[gap.columnGapIndex + 1]!,
  ]

  return adjacentColumns.flatMap((column) =>
    column.column.vias.flatMap((via, viaIndex) =>
      via.netId === netId ? [{ column, via, viaIndex }] : [],
    ),
  )
}

const distanceToGap = (pointX: number, gap: ColumnGap): number => {
  if (pointX < gap.minX) return gap.minX - pointX
  if (pointX > gap.maxX) return pointX - gap.maxX
  return 0
}

const getNetOrder = (inputProblem: InputProblem): Array<string> => {
  const netOrder: Array<string> = []
  const seenNetIds = new Set<string>()

  for (const netId of [
    ...inputProblem.fanoutPoints.map(({ netId }) => netId),
    ...inputProblem.columns.flatMap((column) =>
      column.vias.map(({ netId }) => netId),
    ),
  ]) {
    if (seenNetIds.has(netId)) continue
    seenNetIds.add(netId)
    netOrder.push(netId)
  }

  return netOrder
}

export const planCrossbarMapping = (
  inputProblem: InputProblem,
): CrossbarMappingOutput => {
  const fanoutLineY = validateFanoutPoints(inputProblem.fanoutPoints)
  const columns = validateAndSortColumns(inputProblem.columns, fanoutLineY)
  const columnGaps = createColumnGaps(columns)
  const assignmentCountByGap = columnGaps.map(() => 0)
  const assignmentsByFanoutPointIndex = new Map<number, RouteAssignment>()
  const sortedFanoutPoints = inputProblem.fanoutPoints
    .map((fanoutPoint, fanoutPointIndex) => ({
      fanoutPoint,
      fanoutPointIndex,
    }))
    .sort(
      (a, b) =>
        a.fanoutPoint.x - b.fanoutPoint.x ||
        a.fanoutPointIndex - b.fanoutPointIndex,
    )

  for (const { fanoutPoint, fanoutPointIndex } of sortedFanoutPoints) {
    const compatibleGaps = columnGaps
      .map((gap) => ({
        gap,
        targetCandidates: getTargetCandidates({
          columns,
          gap,
          netId: fanoutPoint.netId,
        }),
      }))
      .filter(({ targetCandidates }) => targetCandidates.length > 0)
      .sort((a, b) => {
        const distanceDifference =
          distanceToGap(fanoutPoint.x, a.gap) -
          distanceToGap(fanoutPoint.x, b.gap)
        if (distanceDifference !== 0) return distanceDifference

        const loadDifference =
          assignmentCountByGap[a.gap.columnGapIndex]! -
          assignmentCountByGap[b.gap.columnGapIndex]!
        if (loadDifference !== 0) return loadDifference

        const aCenter = (a.gap.minX + a.gap.maxX) / 2
        const bCenter = (b.gap.minX + b.gap.maxX) / 2
        return (
          Math.abs(fanoutPoint.x - aCenter) -
            Math.abs(fanoutPoint.x - bCenter) ||
          a.gap.columnGapIndex - b.gap.columnGapIndex
        )
      })

    const assignment = compatibleGaps[0]

    if (!assignment) {
      throw new Error(
        `No column gap has an adjacent ${fanoutPoint.netId} via for fanoutPoints[${fanoutPointIndex}]`,
      )
    }

    assignmentCountByGap[assignment.gap.columnGapIndex]! += 1
    assignmentsByFanoutPointIndex.set(fanoutPointIndex, {
      fanoutPointIndex,
      ...assignment,
    })
  }

  for (const gap of columnGaps) {
    const gapAssignments = [...assignmentsByFanoutPointIndex.values()]
      .filter(
        (assignment) => assignment.gap.columnGapIndex === gap.columnGapIndex,
      )
      .sort(
        (a, b) =>
          inputProblem.fanoutPoints[a.fanoutPointIndex]!.x -
            inputProblem.fanoutPoints[b.fanoutPointIndex]!.x ||
          a.fanoutPointIndex - b.fanoutPointIndex,
      )
    const gapWidth = gap.maxX - gap.minX

    gap.tracks = gapAssignments.map<CrossbarTrack>(
      ({ fanoutPointIndex }, trackIndex) => ({
        fanoutPointIndex,
        netId: inputProblem.fanoutPoints[fanoutPointIndex]!.netId,
        x:
          gap.minX +
          (gapWidth * (trackIndex + 1)) / (gapAssignments.length + 1),
      }),
    )
  }

  const crossbarPads: Array<CrossbarPad> = columns.flatMap((column) =>
    column.column.vias.map((via, viaIndex) => ({
      columnIndex: column.originalColumnIndex,
      viaIndex,
      x: column.column.x,
      y: via.y,
      diameter: via.diameter,
      netId: via.netId,
    })),
  )
  const topViaEdgeY = Math.max(
    ...crossbarPads.map((pad) => pad.y + pad.diameter / 2),
  )
  const spreadZone = {
    minY: topViaEdgeY,
    maxY: fanoutLineY,
  }
  const spreadYByFanoutPointIndex = new Map(
    sortedFanoutPoints.map(({ fanoutPointIndex }, spreadIndex) => [
      fanoutPointIndex,
      fanoutLineY -
        ((spreadIndex + 1) / (sortedFanoutPoints.length + 1)) *
          (fanoutLineY - topViaEdgeY),
    ]),
  )

  const paths: Array<RoutedFanoutPath> = inputProblem.fanoutPoints.map(
    (fanoutPoint, fanoutPointIndex) => {
      const assignment = assignmentsByFanoutPointIndex.get(fanoutPointIndex)!
      const track = assignment.gap.tracks.find(
        (candidate) => candidate.fanoutPointIndex === fanoutPointIndex,
      )!
      const target = [...assignment.targetCandidates].sort(
        (a, b) =>
          Math.abs(a.column.column.x - track.x) -
            Math.abs(b.column.column.x - track.x) ||
          a.column.column.x - b.column.column.x,
      )[0]!
      const spreadY = spreadYByFanoutPointIndex.get(fanoutPointIndex)!

      return {
        fanoutPointIndex,
        netId: fanoutPoint.netId,
        columnGapIndex: assignment.gap.columnGapIndex,
        targetColumnIndex: target.column.originalColumnIndex,
        targetViaIndex: target.viaIndex,
        turnDirection: target.column.column.x < track.x ? "left" : "right",
        spreadY,
        points: [
          { x: fanoutPoint.x, y: fanoutPoint.y },
          { x: fanoutPoint.x, y: spreadY },
          { x: track.x, y: spreadY },
          { x: track.x, y: target.via.y },
          { x: target.column.column.x, y: target.via.y },
        ],
      }
    },
  )

  return {
    netOrder: getNetOrder(inputProblem),
    columnGaps,
    crossbarPads,
    paths,
    fanoutLineY,
    spreadZone,
  }
}
