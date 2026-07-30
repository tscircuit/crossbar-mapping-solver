import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { CrossbarMappingSolver } from "lib/crossbar-mapping-solver"
import { simpleProblem } from "tests/fixtures/simple-problem"

export default function CrossbarMappingSolverPage() {
  return (
    <GenericSolverDebugger
      createSolver={() => new CrossbarMappingSolver(simpleProblem)}
      animationSpeed={120}
    />
  )
}
