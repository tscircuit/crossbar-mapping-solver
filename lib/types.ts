export interface Point2D {
  x: number
  y: number
}

/**
 * A via in a fanout column. Its X coordinate is inherited from the column.
 */
export interface FanoutPoint {
  y: number
  diameter: number
  netId: string
}

export interface FanoutColumn {
  x: number
  vias: Array<FanoutPoint>
}

export interface InputProblem {
  columns: Array<FanoutColumn>
}

export type NetParity = "even" | "odd"
export type TurnDirection = "left" | "right"

export interface CrossbarTrack {
  netId: string
  x: number
}

export interface ColumnGap {
  columnGapIndex: number
  netParity: NetParity
  minX: number
  maxX: number
  tracks: Array<CrossbarTrack>
}

export interface BusPad extends Point2D {
  netId: string
  diameter: number
}

export interface SpreadZone {
  minY: number
  maxY: number
}

export interface RoutedFanoutPath {
  columnIndex: number
  viaIndex: number
  netId: string
  columnGapIndex: number
  turnDirection: TurnDirection
  spreadY: number
  points: Array<Point2D>
}

export interface CrossbarMappingOutput {
  netOrder: Array<string>
  columnGaps: Array<ColumnGap>
  busPads: Array<BusPad>
  paths: Array<RoutedFanoutPath>
  fanoutLineY: number
  spreadZone: SpreadZone
}
