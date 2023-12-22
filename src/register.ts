export enum GROUP {
  A = 0b0,
  B = 0b1,
}

export enum REGISTER {
  R0 = 0b000,
  R1 = 0b001,
  R2 = 0b010,
  R3 = 0b011,
  R4 = 0b100,
  R5 = 0b101,
  R6 = 0b110,
  R7 = 0b111,
}

export const registerMap: Record<string, { g: GROUP, reg: REGISTER }> = {
  a0: { g: GROUP.A, reg: REGISTER.R0 },
  a1: { g: GROUP.A, reg: REGISTER.R1 },
  a2: { g: GROUP.A, reg: REGISTER.R2 },
  a3: { g: GROUP.A, reg: REGISTER.R3 },
  a4: { g: GROUP.A, reg: REGISTER.R4 },
  a5: { g: GROUP.A, reg: REGISTER.R5 },
  a6: { g: GROUP.A, reg: REGISTER.R6 },
  a7: { g: GROUP.A, reg: REGISTER.R7 },
  a8: { g: GROUP.B, reg: REGISTER.R0 },
  a9: { g: GROUP.B, reg: REGISTER.R1 },
  a10: { g: GROUP.B, reg: REGISTER.R2 },
  a11: { g: GROUP.B, reg: REGISTER.R3 },
  a12: { g: GROUP.B, reg: REGISTER.R4 },
  a13: { g: GROUP.B, reg: REGISTER.R5 },
  a14: { g: GROUP.B, reg: REGISTER.R6 },
  a15: { g: GROUP.B, reg: REGISTER.R7 },
}

export const mapRegister = (name: string) => {
  const register = registerMap[name]
  if (!register) throw Error(`Unknown register: ${name}`)
  return registerMap[name]
}
