/* MERAK16 Assembler in TypeScript */

/* eslint-disable max-len */

import { ALUOP_CODE, aluopMap, aluops } from '@/alu'
import { OPCODE } from '@/op'
import { GROUP, REGISTER, mapRegister } from '@/register'

const bin = (n: number, len: number) => n.toString(2).padStart(len, '0')

const parseWithParen = (str: string) => {
  const [numStr, rest] = str.split(/\w*\(\w*/)
  const num = parseInt(numStr) || 0
  const reg = mapRegister(rest.split(/\w*\)\w*/)[0])
  return [num, reg] as const
}

export const instr = {
  alu: (op: ALUOP_CODE, g: GROUP, rd: REGISTER, rs1: REGISTER, rs2: REGISTER) => ({
    value: op << 10 + g << 9 + rs2 << 6 + rs1 << 3 + rd << 0,
    read: `${bin(op, 6)}_${bin(g, 1)}_${bin(rs2, 3)}_${bin(rs1, 3)}_${bin(rd, 3)}`,
  }),
  not_com: (code: 0b000 | 0b001, g: GROUP, rd: REGISTER, rs1: REGISTER) => ({
    value: 0b001000 << 10 + g << 9 + code << 6 + rs1 << 3 + rd << 0,
    read: `001000_${bin(g, 1)}_${bin(code, 3)}_${bin(rs1, 3)}_${bin(rd, 3)}`,
  }),
  mv: (code: 0b0010 | 0b1010 | 0b1011, rd: REGISTER, rs1: REGISTER) => ({
    value: 0b001001 << 10 + code << 6 + rs1 << 3 + rd << 0,
    read: `001001_${bin(code, 4)}_${bin(rs1, 3)}_${bin(rd, 3)}`,
  }),
  lh: (g: GROUP, rd: REGISTER, offset: number, rs1: REGISTER) => ({
    value: 0b001001 << 10 + g << 9  + offset << 6 + rs1 << 3 + rd << 0,
    read: `001001_${bin(g, 1)}_${bin(offset, 3)}_${bin(rs1, 3)}_${bin(rd, 3)}`,
  }),
  li: (g: GROUP, rd: REGISTER, imm: number) => ({
    value: 0b010 << 13 + (imm % (1 << 9)) >> 6 << 10 + g << 9 + (imm % (1 << 6)) << 3 + rd << 0,
    read: `010_${bin((imm % (1 << 9)) >> 6, 3)}_${bin(g, 1)}_${bin(imm % (1 << 6), 6)}_${bin(rd, 3)}`,
  }),
  sh: (g: GROUP, rs1: REGISTER, offset: number, rs2: REGISTER) => ({
    value: 0b001010 << 10 + g << 9 + rs2 << 6 + rs1 << 3 + offset << 0,
    read: `001010_${bin(g, 1)}_${bin(rs2, 3)}_${bin(rs1, 3)}_${bin(offset, 3)}`,
  }),
  set: (code: 0b000 | 0b001, g: GROUP, rs1: REGISTER, rs2: REGISTER) => ({
    value: 0b100000 << 10 + g << 9 + rs2 << 6 + rs1 << 3 + code << 0,
    read: `100000_${bin(g, 1)}_${bin(rs2, 3)}_${bin(rs1, 3)}_${bin(code, 3)}`,
  }),
  branch_jal: (code: 0b001 | 0b010 | 0b100, offset: number) => ({
    value: 0b100 << 13 + code << 10 + offset << 0,
    read: `100_${bin(code, 3)}_${bin(offset, 10)}`,
  }),
  jalr: (code: 0b000 | 0b001, g: GROUP, rs1: REGISTER, offset: number) => ({
    value: 0b100101 << 10 + g << 9 + (offset % (1 << 6)) >> 3 << 6 + rs1 << 3 + (offset % (1 << 3)) << 0,
    read: `100101_${bin(g, 1)}_${bin((offset % (1 << 6)) >> 3, 3)}_${bin(rs1, 3)}_${bin(offset % (1 << 3), 3)}`,
  }),
  halt: () => ({
    value: 0b1111111111111111,
    read: '1111111111111111',
  }),
  // TODO: other instructions
}

export const parseLine = (line: string) => {
  const [raw_op, argStr] = line.split(' ', 2)
  const op = raw_op as OPCODE
  let instruction: { value: number, read: string } | null = null
  if (aluops.includes(op)) {
    const [rd, rs1, rs2] = argStr.split(/\w*,?\w*/).map(mapRegister)
    if (rd.g !== rs1.g || rd.g !== rs2.g) throw Error()
    const aluop = aluopMap[op] as ALUOP_CODE
    instruction = instr.alu(aluop, rd.g, rd.reg, rs1.reg, rs2.reg)
  } else if (op === OPCODE.NOT || op === OPCODE.COM) {
    const [rd, rs1] = argStr.split(/\w*,?\w*/).map(mapRegister)
    if (rd.g !== rs1.g) throw Error()
    const code = op === OPCODE.NOT ? 0b000 : 0b001
    instruction = instr.not_com(code, rd.g, rd.reg, rs1.reg)
  } else if (op === OPCODE.MVHL || op === OPCODE.MVLH || op === OPCODE.MVH) {
    const [rd, rs1] = argStr.split(/\w*,?\w*/).map(mapRegister)
    if (op === OPCODE.MVHL) {
      if (rd.g !== GROUP.A || rs1.g !== GROUP.B) throw Error()
      instruction = instr.mv(0b0010, rd.reg, rs1.reg)
    } else if (op === OPCODE.MVLH) {
      if (rd.g !== GROUP.B || rs1.g !== GROUP.A) throw Error()
      instruction = instr.mv(0b1010, rd.reg, rs1.reg)
    } else if (op === OPCODE.MVH) {
      if (rd.g !== GROUP.B || rs1.g !== GROUP.B) throw Error()
      instruction = instr.mv(0b1011, rd.reg, rs1.reg)
    }
  } else if (op === OPCODE.LH) {
    const [rdName, rest] = argStr.split(/\w*,?\w*/)
    const rd = mapRegister(rdName)
    const [offset, rs1] = parseWithParen(rest)
    if (rd.g !== rs1.g) throw Error()
    instruction = instr.lh(rd.g, rd.reg, offset, rs1.reg)
  } else if (op === OPCODE.LI) {
    const [rdName, rest] = argStr.split(/\w*,?\w*/)
    const rd = mapRegister(rdName)
    const imm = parseInt(rest) || 0
    instruction = instr.li(rd.g, rd.reg, imm)
  } else if (op === OPCODE.SH) {
    const [rs1Name, rest] = argStr.split(/\w*,?\w*/)
    const rs1 = mapRegister(rs1Name)
    const [offset, rs2] = parseWithParen(rest)
    if (rs1.g !== rs2.g) throw Error()
    instruction = instr.sh(rs1.g, rs1.reg, offset, rs2.reg)
  } else if (op === OPCODE.SLT || op === OPCODE.SOE) {
    const [rs1, rs2] = argStr.split(/\w*,?\w*/).map(mapRegister)
    if (rs1.g !== rs2.g) throw Error()
    const code = op === OPCODE.SLT ? 0b000 : 0b001
    instruction = instr.set(code, rs1.g, rs1.reg, rs2.reg)
  } else if (op === OPCODE.BOZ || op === OPCODE.BONZ || op === OPCODE.JAL) {
    const offset = parseInt(argStr) || 0
    const code = op === OPCODE.BOZ ? 0b001 : op === OPCODE.BONZ ? 0b010 : 0b100
    instruction = instr.branch_jal(code, offset)
  } else if (op === OPCODE.JALR) {
    const [rdName, offsetStr] = argStr.split(/\w*,?\w*/)
    const rd = mapRegister(rdName)
    const offset = parseInt(offsetStr) || 0
    instruction = instr.jalr(0b000, rd.g, rd.reg, offset)
  } else if (op === OPCODE.HALT)
    instruction = instr.halt()

  // TODO: other instructions
  if (!instruction) throw Error()
  return instruction
}
