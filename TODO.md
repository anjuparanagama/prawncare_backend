# TODO: Fix req.body undefined error in login.js

- [x] Update admin login route to use req.body?.property for safe access
- [x] Update customer-login route to use req.body?.property for safe access
- [x] Update worker-login route to use req.body?.property for safe access
- [x] Update supplier-login route to use req.body?.property for safe access

# TODO: Add API for supplier supply orders

- [x] Add GET /my-supply-orders route in supplier.js to fetch orders for specific supplier_id

# TODO: Add secure update API for supplier order status

- [x] Add PATCH /update-my-order-status route in supplier.js to update status for supplier's own orders

# TODO for Modifying /update-order-status Email Recipient

- [x] Modify the `/update-order-status` endpoint in `backend/routes/mobile/supplier/supplier.js` to send email to 'anjula@gmail.com' instead of fetching manager's email from database.
