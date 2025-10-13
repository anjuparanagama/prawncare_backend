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

# TODO: Fix /tasks API to properly handle req.user.id from decoded token

- [x] Add console logging for req.user object in /tasks route for debugging
- [x] Add check for req.user.id presence and validity in /tasks route; return 400 error if missing/invalid
- [ ] Modify /tasks route to fetch worker_id from database using req.user.email since id is missing in token
