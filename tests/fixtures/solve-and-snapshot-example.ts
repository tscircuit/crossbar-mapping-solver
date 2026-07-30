import { expect } from "bun:test"
import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import { CrossbarMappingSolver } from "lib/crossbar-mapping-solver"
import type { InputProblem } from "lib/types"
import { stackSvgsHorizontally } from "stack-svgs"
import type { ExampleExpectations } from "./create-example-problem"
import { getTraceIntersections } from "./get-trace-intersections"

const COLORS = [
  "#2563eb",
  "#dc2626",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
]

const visualizeInputProblem = (inputProblem: InputProblem): GraphicsObject => {
  const netOrder = Array.from(
    new Set([
      ...inputProblem.fanoutPoints.map(({ netId }) => netId),
      ...inputProblem.columns.flatMap((column) =>
        column.vias.map(({ netId }) => netId),
      ),
    ]),
  )
  const colorByNetId = new Map(
    netOrder.map((netId, netIndex) => [
      netId,
      COLORS[netIndex % COLORS.length]!,
    ]),
  )
  const allVias = inputProblem.columns.flatMap((column) =>
    column.vias.map((via) => ({ column, via })),
  )
  const fanoutLineY = inputProblem.fanoutPoints[0]!.y
  const topViaEdgeY = Math.max(
    ...allVias.map(({ via }) => via.y + via.diameter / 2),
  )
  const minViaY = Math.min(...allVias.map(({ via }) => via.y))
  const minColumnX = Math.min(...inputProblem.columns.map(({ x }) => x))
  const maxColumnX = Math.max(...inputProblem.columns.map(({ x }) => x))
  const horizontalMargin = Math.max(maxColumnX - minColumnX, 1) * 0.08
  const uniqueRowYCoordinates = Array.from(
    new Set(allVias.map(({ via }) => via.y)),
  )

  return {
    title: "Input: aligned fanout and crossbar via matrix",
    coordinateSystem: "cartesian",
    rects: [
      {
        center: {
          x: (minColumnX + maxColumnX) / 2,
          y: (topViaEdgeY + fanoutLineY) / 2,
        },
        width: maxColumnX - minColumnX + horizontalMargin * 2,
        height: fanoutLineY - topViaEdgeY,
        fill: "rgba(254, 243, 199, 0.2)",
        stroke: "#f59e0b",
        label: "spread zone",
      },
    ],
    lines: [
      ...inputProblem.fanoutPoints.map((fanoutPoint) => ({
        points: [
          { x: fanoutPoint.x, y: fanoutPoint.y + 0.7 },
          { x: fanoutPoint.x, y: fanoutPoint.y },
        ],
        strokeColor: colorByNetId.get(fanoutPoint.netId),
        strokeWidth: 0.08,
        label: `${fanoutPoint.netId} incoming fanout`,
      })),
      {
        points: [
          { x: minColumnX - horizontalMargin, y: fanoutLineY },
          { x: maxColumnX + horizontalMargin, y: fanoutLineY },
        ],
        strokeColor: "#475569",
        strokeWidth: 0.07,
        strokeDash: "0.2 0.14",
        label: "horizontal fanout line",
      },
      ...uniqueRowYCoordinates.map((rowY) => ({
        points: [
          { x: minColumnX - horizontalMargin, y: rowY },
          { x: maxColumnX + horizontalMargin, y: rowY },
        ],
        strokeColor: "#94a3b8",
        strokeWidth: 0.04,
        strokeDash: "0.15 0.13",
        label: `crossbar row y=${rowY}`,
      })),
      ...inputProblem.columns.map((column) => ({
        points: [
          { x: column.x, y: minViaY - 0.7 },
          { x: column.x, y: topViaEdgeY },
        ],
        strokeColor: "#94a3b8",
        strokeWidth: 0.04,
        strokeDash: "0.12 0.12",
        label: `column x=${column.x}`,
      })),
    ],
    circles: [
      ...inputProblem.fanoutPoints.map((fanoutPoint) => ({
        center: fanoutPoint,
        radius: 0.13,
        fill: colorByNetId.get(fanoutPoint.netId),
        stroke: "#0f172a",
        label: `${fanoutPoint.netId} fanout point`,
      })),
      ...allVias.map(({ column, via }) => ({
        center: { x: column.x, y: via.y },
        radius: via.diameter / 2,
        fill: "#ffffff",
        stroke: colorByNetId.get(via.netId),
        label: `${via.netId} via, diameter=${via.diameter}`,
      })),
    ],
    points: [
      ...inputProblem.fanoutPoints.map((fanoutPoint) => ({
        ...fanoutPoint,
        color: colorByNetId.get(fanoutPoint.netId),
        label: `${fanoutPoint.netId} fanout`,
      })),
      ...allVias.map(({ column, via }) => ({
        x: column.x,
        y: via.y,
        color: colorByNetId.get(via.netId),
        label: via.netId,
      })),
    ],
  }
}

const escapeXmlText = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const addTitleToSvg = ({
  svg,
  title,
}: {
  svg: string
  title: string
}): string => {
  const width = Number(svg.match(/\bwidth="([^"]+)"/)?.[1] ?? 640)
  const height = Number(svg.match(/\bheight="([^"]+)"/)?.[1] ?? 640)
  const openTagEnd = svg.indexOf(">")
  const closeTagStart = svg.lastIndexOf("</svg>")

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    openTagEnd === -1 ||
    closeTagStart === -1
  ) {
    throw new Error("Expected a complete SVG with finite dimensions")
  }

  const titleHeight = 42
  const body = svg.slice(openTagEnd + 1, closeTagStart)

  return `<svg width="${width}" height="${
    height + titleHeight
  }" viewBox="0 0 ${width} ${
    height + titleHeight
  }" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><text x="14" y="27" font-family="ui-monospace, monospace" font-size="16" font-weight="700" fill="#0f172a">${escapeXmlText(
    title,
  )}</text><g transform="translate(0 ${titleHeight})">${body}</g></svg>`
}

export const solveAndSnapshotExample = async ({
  inputProblem,
  testPath,
  expected,
}: {
  inputProblem: InputProblem
  testPath: string
  expected: ExampleExpectations
}) => {
  const inputSvg = getSvgFromGraphicsObject(
    visualizeInputProblem(inputProblem),
    {
      backgroundColor: "white",
    },
  )
  const solver = new CrossbarMappingSolver(structuredClone(inputProblem))

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)

  const output = solver.getOutput()
  const fanoutLineY = inputProblem.fanoutPoints[0]!.y
  const topViaEdgeY = Math.max(
    ...inputProblem.columns.flatMap((column) =>
      column.vias.map((via) => via.y + via.diameter / 2),
    ),
  )
  const busNetIds = new Set(
    inputProblem.columns.flatMap((column) =>
      column.vias.map(({ netId }) => netId),
    ),
  )
  const routedNetIds = new Set(
    inputProblem.fanoutPoints.map(({ netId }) => netId),
  )
  const sortedFanoutXCoordinates = inputProblem.fanoutPoints
    .map(({ x }) => x)
    .sort((a, b) => a - b)
  const adjacentFanoutSpacings = sortedFanoutXCoordinates
    .slice(1)
    .map((x, index) => x - sortedFanoutXCoordinates[index]!)
  const distinctFanoutSpacings = new Set(
    adjacentFanoutSpacings.map((spacing) => spacing.toPrecision(12)),
  )

  expect(inputProblem.fanoutPoints).toHaveLength(expected.routeCount)
  expect(inputProblem.columns).toHaveLength(expected.columnCount)
  expect(busNetIds.size).toBe(expected.busCount)
  expect(routedNetIds.size).toBe(expected.routedNetCount)
  if (expected.fanoutSpacing === "single") {
    expect(adjacentFanoutSpacings).toHaveLength(0)
  } else if (expected.fanoutSpacing === "pair") {
    expect(adjacentFanoutSpacings).toHaveLength(1)
  } else {
    expect(distinctFanoutSpacings.size).toBeGreaterThan(1)
  }
  if (expected.fanoutSpacing === "clustered") {
    expect(Math.max(...adjacentFanoutSpacings)).toBeGreaterThanOrEqual(
      Math.min(...adjacentFanoutSpacings) * 3,
    )
  }
  for (const [netId, expectedCount] of Object.entries(
    expected.routeNetCounts ?? {},
  )) {
    expect(
      inputProblem.fanoutPoints.filter((point) => point.netId === netId),
    ).toHaveLength(expectedCount)
  }
  expect(
    inputProblem.fanoutPoints.every((point) => point.y === fanoutLineY),
  ).toBe(true)
  expect(output.paths).toHaveLength(inputProblem.fanoutPoints.length)
  expect(output.columnGaps).toHaveLength(inputProblem.columns.length - 1)
  expect(output.crossbarPads).toHaveLength(
    inputProblem.columns.reduce(
      (count, column) => count + column.vias.length,
      0,
    ),
  )
  expect(output.fanoutLineY).toBe(fanoutLineY)
  expect(output.spreadZone).toEqual({
    minY: topViaEdgeY,
    maxY: fanoutLineY,
  })
  expect(getTraceIntersections(output.paths)).toEqual([])

  for (const path of output.paths) {
    const fanoutPoint = inputProblem.fanoutPoints[path.fanoutPointIndex]!
    const targetColumn = inputProblem.columns[path.targetColumnIndex]!
    const targetVia = targetColumn.vias[path.targetViaIndex]!
    const gap = output.columnGaps[path.columnGapIndex]!
    const track = gap.tracks.find(
      ({ fanoutPointIndex }) => fanoutPointIndex === path.fanoutPointIndex,
    )!
    const [sourcePoint, spreadEntry, spreadExit, columnEntry, targetPoint] =
      path.points

    expect(path.points).toHaveLength(5)
    expect(path.netId).toBe(fanoutPoint.netId)
    expect(targetVia.netId).toBe(fanoutPoint.netId)
    expect(sourcePoint).toEqual({ x: fanoutPoint.x, y: fanoutLineY })
    expect(path.spreadY).toBeGreaterThan(output.spreadZone.minY)
    expect(path.spreadY).toBeLessThan(output.spreadZone.maxY)
    expect(spreadEntry).toEqual({ x: fanoutPoint.x, y: path.spreadY })
    expect(spreadExit).toEqual({
      x: track.x,
      y: output.spreadZone.minY,
    })
    expect(spreadEntry!.y).toBeGreaterThan(spreadExit!.y)
    expect(track.x).toBeGreaterThan(gap.minX)
    expect(track.x).toBeLessThan(gap.maxX)
    expect(columnEntry).toEqual({ x: track.x, y: targetVia.y })
    expect(targetPoint).toEqual({ x: targetColumn.x, y: targetVia.y })
    expect(path.turnDirection).toBe(targetColumn.x < track.x ? "left" : "right")
    expect(
      [gap.leftColumnIndex, gap.rightColumnIndex].includes(
        path.targetColumnIndex,
      ),
    ).toBe(true)
  }

  const outputSvg = getSvgFromGraphicsObject(solver.visualize(), {
    backgroundColor: "white",
  })
  const comparisonSvg = stackSvgsHorizontally(
    [
      addTitleToSvg({
        svg: inputSvg,
        title: "Input: fanout points share one horizontal line",
      }),
      addTitleToSvg({
        svg: outputSvg,
        title: "Output: spread, descend in gaps, turn into vias",
      }),
    ],
    {
      gap: 24,
      normalizeSize: false,
    },
  )

  const normalizedComparisonSvg = comparisonSvg.replace(/[ \t]+$/gm, "")

  await expect(normalizedComparisonSvg).toMatchSvgSnapshot(testPath)

  return { solver, output }
}
