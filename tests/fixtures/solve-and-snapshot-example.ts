import { expect } from "bun:test"
import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import { CrossbarMappingSolver } from "lib/crossbar-mapping-solver"
import type { InputProblem, NetParity } from "lib/types"
import { stackSvgsHorizontally } from "stack-svgs"

const getNetColor = (netIndex: number): string => {
  const colors = [
    "#2563eb",
    "#dc2626",
    "#059669",
    "#7c3aed",
    "#ea580c",
    "#0891b2",
  ]

  return colors[netIndex % colors.length]!
}

const visualizeInputProblem = (inputProblem: InputProblem): GraphicsObject => {
  const netOrder = Array.from(
    new Set(
      inputProblem.columns.flatMap((column) =>
        column.vias.map((via) => via.netId),
      ),
    ),
  )
  const colorByNetId = new Map(
    netOrder.map((netId, netIndex) => [netId, getNetColor(netIndex)]),
  )
  const allVias = inputProblem.columns.flatMap((column) =>
    column.vias.map((via) => ({ column, via })),
  )
  const fanoutLineY = Math.min(
    ...allVias.map(({ via }) => via.y - via.diameter / 2),
  )
  const minY = fanoutLineY
  const maxY = Math.max(...allVias.map(({ via }) => via.y))
  const verticalMargin = Math.max(maxY - minY, 1) * 0.12
  const minColumnX = Math.min(...inputProblem.columns.map(({ x }) => x))
  const maxColumnX = Math.max(...inputProblem.columns.map(({ x }) => x))
  const horizontalMargin = Math.max(maxColumnX - minColumnX, 1) * 0.12

  return {
    title: "Input: top-down fanout vias",
    coordinateSystem: "cartesian",
    lines: [
      ...inputProblem.columns.map((column) => ({
        points: [
          { x: column.x, y: minY - verticalMargin },
          { x: column.x, y: maxY + verticalMargin },
        ],
        strokeColor: "#94a3b8",
        strokeWidth: 0.05,
        strokeDash: "0.16 0.12",
        label: `column x=${column.x}`,
      })),
      ...allVias.map(({ column, via }) => ({
        points: [
          {
            x: column.x,
            y: via.y + Math.max(via.diameter, 0.6),
          },
          {
            x: column.x,
            y: via.y + via.diameter / 2,
          },
        ],
        strokeColor: colorByNetId.get(via.netId),
        strokeWidth: 0.08,
        label: `${via.netId} travels downward`,
      })),
      {
        points: [
          { x: minColumnX - horizontalMargin, y: fanoutLineY },
          { x: maxColumnX + horizontalMargin, y: fanoutLineY },
        ],
        strokeColor: "#475569",
        strokeWidth: 0.07,
        strokeDash: "0.2 0.14",
        label: "fanout line",
      },
    ],
    circles: allVias.map(({ column, via }) => ({
      center: { x: column.x, y: via.y },
      radius: via.diameter / 2,
      fill: "#ffffff",
      stroke: colorByNetId.get(via.netId),
      label: `${via.netId} via, diameter=${via.diameter}`,
    })),
    points: allVias.map(({ column, via }) => ({
      x: column.x,
      y: via.y,
      color: colorByNetId.get(via.netId),
      label: via.netId,
    })),
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

const getParity = (index: number): NetParity =>
  index % 2 === 0 ? "even" : "odd"

export const solveAndSnapshotExample = async ({
  inputProblem,
  testPath,
}: {
  inputProblem: InputProblem
  testPath: string
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
  const viaCount = inputProblem.columns.reduce(
    (count, column) => count + column.vias.length,
    0,
  )

  expect(output.paths).toHaveLength(viaCount)
  expect(output.columnGaps.map((gap) => gap.netParity)).toEqual(
    output.columnGaps.map((_, gapIndex) => getParity(gapIndex)),
  )
  const minimumViaEdgeY = Math.min(
    ...inputProblem.columns.flatMap((column) =>
      column.vias.map((via) => via.y - via.diameter / 2),
    ),
  )

  expect(output.fanoutLineY).toBe(minimumViaEdgeY)
  expect(output.spreadZone.maxY).toBeLessThan(output.fanoutLineY)
  expect(output.busPads.every((pad) => pad.y < output.spreadZone.minY)).toBe(
    true,
  )

  for (const path of output.paths) {
    const sourceColumn = inputProblem.columns[path.columnIndex]!
    const sourceVia = sourceColumn.vias[path.viaIndex]!
    const busPad = output.busPads.find((pad) => pad.netId === path.netId)!
    const netIndex = output.netOrder.indexOf(path.netId)
    const selectedGap = output.columnGaps[path.columnGapIndex]!
    const [sourcePoint, spreadEntry, spreadExit, crossbarEntry, lastPoint] =
      path.points

    expect(path.points).toHaveLength(5)
    expect(sourcePoint).toEqual({ x: sourceColumn.x, y: sourceVia.y })
    expect(selectedGap.netParity).toBe(getParity(netIndex))
    expect(path.spreadY).toBeGreaterThanOrEqual(output.spreadZone.minY)
    expect(path.spreadY).toBeLessThanOrEqual(output.spreadZone.maxY)
    expect(spreadEntry).toEqual({ x: sourceColumn.x, y: path.spreadY })
    expect(spreadEntry!.y).toBeLessThan(sourceVia.y)
    expect(spreadExit!.y).toBe(path.spreadY)
    expect(crossbarEntry).toEqual({ x: spreadExit!.x, y: busPad.y })
    expect(lastPoint).toEqual({ x: busPad.x, y: busPad.y })
  }

  const outputSvg = getSvgFromGraphicsObject(solver.visualize(), {
    backgroundColor: "white",
  })
  const comparisonSvg = stackSvgsHorizontally(
    [
      addTitleToSvg({
        svg: inputSvg,
        title: "Input: fanout line above the crossbars",
      }),
      addTitleToSvg({
        svg: outputSvg,
        title: "Output: spread zone then horizontal crossbars",
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
