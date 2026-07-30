import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import { planCrossbarMapping } from "./plan-crossbar-mapping"
import type {
  CrossbarMappingOutput,
  InputProblem,
  RoutedFanoutPath,
} from "./types"

const NET_COLORS = [
  "#2563eb",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#c026d3",
  "#4d7c0f",
]

const getVisualizationOffset = ({
  path,
  pathIndex,
  paths,
}: {
  path: RoutedFanoutPath
  pathIndex: number
  paths: Array<RoutedFanoutPath>
}): { x: number; y: number } => {
  const sameNetPaths = paths.filter(
    (candidate) => candidate.netId === path.netId,
  )
  const sameNetPathIndex = sameNetPaths.findIndex(
    (candidate) => candidate.fanoutPointIndex === path.fanoutPointIndex,
  )
  const normalizedOffset =
    sameNetPaths.length <= 1
      ? 0
      : sameNetPathIndex / (sameNetPaths.length - 1) - 0.5
  const tieBreaker = ((pathIndex % 3) - 1) * 0.006

  return {
    x: normalizedOffset * 0.16 + tieBreaker,
    y: normalizedOffset * 0.12 - tieBreaker,
  }
}

export class CrossbarMappingSolver extends BaseSolver {
  readonly inputProblem: InputProblem
  private readonly plannedOutput: CrossbarMappingOutput
  private readonly colorByNetId: Map<string, string>
  private routedPaths: Array<RoutedFanoutPath> = []

  constructor(inputProblem: InputProblem) {
    super()
    this.inputProblem = inputProblem
    this.plannedOutput = planCrossbarMapping(inputProblem)
    this.colorByNetId = new Map(
      this.plannedOutput.netOrder.map((netId, netIndex) => [
        netId,
        NET_COLORS[netIndex % NET_COLORS.length]!,
      ]),
    )
    this.MAX_ITERATIONS = this.plannedOutput.paths.length + 1
    this.stats = {
      routedPathCount: 0,
      totalPathCount: this.plannedOutput.paths.length,
      netCount: this.plannedOutput.netOrder.length,
    }
  }

  override getConstructorParams() {
    return [this.inputProblem]
  }

  override _step() {
    const nextPath = this.plannedOutput.paths[this.routedPaths.length]

    if (nextPath) {
      this.routedPaths.push(nextPath)
    }

    this.progress =
      this.plannedOutput.paths.length === 0
        ? 1
        : this.routedPaths.length / this.plannedOutput.paths.length
    this.stats = {
      routedPathCount: this.routedPaths.length,
      totalPathCount: this.plannedOutput.paths.length,
      netCount: this.plannedOutput.netOrder.length,
    }

    if (this.routedPaths.length === this.plannedOutput.paths.length) {
      this.solved = true
    }
  }

  override getOutput(): CrossbarMappingOutput {
    return {
      ...this.plannedOutput,
      paths: [...this.routedPaths],
    }
  }

  override visualize(): GraphicsObject {
    const columnsByX = this.inputProblem.columns
      .map((column, columnIndex) => ({ column, columnIndex }))
      .sort((a, b) => a.column.x - b.column.x)
    const firstColumn = columnsByX[0]!.column
    const lastColumn = columnsByX[columnsByX.length - 1]!.column
    const allYCoordinates = [
      this.plannedOutput.fanoutLineY,
      ...this.plannedOutput.crossbarPads.map(({ y }) => y),
    ]
    const minY = Math.min(...allYCoordinates)
    const maxY = Math.max(...allYCoordinates)
    const verticalMargin = Math.max(maxY - minY, 1) * 0.08
    const horizontalMargin = Math.max(lastColumn.x - firstColumn.x, 1) * 0.06
    const channelMinY = minY - verticalMargin
    const channelMaxY = this.plannedOutput.spreadZone.minY
    const uniqueRowYCoordinates = Array.from(
      new Set(this.plannedOutput.crossbarPads.map(({ y }) => y)),
    )
    const visualizedPaths = this.routedPaths.map((path) => {
      const pathIndex = this.plannedOutput.paths.findIndex(
        (candidate) => candidate.fanoutPointIndex === path.fanoutPointIndex,
      )
      const offset = getVisualizationOffset({
        path,
        pathIndex,
        paths: this.plannedOutput.paths,
      })

      return {
        path,
        points: path.points.map((point) => ({
          x: point.x + offset.x,
          y: point.y + offset.y,
        })),
      }
    })

    return {
      title: `Horizontal fanout to crossbar vias (${this.routedPaths.length}/${this.plannedOutput.paths.length} paths)`,
      coordinateSystem: "cartesian",
      rects: [
        ...this.plannedOutput.columnGaps.map((gap) => ({
          center: {
            x: (gap.minX + gap.maxX) / 2,
            y: (channelMinY + channelMaxY) / 2,
          },
          width: gap.maxX - gap.minX,
          height: channelMaxY - channelMinY,
          fill:
            gap.columnGapIndex % 2 === 0
              ? "rgba(219, 234, 254, 0.2)"
              : "rgba(243, 232, 255, 0.2)",
          stroke: gap.columnGapIndex % 2 === 0 ? "#93c5fd" : "#d8b4fe",
          label: `column gap ${gap.columnGapIndex}`,
        })),
        {
          center: {
            x: (firstColumn.x + lastColumn.x) / 2,
            y:
              (this.plannedOutput.spreadZone.minY +
                this.plannedOutput.spreadZone.maxY) /
              2,
          },
          width: lastColumn.x - firstColumn.x + horizontalMargin * 2,
          height:
            this.plannedOutput.spreadZone.maxY -
            this.plannedOutput.spreadZone.minY,
          fill: "rgba(254, 243, 199, 0.2)",
          stroke: "#f59e0b",
          label: "spread zone",
        },
      ],
      lines: [
        ...this.inputProblem.fanoutPoints.map((fanoutPoint) => ({
          points: [
            {
              x: fanoutPoint.x,
              y: fanoutPoint.y + Math.max(verticalMargin * 0.8, 0.6),
            },
            { x: fanoutPoint.x, y: fanoutPoint.y },
          ],
          strokeColor: this.colorByNetId.get(fanoutPoint.netId),
          strokeWidth: 0.08,
          label: `${fanoutPoint.netId} incoming fanout`,
        })),
        {
          points: [
            {
              x: Math.min(
                firstColumn.x - horizontalMargin,
                ...this.inputProblem.fanoutPoints.map(({ x }) => x),
              ),
              y: this.plannedOutput.fanoutLineY,
            },
            {
              x: Math.max(
                lastColumn.x + horizontalMargin,
                ...this.inputProblem.fanoutPoints.map(({ x }) => x),
              ),
              y: this.plannedOutput.fanoutLineY,
            },
          ],
          strokeColor: "#475569",
          strokeWidth: 0.07,
          strokeDash: "0.2 0.14",
          label: "horizontal fanout line",
        },
        ...uniqueRowYCoordinates.map((rowY) => ({
          points: [
            { x: firstColumn.x - horizontalMargin, y: rowY },
            { x: lastColumn.x + horizontalMargin, y: rowY },
          ],
          strokeColor: "#94a3b8",
          strokeWidth: 0.04,
          strokeDash: "0.15 0.13",
          label: `crossbar row y=${rowY}`,
        })),
        ...columnsByX.map(({ column }, sortedColumnIndex) => ({
          points: [
            { x: column.x, y: channelMinY },
            { x: column.x, y: channelMaxY },
          ],
          strokeColor: sortedColumnIndex % 2 === 0 ? "#64748b" : "#94a3b8",
          strokeWidth: 0.04,
          strokeDash: "0.12 0.12",
          label: `crossbar column x=${column.x}`,
        })),
        ...this.plannedOutput.columnGaps.flatMap((gap) =>
          gap.tracks.map((track) => ({
            points: [
              { x: track.x, y: channelMinY },
              { x: track.x, y: this.plannedOutput.spreadZone.maxY },
            ],
            strokeColor: this.colorByNetId.get(track.netId),
            strokeWidth: 0.05,
            strokeDash: "0.18 0.12",
            label: `${track.netId} gap track`,
          })),
        ),
        ...visualizedPaths.map(({ path, points }) => ({
          points,
          strokeColor: this.colorByNetId.get(path.netId),
          strokeWidth: 0.14,
          label: `${path.netId}: gap ${path.columnGapIndex}, turn ${path.turnDirection} (visual offset only)`,
        })),
      ],
      circles: [
        ...this.inputProblem.fanoutPoints.map((fanoutPoint) => ({
          center: fanoutPoint,
          radius: 0.13,
          fill: this.colorByNetId.get(fanoutPoint.netId),
          stroke: "#0f172a",
          label: `${fanoutPoint.netId} fanout point`,
        })),
        ...this.plannedOutput.crossbarPads.map((pad) => ({
          center: { x: pad.x, y: pad.y },
          radius: pad.diameter / 2,
          fill: "#ffffff",
          stroke: this.colorByNetId.get(pad.netId),
          label: `${pad.netId} crossbar via`,
        })),
      ],
      points: [
        ...this.inputProblem.fanoutPoints.map((fanoutPoint) => ({
          x: fanoutPoint.x,
          y: fanoutPoint.y,
          color: this.colorByNetId.get(fanoutPoint.netId),
          label: `${fanoutPoint.netId} fanout`,
        })),
        ...this.plannedOutput.crossbarPads.map((pad) => ({
          x: pad.x,
          y: pad.y,
          color: this.colorByNetId.get(pad.netId),
          label: `${pad.netId} via`,
        })),
      ],
    }
  }
}

export const solveCrossbarMapping = (
  inputProblem: InputProblem,
): CrossbarMappingOutput => {
  const solver = new CrossbarMappingSolver(inputProblem)
  solver.solve()
  return solver.getOutput()
}
