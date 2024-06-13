import { z } from 'zod';
import { facade } from '@/utils/facade';
import { genToken } from '@/services/func';

export const formSchema = z.object({
  email: z
    .string({
      required_error: 'email 是必填的',
    })
    .describe('邮箱')
    .email({
      message: 'email 格式不正确',
    }),
  password: z
    .string({
      required_error: 'password 是必填的',
    })
    .describe('密码')
    .min(8, {
      message: '密码 至少 8 个字符',
    })
    .max(30, {
      message: '密码 最多 30 个字符',
    }),
});

const signInFailMessage = '用户名或密码错误';

export async function signIn(values: z.infer<typeof formSchema>) {
  'use server';
  /**
   * 验证
   */
  formSchema.parse(values);

  const { email, password } = values;
  const user = await facade.prisma.user.findFirst({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) {
    return {
      type: 'error',
      message: signInFailMessage,
      data: null,
    };
  }

  const { verify } = await import('argon2');
  const isPasswordValid = await verify(user.password, password);
  if (!isPasswordValid) {
    return {
      type: 'error',
      message: signInFailMessage,
      data: null,
    };
  }

  const token = await genToken({
    id: user.id,
    email: user.email,
  });

  return {
    data: {
      user,
      token,
    },
  };
}
