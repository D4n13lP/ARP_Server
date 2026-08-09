// src/utils/seedUserPermissions.ts
import type { Transaction } from 'sequelize'
import { RolePermission, UserPermission } from '../models/index.js'

// Copia la plantilla de rolePermission (por tipo de cuenta) como punto de
// partida editable en userPermission para un usuario específico — de ahí en
// adelante sus permisos son independientes, editables persona por persona
// sin afectar a nadie más. Se usa al crear la cuenta, y como red de
// seguridad en demote si el usuario nunca tuvo permisos individuales
// sembrados (p. ej. el primer admin del sistema, que nunca pasó por 'seller').
export async function seedUserPermissions(userID: string, userType: string, transaction?: Transaction) {
    const templates = await RolePermission.findAll({ where: { userType }, transaction })
    if (templates.length === 0) return

    await UserPermission.bulkCreate(
        templates.map((t) => ({
            userID,
            moduleID: t.moduleID,
            canView: t.canView,
            canCreate: t.canCreate,
            canEdit: t.canEdit,
            canDelete: t.canDelete,
        })),
        { transaction },
    )
}
