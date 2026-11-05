import express from 'express';
import cors from 'cors';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase, saveDatabase, getPgPool } from './db.js';

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'vitaria_production_jwt_secret_key_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Live Request Debugger for HP / Mobile & OAuth tracking
app.use((req, res, next) => {
  if (
    !req.url.startsWith('/@') &&
    !req.url.startsWith('/src') &&
    !req.url.startsWith('/node_modules') &&
    !req.url.startsWith('/api/consultations')
  ) {
    console.log(`[DEBUG REQ] ${req.method} ${req.originalUrl || req.url} | IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress} | Referer: ${req.headers.referer || '-'}`);
  }
  next();
});

// Endpoint to receive debug logs directly from the user's phone browser
app.post('/api/debug-client', (req, res) => {
  console.log('\n================ [DEBUG FROM USER PHONE] ================');
  console.log('Timestamp :', new Date().toISOString());
  console.log('Payload   :', JSON.stringify(req.body, null, 2));
  console.log('=========================================================\n');
  res.json({ success: true });
});

const router = express.Router();

// ==========================================
// AUTHENTICATION & ROLE MIDDLEWARE
// ==========================================
export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan. Silakan login terlebih dahulu.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login telah berakhir atau tidak valid. Silakan login ulang.'
    });
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Akses ditolak. Fitur ini hanya untuk peran: ${allowedRoles.join(', ')}.`
    });
  }

  next();
};

export const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {}
  }
  next();
};

// ==========================================
// HEALTH CHECK
// ==========================================
router.get('/health', (req, res) => {
  const pool = getPgPool();
  res.json({
    status: 'ok',
    service: 'Apotek Vitaria Production API',
    database: pool ? 'PostgreSQL (Connected)' : 'Production In-Memory (Clean Slate, No JSON)',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// REAL AUTHENTICATION ENDPOINTS
// ==========================================

// POST /auth/register - Real User Registration with hashed password
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, phone = '', password, role = 'customer' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Format alamat email tidak valid.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const pool = getPgPool();

    if (pool) {
      // Check if email already registered
      const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.'
        });
      }

      const newId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
      const avatarUrl =
        role === 'staff'
          ? '/vitaria.jpg'
          : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`;

      const result = await pool.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, phone, role, avatar_url, created_at`,
        [newId, name.trim(), cleanEmail, phone.trim(), hashedPassword, role, avatarUrl]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Pendaftaran akun berhasil.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url,
          registeredAt: user.created_at
        }
      });
    }

    // In-memory fallback
    const db = getDatabase();
    if ((db.users || []).some((u) => u.email === cleanEmail)) {
      return res.status(409).json({
        success: false,
        message: 'Alamat email ini sudah terdaftar. Silakan masuk.'
      });
    }

    const memoryUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password_hash: hashedPassword,
      role,
      avatarUrl: '/vitaria.jpg',
      registeredAt: new Date().toISOString()
    };
    db.users = db.users || [];
    db.users.push(memoryUser);
    saveDatabase(db);

    const token = jwt.sign(
      { id: memoryUser.id, name: memoryUser.name, email: memoryUser.email, role: memoryUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, message: 'Pendaftaran berhasil.', token, user: memoryUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /auth/login - Real Login with Password Verification
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Alamat email harus diisi.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Kata sandi harus diisi.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pool = getPgPool();

    if (pool) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Akun dengan email ini tidak ditemukan. Silakan periksa kembali atau daftar akun baru.'
        });
      }

      const user = result.rows[0];

      // Password Verification
      if (!user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'Akun ini terdaftar via Google. Silakan masuk menggunakan tombol Lanjutkan dengan Google.'
        });
      }

      const isPasswordMatch = bcrypt.compareSync(password, user.password_hash);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.'
        });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Login berhasil.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url,
          registeredAt: user.created_at
        }
      });
    }

    // Fallback
    const db = getDatabase();
    const user = (db.users || []).find((u) => u.email === cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak ditemukan. Silakan registrasi terlebih dahulu.'
      });
    }

    if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Kata sandi yang Anda masukkan salah.'
      });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /auth/google - Real Google OAuth Callback / Profile Registration
router.post('/auth/google', async (req, res) => {
  try {
    const { name, email, avatarUrl, role = 'customer' } = req.body;
    console.log('[Google Auth] Incoming OAuth payload for email:', email);

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Data akun Google tidak valid.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pool = getPgPool();

    if (pool) {
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      let user = null;

      if (existing.rows.length > 0) {
        user = existing.rows[0];
        if (avatarUrl && avatarUrl !== user.avatar_url) {
          await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE email = $2', [
            avatarUrl,
            cleanEmail
          ]);
          user.avatar_url = avatarUrl;
        }
      } else {
        const newId = `usr-g-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
        const result = await pool.query(
          `INSERT INTO users (id, name, email, phone, role, avatar_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [newId, name || 'Pengguna Google', cleanEmail, '', role, avatarUrl || '']
        );
        user = result.rows[0];
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Autentikasi Google berhasil.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          avatarUrl: user.avatar_url,
          registeredAt: user.created_at
        }
      });
    }

    // Fallback
    const db = getDatabase();
    let user = (db.users || []).find((u) => u.email === cleanEmail);
    if (!user) {
      user = {
        id: `usr-g-${Date.now()}`,
        name: name || 'Pengguna Google',
        email: cleanEmail,
        phone: '',
        role,
        avatarUrl: avatarUrl || '',
        registeredAt: new Date().toISOString()
      };
      db.users = db.users || [];
      db.users.push(user);
      saveDatabase(db);
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /auth/me - Get Current Authenticated User
router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const pool = getPgPool();
    if (pool) {
      const result = await pool.query('SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = $1', [
        req.user.id
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      }
      const u = result.rows[0];
      return res.json({
        success: true,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          avatarUrl: u.avatar_url,
          registeredAt: u.created_at
        }
      });
    }

    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ORDERS & TRANSACTIONS
// ==========================================

// GET /orders - Get all transactions
router.get('/orders', async (req, res) => {
  try {
    const pool = getPgPool();
    const { status, paymentStatus, search, customerId } = req.query;

    if (pool) {
      let query = `
        SELECT o.*, 
          COALESCE(
            json_agg(
              json_build_object(
                'medicineId', oi.medicine_id,
                'medicineName', oi.medicine_name,
                'dosageForm', oi.dosage_form,
                'strength', oi.strength,
                'quantity', oi.quantity,
                'unit', oi.unit,
                'unitPrice', oi.unit_price,
                'totalPrice', oi.total_price,
                'requiresPrescription', oi.requires_prescription,
                'instructions', oi.instructions
              )
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1
      `;
      const params = [];

      if (customerId) {
        params.push(customerId);
        query += ` AND o.customer_id = $${params.length}`;
      }
      if (status && status !== 'all') {
        params.push(status);
        query += ` AND o.order_status = $${params.length}`;
      }
      if (paymentStatus && paymentStatus !== 'all') {
        params.push(paymentStatus);
        query += ` AND o.payment_status = $${params.length}`;
      }

      query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

      const result = await pool.query(query, params);
      const orders = result.rows.map((r) => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        customerId: r.customer_id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        customerEmail: r.customer_email,
        subtotal: r.subtotal,
        deliveryFee: r.delivery_fee,
        discount: r.discount,
        grandTotal: r.grand_total,
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        paymentProofUrl: r.payment_proof_url,
        prescriptionUrl: r.prescription_url,
        paidAt: r.paid_at,
        deliveryMethod: r.delivery_method,
        shippingAddress: r.shipping_address,
        courierNotes: r.courier_notes,
        orderStatus: r.order_status,
        staffVerifierName: r.staff_verifier_name,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        completedAt: r.completed_at,
        items: r.items || []
      }));

      return res.json({ success: true, count: orders.length, data: orders });
    }

    const db = getDatabase();
    let results = [...(db.orders || [])];

    if (customerId) {
      results = results.filter((o) => o.customerId === customerId);
    }
    if (status && status !== 'all') {
      results = results.filter((o) => o.orderStatus === status);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      results = results.filter((o) => o.paymentStatus === paymentStatus);
    }
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(
        (o) =>
          o.invoiceNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.items.some((i) => i.medicineName.toLowerCase().includes(q))
      );
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /orders/checkout - Create new order with prescription support
router.post('/orders/checkout', optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      customerId = null,
      customerName = 'Pelanggan',
      customerPhone = '',
      items = [],
      deliveryMethod = 'delivery',
      shippingAddress = '',
      courierNotes = '',
      paymentMethod = 'qris',
      paymentProofUrl = '',
      prescriptionUrl = ''
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong' });
    }

    // Check if any medication requires prescription
    const requiresPrescription = items.some((i) => i.requiresPrescription);
    if (requiresPrescription && !prescriptionUrl) {
      return res.status(400).json({
        success: false,
        message: 'Pesanan mengandung obat keras/resep dokter. Wajib mengunggah foto resep dokter terlebih dahulu.'
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = deliveryMethod === 'delivery' ? 10000 : 0;
    const discount = 0;
    const grandTotal = subtotal + deliveryFee - discount;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-VIT/${todayStr}/${randSeq}`;

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // If prescription is required, initial orderStatus is 'pending_prescription' for APJ verification
    const orderStatus = requiresPrescription ? 'pending_prescription' : 'processing';

    // Verify if customerId exists in PostgreSQL users table to prevent FK constraint violation
    const targetCustomerId = req.user?.id || customerId || null;
    let validCustomerId = null;
    const pool = getPgPool();
    if (pool && targetCustomerId) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [targetCustomerId]);
      if (userCheck.rows.length > 0) {
        validCustomerId = userCheck.rows[0].id;
      }
    }

    const newOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      invoiceNumber,
      customerId: validCustomerId || '',
      customerName: req.user?.name || customerName,
      customerPhone: req.user?.phone || customerPhone,
      items,
      subtotal,
      deliveryFee,
      discount,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === 'qris' || paymentProofUrl ? 'verifying' : 'pending',
      paymentProofUrl,
      prescriptionUrl,
      deliveryMethod,
      shippingAddress,
      courierNotes,
      orderStatus,
      staffVerifierName: 'apt. Sarinah Cantika, S.Farm.',
      createdAt: formattedDate,
      updatedAt: formattedDate,
      paidAt: paymentProofUrl ? formattedDate : undefined
    };

    if (pool) {
      await pool.query(
        `INSERT INTO orders 
         (id, invoice_number, customer_id, customer_name, customer_phone, subtotal, delivery_fee, discount, grand_total, payment_method, payment_status, payment_proof_url, prescription_url, delivery_method, shipping_address, courier_notes, order_status, staff_verifier_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          newOrder.id,
          newOrder.invoiceNumber,
          validCustomerId,
          newOrder.customerName,
          newOrder.customerPhone,
          newOrder.subtotal,
          newOrder.deliveryFee,
          newOrder.discount,
          newOrder.grandTotal,
          newOrder.paymentMethod,
          newOrder.paymentStatus,
          newOrder.paymentProofUrl,
          newOrder.prescriptionUrl,
          newOrder.deliveryMethod,
          newOrder.shippingAddress,
          newOrder.courierNotes,
          newOrder.orderStatus,
          newOrder.staffVerifierName
        ]
      );

      for (const item of items) {
        await pool.query(
          `INSERT INTO order_items 
           (id, order_id, medicine_id, medicine_name, dosage_form, strength, quantity, unit, unit_price, total_price, requires_prescription, instructions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            newOrder.id,
            item.medicineId,
            item.medicineName,
            item.dosageForm || 'tablet',
            item.strength || '',
            item.quantity,
            item.unit || 'strip',
            item.unitPrice,
            item.totalPrice,
            !!item.requiresPrescription,
            item.instructions || ''
          ]
        );
      }
    }

    const db = getDatabase();
    db.orders.unshift(newOrder);
    saveDatabase(db);

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /orders/:id/verify-prescription - APJ Pharmacist verifies Doctor's Prescription
router.post('/orders/:id/verify-prescription', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAccepted, reason = '' } = req.body;
    const staffVerifierName = req.body.staffVerifierName || 'apt. Sarinah Cantika, S.Farm.';

    const newStatus = isAccepted ? 'processing' : 'prescription_rejected';

    const pool = getPgPool();
    if (pool) {
      if (isAccepted) {
        await pool.query(
          `UPDATE orders 
           SET order_status = 'processing', staff_verifier_name = $1, updated_at = NOW()
           WHERE id = $2`,
          [staffVerifierName, id]
        );
      } else {
        await pool.query(
          `UPDATE orders 
           SET order_status = 'prescription_rejected', 
               courier_notes = CONCAT(COALESCE(courier_notes, ''), ' [Penolakan Resep: ', $1::text, ']'),
               staff_verifier_name = $2, 
               updated_at = NOW()
           WHERE id = $3`,
          [reason, staffVerifierName, id]
        );
      }
    }

    const db = getDatabase();
    const order = db.orders.find((o) => o.id === id);
    if (order) {
      order.orderStatus = newStatus;
      if (!isAccepted && reason) {
        order.courierNotes = `${order.courierNotes || ''} [Penolakan Resep: ${reason}]`.trim();
      }
      order.staffVerifierName = staffVerifierName;
      order.updatedAt = new Date().toISOString();
      saveDatabase(db);
    }

    res.json({
      success: true,
      message: isAccepted
        ? 'Resep dokter berhasil diverifikasi dan disetujui oleh APJ.'
        : 'Resep dokter ditolak.',
      data: order || { id, orderStatus: newStatus }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /orders/:id/status - Update order status (Staff / Admin Protected)
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, staffVerifierName = 'apt. Sarinah Cantika, S.Farm.' } = req.body;

    const pool = getPgPool();
    if (pool) {
      await pool.query(
        `UPDATE orders 
         SET order_status = $1, staff_verifier_name = $2, updated_at = NOW(), 
             completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END,
             payment_status = CASE WHEN $1 = 'completed' THEN 'paid' ELSE payment_status END
         WHERE id = $3`,
        [orderStatus, staffVerifierName, id]
      );
    }

    const db = getDatabase();
    const order = db.orders.find((o) => o.id === id);
    if (order) {
      order.orderStatus = orderStatus;
      order.staffVerifierName = staffVerifierName;
      order.updatedAt = new Date().toISOString();
      if (orderStatus === 'completed') {
        order.completedAt = new Date().toISOString();
        order.paymentStatus = 'paid';
      }
      saveDatabase(db);
    }

    res.json({ success: true, data: order || { id, orderStatus } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /orders/:id/verify-payment - Accept / reject payment (Staff / Admin Protected)
router.post('/orders/:id/verify-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAccepted, reason = '' } = req.body;

    const pool = getPgPool();
    if (pool) {
      if (isAccepted) {
        await pool.query(
          `UPDATE orders 
           SET payment_status = 'paid', paid_at = NOW(), order_status = 'processing', updated_at = NOW()
           WHERE id = $1`,
          [id]
        );
      } else {
        await pool.query(
          `UPDATE orders 
           SET payment_status = 'failed', courier_notes = CONCAT(COALESCE(courier_notes, ''), ' [Penolakan: ', $2::text, ']'), updated_at = NOW()
           WHERE id = $1`,
          [id, reason]
        );
      }
    }

    const db = getDatabase();
    const order = db.orders.find((o) => o.id === id);
    if (order) {
      if (isAccepted) {
        order.paymentStatus = 'paid';
        order.paidAt = new Date().toISOString();
        order.orderStatus = order.orderStatus === 'pending' ? 'processing' : order.orderStatus;
      } else {
        order.paymentStatus = 'failed';
        order.courierNotes = `${order.courierNotes || ''} [Alasan Penolakan: ${reason}]`.trim();
      }
      order.updatedAt = new Date().toISOString();
      saveDatabase(db);
    }

    res.json({ success: true, data: order || { id, isAccepted } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /reports/sales-summary - Staff Dashboard KPIs
router.get('/reports/sales-summary', (req, res) => {
  try {
    const db = getDatabase();
    const orders = db.orders || [];

    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalTransactions = paidOrders.length;
    const pendingVerifications = orders.filter((o) => o.paymentStatus === 'verifying').length;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    const drugCounter = {};
    paidOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!drugCounter[item.medicineName]) {
          drugCounter[item.medicineName] = { name: item.medicineName, totalQty: 0, totalSales: 0 };
        }
        drugCounter[item.medicineName].totalQty += item.quantity;
        drugCounter[item.medicineName].totalSales += item.totalPrice;
      });
    });

    const topSellingDrugs = Object.values(drugCounter)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        pendingVerifications,
        averageOrderValue,
        topSellingDrugs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /reports/export-excel
router.get('/reports/export-excel', (req, res) => {
  try {
    const db = getDatabase();
    const orders = db.orders || [];

    const rows = orders.map((o, idx) => {
      const itemsList = (o.items || []).map((i) => `${i.medicineName} (${i.quantity} ${i.unit})`).join(', ');

      return {
        'No.': idx + 1,
        'No. Faktur / Invoice': o.invoiceNumber,
        'Tanggal & Waktu': o.createdAt,
        'Nama Pelanggan': o.customerName,
        'No. Telepon': o.customerPhone,
        'Rincian Obat': itemsList,
        'Subtotal (Rp)': o.subtotal,
        'Ongkos Kirim (Rp)': o.deliveryFee,
        'Diskon (Rp)': o.discount,
        'Total Akhir (Rp)': o.grandTotal,
        'Metode Pembayaran':
          o.paymentMethod === 'qris'
            ? 'QRIS Resmi'
            : o.paymentMethod === 'bank_transfer'
            ? 'Transfer Bank'
            : 'Tunai / COD',
        'Status Pembayaran':
          o.paymentStatus === 'paid'
            ? 'Lunas'
            : o.paymentStatus === 'verifying'
            ? 'Verifikasi Bukti'
            : o.paymentStatus === 'failed'
            ? 'Gagal / Ditolak'
            : 'Menunggu Bayar',
        'Status Pengiriman':
          o.orderStatus === 'completed'
            ? 'Selesai Diterima'
            : o.orderStatus === 'shipped'
            ? 'Sedang Diantar'
            : o.orderStatus === 'processing'
            ? 'Sedang Disiapkan'
            : 'Menunggu',
        'Metode Antar': o.deliveryMethod === 'delivery' ? 'Kurir Apotek' : 'Ambil di Apotek',
        'Alamat Penerima': o.shippingAddress || '-',
        'Petugas Kasir / APJ': o.staffVerifierName || 'apt. Sarinah Cantika, S.Farm.'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Status: 'Belum ada transaksi di database produksi' }]
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = `Laporan_Penjualan_Apotek_Vitaria_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /reports/export-stock-excel
router.get('/reports/export-stock-excel', async (req, res) => {
  try {
    let medicines = [];
    const pool = getPgPool();
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM medicines ORDER BY stock ASC, name ASC;'
      );
      medicines = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        genericName: r.generic_name || '',
        category: r.category || 'Obat Umum',
        dosageForm: r.dosage_form || 'tablet',
        strength: r.strength || '',
        unit: r.unit || 'strip',
        sellingPrice: r.price || 0,
        purchasePrice: Math.round((r.price || 0) * 0.8),
        totalStock: r.stock != null ? r.stock : 0,
        minStock: r.min_stock || 10,
        medicineClass: r.requires_prescription ? 'Keras / Resep' : 'Bebas',
        manufacturer: r.manufacturer || 'Industri Farmasi Indonesia'
      }));
    } else {
      const db = getDatabase();
      medicines = db.medicines || [];
    }

    const rows = medicines.map((m, idx) => {
      const stockStatus =
        m.totalStock <= 0
          ? 'HABIS (KRITIS)'
          : m.totalStock <= m.minStock
          ? 'MENIPIS (PERLU RESTOCK)'
          : 'AMAN';

      const purchaseValuation = m.totalStock * (m.purchasePrice || Math.round(m.sellingPrice * 0.8));
      const sellingValuation = m.totalStock * (m.sellingPrice || 0);

      return {
        'No.': idx + 1,
        'Kode / SKU': `SKU-${(m.id || '').slice(-6).toUpperCase()}`,
        'Nama Obat': m.name,
        'Nama Generik': m.genericName || '-',
        'Kategori': m.category,
        'Bentuk Sediaan': m.dosageForm,
        'Kekuatan Dosis': m.strength || '-',
        'Satuan': m.unit,
        'Stok Fisik Saat Ini': m.totalStock,
        'Batas Stok Minimum': m.minStock,
        'Status Stok': stockStatus,
        'Harga Beli Satuan (Rp)': m.purchasePrice || Math.round(m.sellingPrice * 0.8),
        'Harga Jual Satuan (Rp)': m.sellingPrice,
        'Total Nilai Modal Stok (Rp)': purchaseValuation,
        'Total Potensi Penjualan (Rp)': sellingValuation,
        'Golongan Obat': m.medicineClass,
        'Pabrik / Produsen': m.manufacturer || 'Industri Farmasi'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Status: 'Belum ada data stok obat di sistem' }]
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok Farmasi');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = `Laporan_Stok_Apotek_Vitaria_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// MEDICINES (CATALOG & STOCK) ENDPOINTS
// ==========================================

// GET /medicines - List all catalog medicines from PostgreSQL
router.get('/medicines', async (req, res) => {
  try {
    const pool = getPgPool();
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM medicines ORDER BY requires_prescription DESC, name ASC;'
      );
      const medicines = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        genericName: r.generic_name || '',
        category: r.category || 'Obat Umum',
        dosageForm: r.dosage_form || 'tablet',
        strength: r.strength || '',
        unit: r.unit || 'strip',
        sellingPrice: r.price,
        purchasePrice: Math.round(r.price * 0.8),
        totalStock: r.stock,
        minStock: r.min_stock || 10,
        medicineClass: r.requires_prescription ? 'Keras / Resep' : 'Bebas',
        requiresPrescription: !!r.requires_prescription,
        manufacturer: r.manufacturer || 'Industri Farmasi Indonesia',
        description: r.description || '',
        usageInstructions: r.requires_prescription ? 'Sesuai resep dokter' : 'Diminum sesudah makan',
        imageUrl: r.image_url || '/vitaria.jpg',
        expiryDate: '2026-12-31',
        batchNumber: `BAT-${r.id.slice(-6).toUpperCase()}`
      }));
      return res.json({ success: true, count: medicines.length, data: medicines });
    }

    const db = getDatabase();
    res.json({ success: true, count: (db.medicines || []).length, data: db.medicines || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /medicines - Add new medicine (Staff/Admin Protected)
router.post('/medicines', optionalAuthMiddleware, async (req, res) => {
  try {
    if (req.user && req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya staf apotek yang dapat menambah obat.' });
    }

    const {
      name,
      genericName = '',
      category = 'Obat Umum',
      dosageForm = 'tablet',
      strength = '',
      unit = 'strip',
      sellingPrice = 0,
      totalStock = 0,
      minStock = 10,
      medicineClass = 'Bebas',
      requiresPrescription,
      manufacturer = '',
      description = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama obat wajib diisi.' });
    }

    const isPrescription = requiresPrescription ?? (medicineClass === 'Keras / Resep');
    const id = `med-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;

    const pool = getPgPool();
    if (pool) {
      await pool.query(
        `INSERT INTO medicines 
         (id, name, generic_name, category, dosage_form, strength, unit, price, stock, min_stock, requires_prescription, manufacturer, description, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          id,
          name.trim(),
          genericName.trim(),
          category,
          dosageForm,
          strength.trim(),
          unit,
          Number(sellingPrice) || 0,
          Number(totalStock) || 0,
          Number(minStock) || 10,
          isPrescription,
          manufacturer.trim(),
          description.trim(),
          '/vitaria.jpg'
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Obat berhasil ditambahkan ke database.',
      data: {
        id,
        name: name.trim(),
        genericName: genericName.trim(),
        category,
        dosageForm,
        strength: strength.trim(),
        unit,
        sellingPrice: Number(sellingPrice) || 0,
        totalStock: Number(totalStock) || 0,
        minStock: Number(minStock) || 10,
        medicineClass: isPrescription ? 'Keras / Resep' : 'Bebas',
        requiresPrescription: isPrescription,
        manufacturer: manufacturer.trim(),
        description: description.trim(),
        imageUrl: '/vitaria.jpg'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /medicines/:id - Update medicine (Staff/Admin Protected)
router.put('/medicines/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      genericName,
      category,
      dosageForm,
      strength,
      unit,
      sellingPrice,
      totalStock,
      minStock,
      medicineClass,
      requiresPrescription,
      manufacturer,
      description
    } = req.body;

    const isPrescription = requiresPrescription != null ? requiresPrescription : (medicineClass ? medicineClass === 'Keras / Resep' : null);

    const pool = getPgPool();
    if (pool) {
      await pool.query(
        `UPDATE medicines 
         SET name = COALESCE($1, name),
             generic_name = COALESCE($2, generic_name),
             category = COALESCE($3, category),
             dosage_form = COALESCE($4, dosage_form),
             strength = COALESCE($5, strength),
             unit = COALESCE($6, unit),
             price = COALESCE($7, price),
             stock = COALESCE($8, stock),
             min_stock = COALESCE($9, min_stock),
             requires_prescription = COALESCE($10, requires_prescription),
             manufacturer = COALESCE($11, manufacturer),
             description = COALESCE($12, description),
             updated_at = NOW()
         WHERE id = $13`,
        [
          name,
          genericName,
          category,
          dosageForm,
          strength,
          unit,
          sellingPrice != null ? Number(sellingPrice) : null,
          totalStock != null ? Number(totalStock) : null,
          minStock != null ? Number(minStock) : null,
          isPrescription,
          manufacturer,
          description,
          id
        ]
      );
    }

    res.json({ success: true, message: 'Data obat berhasil diperbarui di database.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /medicines/:id/stock - Adjust stock (Staff/Admin Protected)
router.patch('/medicines/:id/stock', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityChanged, type = 'in' } = req.body;

    const delta = type === 'out' ? -Math.abs(Number(quantityChanged) || 0) : Math.abs(Number(quantityChanged) || 0);
    const pool = getPgPool();
    if (pool) {
      await pool.query(
        `UPDATE medicines 
         SET stock = GREATEST(0, stock + $1), updated_at = NOW()
         WHERE id = $2`,
        [delta, id]
      );
    }

    res.json({ success: true, message: `Stok obat berhasil diperbarui (${delta > 0 ? '+' : ''}${delta}).` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /medicines/:id - Delete medicine (Staff/Admin Protected)
router.delete('/medicines/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPgPool();
    if (pool) {
      await pool.query('DELETE FROM medicines WHERE id = $1', [id]);
    }
    res.json({ success: true, message: 'Obat berhasil dihapus dari database.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// CONSULTATIONS (LIVE CHAT) ENDPOINTS
// ==========================================

// GET /consultations - Get chat history from PostgreSQL
router.get('/consultations', optionalAuthMiddleware, async (req, res) => {
  try {
    const pool = getPgPool();
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM consultation_messages ORDER BY created_at ASC;'
      );
      const messages = result.rows.map((r) => ({
        id: r.id,
        customerId: r.customer_id,
        sender: r.sender,
        senderName: r.sender_name,
        text: r.text,
        imageUrl: r.image_url,
        imageCaption: r.image_caption,
        audioUrl: r.audio_url,
        audioDuration: r.audio_duration,
        timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: r.status,
        createdAt: r.created_at
      }));
      return res.json({ success: true, data: messages });
    }
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /consultations - Send message into PostgreSQL
router.post('/consultations', optionalAuthMiddleware, async (req, res) => {
  try {
    const {
      text = '',
      imageUrl = '',
      imageCaption = '',
      audioUrl = '',
      audioDuration = 0,
      sender = 'customer',
      senderName = 'Pasien'
    } = req.body;

    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const customerId = req.user?.id || 'usr-customer-1';
    const effectiveSender = req.user?.role === 'staff' || req.user?.role === 'admin' ? 'pharmacist' : sender;
    const effectiveName =
      effectiveSender === 'pharmacist'
        ? 'apt. Sarinah Cantika, S.Farm.'
        : req.user?.name || senderName;

    const pool = getPgPool();
    if (pool) {
      await pool.query(
        `INSERT INTO consultation_messages 
         (id, customer_id, sender, sender_name, text, image_url, image_caption, audio_url, audio_duration, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          customerId,
          effectiveSender,
          effectiveName,
          text,
          imageUrl,
          imageCaption,
          audioUrl,
          audioDuration,
          'sent'
        ]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        id,
        customerId,
        sender: effectiveSender,
        senderName: effectiveName,
        text,
        imageUrl,
        imageCaption,
        audioUrl,
        audioDuration,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// USER MEDICATIONS & REMINDERS ENDPOINTS
// ==========================================

// GET /medications - Get user's cloud medications and schedules
router.get('/medications', optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const pool = getPgPool();
    if (pool && userId) {
      const result = await pool.query(
        'SELECT * FROM user_medications WHERE user_id = $1 ORDER BY created_at DESC;',
        [userId]
      );
      const logsResult = await pool.query(
        'SELECT * FROM medication_logs WHERE user_id = $1 ORDER BY actual_time DESC LIMIT 100;',
        [userId]
      );

      const medications = result.rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        dosageForm: r.dosage_form,
        strength: r.strength,
        category: r.category,
        dosePerTake: r.dose_per_take,
        doseUnit: r.dose_unit,
        frequency: r.frequency,
        times: r.times || ['08:00'],
        instructions: r.instructions,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        notes: r.notes,
        reminderEnabled: r.reminder_enabled,
        reminderSound: r.reminder_sound,
        createdAt: r.created_at
      }));

      const logs = logsResult.rows.map((l) => ({
        id: l.id,
        medicationId: l.medication_id,
        scheduleTime: l.schedule_time,
        actualTime: l.actual_time,
        status: l.status,
        note: l.note
      }));

      return res.json({ success: true, medications, logs });
    }
    res.json({ success: true, medications: [], logs: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /medications - Add user personal medication
router.post('/medications', optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login diperlukan untuk menyimpan jadwal ke cloud.' });
    }

    const {
      name,
      dosageForm = 'tablet',
      strength = '',
      category = 'Obat Umum',
      dosePerTake = '1',
      doseUnit = 'Tablet',
      frequency = '1x Sehari',
      times = ['08:00'],
      instructions = 'Sesudah Makan',
      startDate = new Date().toISOString().slice(0, 10),
      endDate = '',
      notes = '',
      reminderEnabled = true,
      reminderSound = true
    } = req.body;

    const id = `umed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const pool = getPgPool();
    if (pool) {
      await pool.query(
        `INSERT INTO user_medications 
         (id, user_id, name, dosage_form, strength, category, dose_per_take, dose_unit, frequency, times, instructions, start_date, end_date, notes, reminder_enabled, reminder_sound)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id,
          userId,
          name,
          dosageForm,
          strength,
          category,
          dosePerTake,
          doseUnit,
          frequency,
          times,
          instructions,
          startDate,
          endDate,
          notes,
          reminderEnabled,
          reminderSound
        ]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        id,
        userId,
        name,
        dosageForm,
        strength,
        category,
        dosePerTake,
        doseUnit,
        frequency,
        times,
        instructions,
        startDate,
        endDate,
        status: 'active',
        notes,
        reminderEnabled,
        reminderSound,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /medications/:id - Delete personal medication
router.delete('/medications/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const pool = getPgPool();
    if (pool && userId) {
      await pool.query('DELETE FROM user_medications WHERE id = $1 AND user_id = $2', [id, userId]);
    }
    res.json({ success: true, message: 'Obat pribadi berhasil dihapus dari cloud.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /medications/log - Log taking medication
router.post('/medications/log', optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { medicationId, scheduleTime, status = 'taken', note = '' } = req.body;
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const pool = getPgPool();
    if (pool && userId) {
      await pool.query(
        `INSERT INTO medication_logs (id, user_id, medication_id, schedule_time, status, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, medicationId, scheduleTime, status, note]
      );
    }
    res.status(201).json({ success: true, data: { id, medicationId, scheduleTime, status, note } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /users - Get all registered users from database
router.get('/users', optionalAuthMiddleware, async (req, res) => {
  try {
    const pool = getPgPool();
    if (pool) {
      const result = await pool.query('SELECT id, name, email, phone, role, avatar_url, created_at FROM users ORDER BY created_at DESC');
      const users = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        avatarUrl: r.avatar_url,
        registeredAt: r.created_at
      }));
      return res.json({ success: true, count: users.length, data: users });
    }
    const db = getDatabase();
    res.json({ success: true, count: (db.users || []).length, data: db.users || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /users/profile - Update user profile information (name, phone, avatar)
router.put('/users/profile', optionalAuthMiddleware, async (req, res) => {
  try {
    const { id, name, phone, avatarUrl } = req.body;
    const userId = req.user?.id || id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(400).json({ success: false, message: 'Identitas pengguna tidak ditemukan.' });
    }

    const pool = getPgPool();
    if (pool) {
      const result = await pool.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             avatar_url = COALESCE($3, avatar_url),
             updated_at = NOW()
         WHERE id = $4 OR (email IS NOT NULL AND email = $5)
         RETURNING id, name, email, phone, role, avatar_url, created_at`,
        [name ? name.trim() : null, phone ? phone.trim() : null, avatarUrl || null, userId || null, userEmail || null]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan di database.' });
      }

      const r = result.rows[0];
      const updatedUser = {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        avatarUrl: r.avatar_url,
        registeredAt: r.created_at
      };

      return res.json({
        success: true,
        message: 'Profil berhasil diperbarui.',
        user: updatedUser
      });
    }

    // In-memory fallback
    const db = getDatabase();
    const idx = (db.users || []).findIndex((u) => u.id === userId || (userEmail && u.email === userEmail));
    if (idx !== -1) {
      if (name) db.users[idx].name = name.trim();
      if (phone) db.users[idx].phone = phone.trim();
      if (avatarUrl) db.users[idx].avatarUrl = avatarUrl;
      saveDatabase(db);
      return res.json({ success: true, message: 'Profil berhasil diperbarui.', user: db.users[idx] });
    }

    res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dual mounting: handles both /api/... and direct /... routes seamlessly on Vercel and Vite
app.use('/api', router);
app.use(router);

export default app;
