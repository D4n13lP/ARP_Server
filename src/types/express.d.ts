// src/types/express.d.ts
// Augmenta Request con el payload que authenticateToken decodifica del JWT.
export interface AuthUser {
    userID: string
    userType: string
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
}

export {}
