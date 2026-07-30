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
    const allVias = this.inputProblem.columns.flatMap((column, columnIndex) =>
      column.vias.map((via, viaIndex) => ({
        column,
        columnIndex,
        via,
        viaIndex,
      })),
    )
    const allYCoordinates = [
      ...allVias.map(({ via }) => via.y),
      ...this.plannedOutput.busPads.map(({ y }) => y),
    ]
    const minY = Math.min(...allYCoordinates)
    const maxY = Math.max(...allYCoordinates)
    const verticalMargin = Math.max(maxY - minY, 1) * 0.08
    const firstGap = this.plannedOutput.columnGaps[0]!
    const lastPad = this.plannedOutput.busPads[0]!

    return {
      title: `Crossbar mapping (${this.routedPaths.length}/${this.plannedOutput.paths.length} paths)`,
      coordinateSystem: "cartesian",
      rects: this.plannedOutput.columnGaps.map((gap) => ({
        center: {
          x: (gap.minX + gap.maxX) / 2,
          y: (minY + maxY) / 2,
        },
        width: gap.maxX - gap.minX,
        height: maxY - minY + verticalMargin * 2,
        fill:
          gap.netParity === "even"
            ? "rgba(219, 234, 254, 0.3)"
            : "rgba(243, 232, 255, 0.3)",
        stroke: gap.netParity === "even" ? "#93c5fd" : "#d8b4fe",
        label: `${gap.netParity} gap ${gap.columnGapIndex}`,
      })),
      lines: [
        ...this.plannedOutput.columnGaps.flatMap((gap) =>
          gap.tracks.map((track) => ({
            points: [
              { x: track.x, y: minY - verticalMargin },
              { x: track.x, y: maxY + verticalMargin },
            ],
            strokeColor: this.colorByNetId.get(track.netId),
            strokeWidth: 0.06,
            strokeDash: "0.18 0.12",
            label: `${track.netId} column track`,
          })),
        ),
        ...this.plannedOutput.busPads.map((pad) => ({
          points: [
            { x: firstGap.minX, y: pad.y },
            { x: lastPad.x, y: pad.y },
          ],
          strokeColor: this.colorByNetId.get(pad.netId),
          strokeWidth: 0.05,
          strokeDash: "0.2 0.15",
          label: `${pad.netId} bus row`,
        })),
        ...this.routedPaths.map((path) => ({
          points: path.points,
          strokeColor: this.colorByNetId.get(path.netId),
          strokeWidth: 0.14,
          label: `${path.netId}: ${path.turnDirection} through gap ${path.columnGapIndex}`,
        })),
      ],
      circles: [
        ...allVias.map(({ column, via }) => ({
          center: { x: column.x, y: via.y },
          radius: via.diameter / 2,
          fill: "#ffffff",
          stroke: this.colorByNetId.get(via.netId),
          label: `${via.netId} via`,
        })),
        ...this.plannedOutput.busPads.map((pad) => ({
          center: { x: pad.x, y: pad.y },
          radius: pad.diameter / 2,
          fill: this.colorByNetId.get(pad.netId),
          stroke: "#0f172a",
          label: `${pad.netId} bus pad`,
        })),
      ],
      points: [
        ...allVias.map(({ column, via }) => ({
          x: column.x,
          y: via.y,
          color: this.colorByNetId.get(via.netId),
          label: via.netId,
        })),
        ...this.plannedOutput.busPads.map((pad) => ({
          x: pad.x,
          y: pad.y,
          color: this.colorByNetId.get(pad.netId),
          label: `${pad.netId} pad`,
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
