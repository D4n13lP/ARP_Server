// src/routes/user.routes.ts
import { Router } from 'express'
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    login,
} from '../controllers/user.controller.js'

const router = Router()

router.post('/', createUser)
router.get('/', getUsers)
router.get('/:userID', getUserById)
router.put('/:userID', updateUser)
router.delete('/:userID', deleteUser)
router.post('/login', login)

export default router
