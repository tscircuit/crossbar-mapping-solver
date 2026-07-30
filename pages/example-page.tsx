import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { CrossbarMappingSolver } from "lib/crossbar-mapping-solver"
import type { InputProblem } from "lib/types"

export const ExamplePage = ({
  inputProblem,
  animationSpeed,
}: {
  inputProblem: InputProblem
  animationSpeed: number
}) => (
  <GenericSolverDebugger
    createSolver={() => new CrossbarMappingSolver(inputProblem)}
    animationSpeed={animationSpeed}
  />
)
