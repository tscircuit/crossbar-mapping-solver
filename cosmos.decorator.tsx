import type { ReactNode } from "react"

export default function CosmosDecorator({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  )
}
