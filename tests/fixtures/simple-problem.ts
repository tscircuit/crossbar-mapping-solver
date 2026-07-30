import type { InputProblem } from "lib/types"

export const simpleProblem: InputProblem = {
  columns: [
    {
      x: 0,
      vias: [
        { y: 6, diameter: 0.8, netId: "D0" },
        { y: 4, diameter: 0.8, netId: "D1" },
        { y: 2, diameter: 0.8, netId: "D2" },
        { y: 0, diameter: 0.8, netId: "D3" },
      ],
    },
    {
      x: 4,
      vias: [
        { y: 6, diameter: 0.8, netId: "D0" },
        { y: 4, diameter: 0.8, netId: "D1" },
        { y: 2, diameter: 0.8, netId: "D2" },
        { y: 0, diameter: 0.8, netId: "D3" },
      ],
    },
    {
      x: 8,
      vias: [
        { y: 6, diameter: 0.8, netId: "D0" },
        { y: 4, diameter: 0.8, netId: "D1" },
        { y: 2, diameter: 0.8, netId: "D2" },
        { y: 0, diameter: 0.8, netId: "D3" },
      ],
    },
  ],
}
