import { describe, expect, it } from 'vitest'
import type { UseServerFunction } from '../types/type.ts'
import { transEntryIdentifier } from './index.ts'

const func1: {
  id: string
  func: UseServerFunction
} = {
  id: '/path1/demo.ts',
  func: {
    fileId: '',
    position: [
      194,
      1445,
    ],
    type: 'function',
    name: 'getUserInfo',
    body: '{\n    "use server";\n    await signInedMiddleware();\n    const [payload] = useJwtPayload();\n    const user = await maPrisma().user.findFirstOrThrow({\n        where: {\n            id: payload.id\n        },\n        select: {\n            id: true,\n            email: true,\n            name: true,\n            TeamMembers: {\n                select: {\n                    status: true,\n                    teamId: true,\n                    role: true,\n                    Team: {\n                        select: {\n                            id: true,\n                            name: true,\n                            cover: true,\n                            Projects: {\n                                select: {\n                                    id: true,\n                                    name: true,\n                                    cover: true\n                                }\n                            }\n                        }\n                    }\n                }\n            }\n        }\n    });\n    payload.teams = user.TeamMembers.map((teamMember) => {\n        const { Team } = teamMember;\n        return {\n            id: teamMember.teamId,\n            name: Team.name,\n            cover: teamMember.Team.cover,\n            role: teamMember.role,\n            status: teamMember.status,\n            projects: Team.Projects.map((project) => ({\n                name: project.name,\n                cover: project.cover,\n                id: project.id\n            }))\n        };\n    });\n    const token = await genToken(payload);\n    return {\n        data: {\n            token,\n            payload\n        }\n    };\n}',
    params: [],
    usedImports: [
      {
        type: 'named',
        identifier: 'signInedMiddleware',
        moduleName: '@/services/middlewares',
      },
      {
        type: 'named',
        identifier: 'useJwtPayload',
        moduleName: 'viteser',
      },
      {
        type: 'named',
        identifier: 'maPrisma',
        moduleName: '@/utils/facade-init',
      },
      {
        type: 'named',
        identifier: 'genToken',
        moduleName: '@/services/func',
      },
    ],
  },
}

const func2: {
  id: string
  func: UseServerFunction
} = {
  id: '/path2/demo.ts',
  func: {
    fileId: '',
    position: [
      241,
      960,
    ],
    type: 'function',
    name: 'signIn',
    body: '{\n    "use server";\n    formSchema.parse(values);\n    const { email, password } = values;\n    const user = await maPrisma().user.findFirst({\n        where: {\n            email\n        },\n        select: {\n            id: true,\n            email: true,\n            password: true\n        }\n    });\n    if (!user) {\n        return {\n            type: "error",\n            message: signInFailMessage,\n            data: null\n        };\n    }\n    const isPasswordValid = await verify(user.password, password);\n    if (!isPasswordValid) {\n        return {\n            type: "error",\n            message: signInFailMessage,\n            data: null\n        };\n    }\n    const token = await genToken({\n        id: user.id,\n        email: user.email\n    });\n    return {\n        data: {\n            user,\n            token\n        }\n    };\n}',
    params: [
      {
        name: 'values',
        type: 'any',
      },
    ],
    usedImports: [
      {
        type: 'named',
        identifier: 'formSchema',
        moduleName: '@/services/auth/sign-in.f',
      },
      {
        type: 'named',
        identifier: 'maPrisma',
        moduleName: '@/utils/facade-init',
      },
      {
        type: 'named',
        identifier: 'verify',
        moduleName: 'argon2',
      },
      {
        type: 'named',
        identifier: 'genToken',
        moduleName: '@/services/func',
      },
    ],
  },
}

describe('should', () => {
  it('test generate entry code', async () => {
    const code = await transEntryIdentifier({
      fileCode1: func1,
      fileCode2: func2,
    })
    expect(code).eq(`    if (code === 'fileCode1') {
      const importData = await Promise.all([
          import('@/services/middlewares')
            .then(m => m['signInedMiddleware']),
          import('viteser')
            .then(m => m['useJwtPayload']),
          import('@/utils/facade-init')
            .then(m => m['maPrisma']),
          import('@/services/func')
            .then(m => m['genToken'])
      ])
      const values = [
        ...data,
        ...importData
      ]
      return (
        async (signInedMiddleware, useJwtPayload, maPrisma, genToken) => {
    "use server";
    await signInedMiddleware();
    const [payload] = useJwtPayload();
    const user = await maPrisma().user.findFirstOrThrow({
        where: {
            id: payload.id
        },
        select: {
            id: true,
            email: true,
            name: true,
            TeamMembers: {
                select: {
                    status: true,
                    teamId: true,
                    role: true,
                    Team: {
                        select: {
                            id: true,
                            name: true,
                            cover: true,
                            Projects: {
                                select: {
                                    id: true,
                                    name: true,
                                    cover: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    payload.teams = user.TeamMembers.map((teamMember) => {
        const { Team } = teamMember;
        return {
            id: teamMember.teamId,
            name: Team.name,
            cover: teamMember.Team.cover,
            role: teamMember.role,
            status: teamMember.status,
            projects: Team.Projects.map((project) => ({
                name: project.name,
                cover: project.cover,
                id: project.id
            }))
        };
    });
    const token = await genToken(payload);
    return {
        data: {
            token,
            payload
        }
    };
}
      )(...values)
    }
          if (code === 'fileCode2') {
      const importData = await Promise.all([
          import('@/services/auth/sign-in.f')
            .then(m => m['formSchema']),
          import('@/utils/facade-init')
            .then(m => m['maPrisma']),
          import('argon2')
            .then(m => m['verify']),
          import('@/services/func')
            .then(m => m['genToken'])
      ])
      const values = [
        ...data,
        ...importData
      ]
      return (
        async (values, formSchema, maPrisma, verify, genToken) => {
    "use server";
    formSchema.parse(values);
    const { email, password } = values;
    const user = await maPrisma().user.findFirst({
        where: {
            email
        },
        select: {
            id: true,
            email: true,
            password: true
        }
    });
    if (!user) {
        return {
            type: "error",
            message: signInFailMessage,
            data: null
        };
    }
    const isPasswordValid = await verify(user.password, password);
    if (!isPasswordValid) {
        return {
            type: "error",
            message: signInFailMessage,
            data: null
        };
    }
    const token = await genToken({
        id: user.id,
        email: user.email
    });
    return {
        data: {
            user,
            token
        }
    };
}
      )(...values)
    }
      `)
  })
})
