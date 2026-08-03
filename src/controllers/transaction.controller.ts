// src/controllers/transaction.controller.ts
import type { Request, Response } from 'express'
import { Transaction, Client, TransDetail } from '../models/index.js'

export async function createTransaction(req: Request, res: Response) {
    try {
        // OJO: nunca mandes folioYear, folioMonth, folioNumber ni folio en el body.
        // Los genera automáticamente el trigger de PostgreSQL al insertar.
        const { folioYear, folioMonth, folioNumber, folio, ...safeBody } = req.body

        const transaction = await Transaction.create(safeBody)
        await transaction.reload() // trae el folio ya generado por el trigger

        res.status(201).json(transaction)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTransactions(req: Request, res: Response) {
    try {
        const transactions = await Transaction.findAll({
            include: [Client],
            order: [['transactionDate', 'DESC']],
        })
        res.json(transactions)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransactionById(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID, {
            include: [Client, TransDetail],
        })
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }
        res.json(transaction)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransaction(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID)
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }

        // Tampoco dejamos que se sobreescriba el folio en un update
        const { folioYear, folioMonth, folioNumber, folio, ...safeBody } = req.body

        await transaction.update(safeBody)
        res.json(transaction)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransaction(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID)
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }
        await transaction.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
