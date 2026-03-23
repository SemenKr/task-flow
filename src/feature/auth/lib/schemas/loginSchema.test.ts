import {describe, expect, it} from 'vitest';
import {loginSchema} from './loginSchema';

describe('loginSchema', () => {
    it('accepts valid credentials', () => {
        const result = loginSchema.safeParse({
            email: 'free@samuraijs.com',
            password: 'free',
            rememberMe: true,
        })

        expect(result.success).toBe(true)
    })

    it('rejects invalid email and short password', () => {
        const result = loginSchema.safeParse({
            email: 'invalid-email',
            password: '12',
        })

        expect(result.success).toBe(false)

        if (!result.success) {
            expect(result.error.flatten().fieldErrors.email).toContain('Incorrect email address')
            expect(result.error.flatten().fieldErrors.password).toContain('Password must be at least 3 characters long')
        }
    })
})
