const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check existing roles
    const roles = await prisma.role.findMany()
    console.log('Existing roles:', roles)

    // Find admin role
    const adminRole = await prisma.role.findFirst({
      where: {
        name: {
          in: ['admin', 'Admin', 'ADMIN']
        }
      }
    })

    if (!adminRole) {
      console.log('No admin role found, creating one...')
      await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator role with full access'
        }
      })
      console.log('Admin role created')
    } else {
      console.log('Found admin role:', adminRole)
    }

    // Check user roles
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: true,
        role: true
      }
    })
    console.log('User roles:', userRoles)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
