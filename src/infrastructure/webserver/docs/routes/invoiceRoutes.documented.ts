// src/infrastructure/webserver/docs/routes/invoiceRoutes.documented.ts
/**
 * @swagger
 * /invoices:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Listar facturas
 *     description: Obtiene una lista paginada de facturas con filtros opcionales
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, issued, sent, paid, partial, overdue, cancelled]
 *         description: Filtrar por estado
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sale, purchase, credit_note, debit_note]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por cliente
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de emisión desde
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de emisión hasta
 *     responses:
 *       200:
 *         description: Lista de facturas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     invoices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Invoice'
 *                     total:
 *                       type: integer
 *                       description: Total de facturas
 *                     pages:
 *                       type: integer
 *                       description: Total de páginas
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Crear factura
 *     description: Crea una nueva factura en el sistema
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceCreate'
 *     responses:
 *       201:
 *         description: Factura creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Factura creada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /invoices/{invoiceId}:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Obtener factura
 *     description: Obtiene los detalles de una factura específica
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Detalles de la factura
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     tags:
 *       - Invoices
 *     summary: Actualizar factura
 *     description: Actualiza una factura existente
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceUpdate'
 *     responses:
 *       200:
 *         description: Factura actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Factura actualizada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - Invoices
 *     summary: Eliminar factura
 *     description: Elimina una factura (soft delete)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: Factura eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Factura eliminada correctamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /invoices/{invoiceId}/pdf:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Generar PDF
 *     description: Genera y descarga un PDF de la factura
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: PDF de la factura
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /invoices/{invoiceId}/sri:
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Sincronizar con SRI
 *     description: Sincroniza la factura con el Servicio de Rentas Internas
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - config
 *             properties:
 *               config:
 *                 type: object
 *                 description: Configuración del SRI
 *     responses:
 *       200:
 *         description: Factura sincronizada con SRI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Factura sincronizada con el SRI
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorizationNumber:
 *                       type: string
 *                     authorizationDate:
 *                       type: string
 *                       format: date-time
 *                     accessKey:
 *                       type: string
 *                     electronicDocumentUrl:
 *                       type: string
 *                       format: uri
 *                     status:
 *                       type: string
 *                       enum: [AUTHORIZED, REJECTED, PENDING]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /invoices/{invoiceId}/email:
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Enviar por email
 *     description: Envía la factura por email al cliente o a un destinatario específico
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email destinatario (opcional, por defecto usa el email del cliente)
 *               sriConfig:
 *                 type: object
 *                 description: Configuración del SRI (opcional)
 *     responses:
 *       200:
 *         description: Factura enviada por email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Factura enviada por email correctamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /invoices/{invoiceId}/payment:
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Registrar pago
 *     description: Registra un pago para la factura
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la factura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *               - paymentDate
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Monto del pago
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, bank_transfer, credit_card, debit_card, check, paypal, other]
 *                 description: Método de pago
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Fecha de pago
 *               paymentReference:
 *                 type: string
 *                 description: Número de referencia (transacción, cheque, etc)
 *               notes:
 *                 type: string
 *                 description: Notas adicionales sobre el pago
 *     responses:
 *       200:
 *         description: Pago registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pago registrado correctamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Factura no encontrada
 *       400:
 *         $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         invoiceNumber:
 *           type: string
 *         type:
 *           type: string
 *           enum: [sale, purchase, credit_note, debit_note]
 *         issueDate:
 *           type: string
 *           format: date
 *         dueDate:
 *           type: string
 *           format: date
 *         subtotal:
 *           type: number
 *           format: float
 *         taxPercentage:
 *           type: number
 *           format: float
 *         tax:
 *           type: number
 *           format: float
 *         discountPercentage:
 *           type: number
 *           format: float
 *         discount:
 *           type: number
 *           format: float
 *         total:
 *           type: number
 *           format: float
 *         amountPaid:
 *           type: number
 *           format: float
 *         amountDue:
 *           type: number
 *           format: float
 *         paymentMethod:
 *           type: string
 *           enum: [cash, bank_transfer, credit_card, debit_card, check, paypal, other]
 *         paymentReference:
 *           type: string
 *         paymentDate:
 *           type: string
 *           format: date
 *         sriAuthorization:
 *           type: string
 *         sriAccessKey:
 *           type: string
 *         electronicInvoiceUrl:
 *           type: string
 *           format: uri
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, issued, sent, paid, partial, overdue, cancelled]
 *         clientId:
 *           type: string
 *           format: uuid
 *         sellerId:
 *           type: string
 *           format: uuid
 *         projectId:
 *           type: string
 *           format: uuid
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InvoiceItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     InvoiceItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: number
 *           format: integer
 *         price:
 *           type: number
 *           format: float
 *         subtotal:
 *           type: number
 *           format: float
 *         tax:
 *           type: number
 *           format: float
 *         total:
 *           type: number
 *           format: float
 *         materialId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *
 *     InvoiceCreate:
 *       type: object
 *       required:
 *         - type
 *         - issueDate
 *         - dueDate
 *         - clientId
 *         - items
 *       properties:
 *         invoiceNumber:
 *           type: string
 *           description: Opcional, se genera automáticamente si no se proporciona
 *         type:
 *           type: string
 *           enum: [sale, purchase, credit_note, debit_note]
 *         issueDate:
 *           type: string
 *           format: date
 *         dueDate:
 *           type: string
 *           format: date
 *         taxPercentage:
 *           type: number
 *           format: float
 *           default: 12
 *         discountPercentage:
 *           type: number
 *           format: float
 *           default: 0
 *         notes:
 *           type: string
 *         clientId:
 *           type: string
 *           format: uuid
 *         sellerId:
 *           type: string
 *           format: uuid
 *           description: Opcional, por defecto es el usuario autenticado
 *         projectId:
 *           type: string
 *           format: uuid
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - quantity
 *               - price
 *               - description
 *             properties:
 *               quantity:
 *                 type: number
 *                 format: integer
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *               materialId:
 *                 type: string
 *                 format: uuid
 *
 *     InvoiceUpdate:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [sale, purchase, credit_note, debit_note]
 *         issueDate:
 *           type: string
 *           format: date
 *         dueDate:
 *           type: string
 *           format: date
 *         taxPercentage:
 *           type: number
 *           format: float
 *         discountPercentage:
 *           type: number
 *           format: float
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [draft, issued, sent, paid, partial, overdue, cancelled]
 *         clientId:
 *           type: string
 *           format: uuid
 *         sellerId:
 *           type: string
 *           format: uuid
 *         projectId:
 *           type: string
 *           format: uuid
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *                 format: integer
 *               price:
 *                 type: number
 *                 format: float
 *               description:
 *                 type: string
 *               materialId:
 *                 type: string
 *                 format: uuid
 */
