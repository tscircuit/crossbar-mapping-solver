import type { InputProblem } from "lib/types"

export const demoProblem: InputProblem = {
  columns: [
    {
      x: 0,
      vias: [
        { y: 7.5, diameter: 0.8, netId: "D0" },
        { y: 5.5, diameter: 0.8, netId: "D1" },
        { y: 3.5, diameter: 0.8, netId: "D2" },
        { y: 1.5, diameter: 0.8, netId: "D3" },
      ],
    },
    {
      x: 4,
      vias: [
        { y: 7.5, diameter: 0.8, netId: "D0" },
        { y: 5.5, diameter: 0.8, netId: "D1" },
        { y: 3.5, diameter: 0.8, netId: "D2" },
        { y: 1.5, diameter: 0.8, netId: "D3" },
      ],
    },
    {
      x: 8,
      vias: [
        { y: 7.5, diameter: 0.8, netId: "D0" },
        { y: 5.5, diameter: 0.8, netId: "D1" },
        { y: 3.5, diameter: 0.8, netId: "D2" },
        { y: 1.5, diameter: 0.8, netId: "D3" },
      ],
    },
  ],
}
