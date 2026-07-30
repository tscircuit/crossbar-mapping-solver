import type { Point2D, RoutedFanoutPath } from "lib/types"

export interface TraceIntersection {
  firstFanoutPointIndex: number
  firstNetId: string
  firstSegmentIndex: number
  secondFanoutPointIndex: number
  secondNetId: string
  secondSegmentIndex: number
}

const EPSILON = 1e-9

const crossProduct = (start: Point2D, end: Point2D, point: Point2D): number =>
  (end.x - start.x) * (point.y - start.y) -
  (end.y - start.y) * (point.x - start.x)

const pointIsOnSegment = (
  point: Point2D,
  start: Point2D,
  end: Point2D,
): boolean =>
  Math.abs(crossProduct(start, end, point)) <= EPSILON &&
  point.x >= Math.min(start.x, end.x) - EPSILON &&
  point.x <= Math.max(start.x, end.x) + EPSILON &&
  point.y >= Math.min(start.y, end.y) - EPSILON &&
  point.y <= Math.max(start.y, end.y) + EPSILON

const segmentsIntersect = (
  firstStart: Point2D,
  firstEnd: Point2D,
  secondStart: Point2D,
  secondEnd: Point2D,
): boolean => {
  const firstStartSide = crossProduct(secondStart, secondEnd, firstStart)
  const firstEndSide = crossProduct(secondStart, secondEnd, firstEnd)
  const secondStartSide = crossProduct(firstStart, firstEnd, secondStart)
  const secondEndSide = crossProduct(firstStart, firstEnd, secondEnd)
  const firstStraddles =
    (firstStartSide > EPSILON && firstEndSide < -EPSILON) ||
    (firstStartSide < -EPSILON && firstEndSide > EPSILON)
  const secondStraddles =
    (secondStartSide > EPSILON && secondEndSide < -EPSILON) ||
    (secondStartSide < -EPSILON && secondEndSide > EPSILON)

  if (firstStraddles && secondStraddles) return true

  return (
    (Math.abs(firstStartSide) <= EPSILON &&
      pointIsOnSegment(firstStart, secondStart, secondEnd)) ||
    (Math.abs(firstEndSide) <= EPSILON &&
      pointIsOnSegment(firstEnd, secondStart, secondEnd)) ||
    (Math.abs(secondStartSide) <= EPSILON &&
      pointIsOnSegment(secondStart, firstStart, firstEnd)) ||
    (Math.abs(secondEndSide) <= EPSILON &&
      pointIsOnSegment(secondEnd, firstStart, firstEnd))
  )
}

export const getTraceIntersections = (
  paths: Array<RoutedFanoutPath>,
): Array<TraceIntersection> => {
  const intersections: Array<TraceIntersection> = []

  for (
    let firstPathIndex = 0;
    firstPathIndex < paths.length;
    firstPathIndex++
  ) {
    const firstPath = paths[firstPathIndex]!

    for (
      let secondPathIndex = firstPathIndex + 1;
      secondPathIndex < paths.length;
      secondPathIndex++
    ) {
      const secondPath = paths[secondPathIndex]!

      if (firstPath.netId === secondPath.netId) continue

      for (
        let firstSegmentIndex = 0;
        firstSegmentIndex < firstPath.points.length - 1;
        firstSegmentIndex++
      ) {
        const firstStart = firstPath.points[firstSegmentIndex]!
        const firstEnd = firstPath.points[firstSegmentIndex + 1]!

        for (
          let secondSegmentIndex = 0;
          secondSegmentIndex < secondPath.points.length - 1;
          secondSegmentIndex++
        ) {
          const secondStart = secondPath.points[secondSegmentIndex]!
          const secondEnd = secondPath.points[secondSegmentIndex + 1]!

          if (segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd)) {
            intersections.push({
              firstFanoutPointIndex: firstPath.fanoutPointIndex,
              firstNetId: firstPath.netId,
              firstSegmentIndex,
              secondFanoutPointIndex: secondPath.fanoutPointIndex,
              secondNetId: secondPath.netId,
              secondSegmentIndex,
            })
          }
        }
      }
    }
  }

  return intersections
}
