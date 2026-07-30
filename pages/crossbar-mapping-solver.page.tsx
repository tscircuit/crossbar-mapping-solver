import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { CrossbarMappingSolver } from "lib/crossbar-mapping-solver"
import { demoProblem } from "./demo-problem"

export default function CrossbarMappingSolverPage() {
  return (
    <GenericSolverDebugger
      createSolver={() => new CrossbarMappingSolver(demoProblem)}
      animationSpeed={120}
    />
  )
}
