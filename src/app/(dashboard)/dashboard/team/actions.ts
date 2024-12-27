"use server"

import { prisma } from "@/lib/prisma"

export async function deleteTeam(teamId: string) {
  await prisma.team.delete({
    where: { id: teamId }
  })
}

export async function addTeamMember(teamId: string, userId: string, role: "admin" | "member") {
  await prisma.teamMember.create({
    data: {
      userId,
      teamId,
      role
    }
  })
}

export async function updateTeamMember(teamId: string, userId: string, role: "admin" | "member") {
  await prisma.teamMember.update({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    },
    data: { role }
  })
}

export async function removeTeamMember(teamId: string, userId: string) {
  await prisma.teamMember.delete({
    where: {
      userId_teamId: {
        userId,
        teamId
      }
    }
  })
}
