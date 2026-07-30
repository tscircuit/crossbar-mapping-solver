export interface Point2D {
  x: number
  y: number
}

/**
 * The end of an incoming fanout trace. Every fanout point shares one Y
 * coordinate above the crossbar.
 */
export interface FanoutPoint extends Point2D {
  netId: string
}

/**
 * A crossbar via. Its X coordinate is inherited from its column.
 */
export interface CrossbarVia {
  y: number
  diameter: number
  netId: string
}

export interface CrossbarColumn {
  x: number
  vias: Array<CrossbarVia>
}

export interface InputProblem {
  fanoutPoints: Array<FanoutPoint>
  columns: Array<CrossbarColumn>
}

export type TurnDirection = "left" | "right"

export interface CrossbarTrack {
  fanoutPointIndex: number
  netId: string
  x: number
}

export interface ColumnGap {
  columnGapIndex: number
  leftColumnIndex: number
  rightColumnIndex: number
  minX: number
  maxX: number
  tracks: Array<CrossbarTrack>
}

export interface CrossbarPad extends Point2D {
  columnIndex: number
  viaIndex: number
  netId: string
  diameter: number
}

export interface SpreadZone {
  minY: number
  maxY: number
}

export interface RoutedFanoutPath {
  fanoutPointIndex: number
  netId: string
  columnGapIndex: number
  targetColumnIndex: number
  targetViaIndex: number
  turnDirection: TurnDirection
  spreadY: number
  points: Array<Point2D>
}

export interface CrossbarMappingOutput {
  netOrder: Array<string>
  columnGaps: Array<ColumnGap>
  crossbarPads: Array<CrossbarPad>
  paths: Array<RoutedFanoutPath>
  fanoutLineY: number
  spreadZone: SpreadZone
}
