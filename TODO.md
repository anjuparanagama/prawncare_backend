# Customer Validation Implementation

## Tasks
- [x] Add JWT import and JWT_SECRET constant to customer.js
- [x] Create authenticateCustomer middleware function to verify JWT token and check role
- [x] Modify /place-order route: remove customer_id from req.body, use req.user.id, apply authenticateCustomer middleware
- [x] Modify /Order-Status route: remove customer_id from req.query, use req.user.id, apply authenticateCustomer middleware
- [x] Leave /available-prawn-types route unprotected as it's public information
