const bcrypt = require('bcryptjs');
const { db, initDB } = require('./schema');

async function seed() {
  await initDB();

  // Check if already seeded
  const existing = await db.execute('SELECT COUNT(*) as count FROM users');
  if (existing.rows[0].count > 0) {
    console.log('📦 Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database...');

  // Create users
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  await db.batch([
    {
      sql: `INSERT INTO users (username, password_hash, name, email, role, office) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['admin', adminHash, 'Admin Cairo', 'admin@egyptplugs.com', 'admin', 'Cairo']
    },
    {
      sql: `INSERT INTO users (username, password_hash, name, email, role, office) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['cairo1', staffHash, 'Ahmed (Cairo)', 'ahmed@egyptplugs.com', 'cairo_staff', 'Cairo']
    },
    {
      sql: `INSERT INTO users (username, password_hash, name, email, role, office) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['kano1', staffHash, 'Ibrahim (Kano)', 'ibrahim@egyptplugs.com', 'kano_staff', 'Kano']
    },
    {
      sql: `INSERT INTO users (username, password_hash, name, email, role, office) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['abuja1', staffHash, 'Hassan (Abuja)', 'hassan@egyptplugs.com', 'abuja_staff', 'Abuja']
    },
  ]);

  // Create customers
  const customers = [
    ['Ahmed Musa', '+20 101 234 5678', 'ahmed.musa@email.com', 'Kano', 'VIP', 'Active'],
    ['Ibrahim Sani', '+234 801 234 5678', 'ibrahim.sani@gmail.com', 'Kano', 'Frequent', 'Active'],
    ['Hassan Ali', '+234 803 123 4567', 'hassan.ali@email.com', 'Abuja', 'Regular', 'Active'],
    ['Fatima Abdallah', '+234 806 789 0123', 'fatima.a@gmail.com', 'Kano', 'New', 'Active'],
    ['Yusuf Ibrahim', '+234 818 234 5678', 'yusufibrahim@gmail.com', 'Abuja', 'Regular', 'Active'],
    ['Maryam Usman', '+234 909 876 5432', 'maryam.u@email.com', 'Kano', 'Dormant', 'Dormant'],
    ['Amina Hassan', '+234 813 456 7890', 'amina.h@email.com', 'Lagos', 'Regular', 'Active'],
    ['Umar Faruk', '+234 705 234 5678', 'umar.f@email.com', 'Kano', 'Frequent', 'Active'],
  ];

  for (const c of customers) {
    await db.execute({
      sql: `INSERT INTO customers (name, phone, email, city, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: c
    });
  }

  // Create a sack
  await db.execute({
    sql: `INSERT INTO sacks (sack_number, destination, flight_batch, status, created_by) VALUES (?, ?, ?, ?, ?)`,
    args: ['SACK-KNO-250521-07', 'Kano', 'FL-CAI-KNO-210525', 'arrived', 1]
  });

  // Create sample parcels
  const parcels = [
    {
      tracking_id: 'KNO-250521-0042',
      customer_id: 1,
      receiver_name: 'Ibrahim Sani',
      receiver_phone: '+234 801 234 5678',
      destination: 'Kano',
      parcel_type: 'Personal Items',
      quantity: 2,
      weight: 4.50,
      declared_value: 1250,
      description: 'Clothes, Shoes, Personal effects',
      notes: 'Handle with care',
      total_amount: 1250,
      amount_paid: 1250,
      payment_method: 'Cash',
      status: 'arrived_destination',
      sack_id: 1,
    },
    {
      tracking_id: 'KNO-250521-0043',
      customer_id: 2,
      receiver_name: 'Hassan Ali',
      receiver_phone: '+234 803 123 4567',
      destination: 'Kano',
      parcel_type: 'Electronics',
      quantity: 1,
      weight: 2.20,
      declared_value: 5000,
      description: 'Mobile phone accessories',
      notes: null,
      total_amount: 950,
      amount_paid: 950,
      payment_method: 'Cash',
      status: 'arrived_destination',
      sack_id: 1,
    },
    {
      tracking_id: 'KNO-250521-0044',
      customer_id: 3,
      receiver_name: 'Fatima Abdallah',
      receiver_phone: '+234 806 789 0123',
      destination: 'Kano',
      parcel_type: 'Food Items',
      quantity: 3,
      weight: 1.00,
      declared_value: 500,
      description: 'Spices and dry food',
      notes: null,
      total_amount: 600,
      amount_paid: 600,
      payment_method: 'Cash',
      status: 'arrived_destination',
      sack_id: 1,
    },
    {
      tracking_id: 'KNO-250521-0045',
      customer_id: 4,
      receiver_name: 'Yusuf Ibrahim',
      receiver_phone: '+234 818 234 5678',
      destination: 'Kano',
      parcel_type: 'Personal Items',
      quantity: 4,
      weight: 3.75,
      declared_value: 3000,
      description: 'Clothing items',
      notes: 'Fragile items inside',
      total_amount: 1800,
      amount_paid: 1800,
      payment_method: 'Bank Transfer',
      status: 'delivered',
      sack_id: 1,
      collector_name: 'Yusuf Ibrahim',
    },
    {
      tracking_id: 'KNO-250521-0046',
      customer_id: 5,
      receiver_name: 'Maryam Usman',
      receiver_phone: '+234 909 876 5432',
      destination: 'Kano',
      parcel_type: 'Documents',
      quantity: 1,
      weight: 2.10,
      declared_value: 500,
      description: 'Important documents',
      notes: null,
      total_amount: 1050,
      amount_paid: 500,
      payment_method: 'Cash',
      status: 'received_cairo',
    },
    {
      tracking_id: 'ABJ-250521-0012',
      customer_id: 7,
      receiver_name: 'Amina Hassan',
      receiver_phone: '+234 813 456 7890',
      destination: 'Abuja',
      parcel_type: 'Personal Items',
      quantity: 2,
      weight: 6.50,
      declared_value: 4000,
      description: 'Clothing and accessories',
      notes: null,
      total_amount: 2500,
      amount_paid: 2500,
      payment_method: 'Cash',
      status: 'delivered',
      collector_name: 'Amina Hassan',
    },
  ];

  for (const p of parcels) {
    const result = await db.execute({
      sql: `INSERT INTO parcels (tracking_id, customer_id, receiver_name, receiver_phone, destination, parcel_type, quantity, weight, declared_value, description, notes, total_amount, amount_paid, payment_method, status, sack_id, collector_name, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, 2)`,
      args: [p.tracking_id, p.customer_id, p.receiver_name, p.receiver_phone, p.destination, p.parcel_type, p.quantity, p.weight, p.declared_value, p.description || null, p.notes || null, p.total_amount, p.amount_paid, p.payment_method, p.status, p.sack_id || null, p.collector_name || null]
    });

    const parcelId = Number(result.lastInsertRowid);

    // Add timeline events
    const timelines = {
      received_cairo: [
        { status: 'received_cairo', note: 'Parcel registered and payment confirmed', office: 'Cairo' },
      ],
      packed: [
        { status: 'received_cairo', note: 'Parcel registered and payment confirmed', office: 'Cairo' },
        { status: 'packed', note: 'Packed in sack', office: 'Cairo' },
      ],
      shipped: [
        { status: 'received_cairo', note: 'Parcel registered', office: 'Cairo' },
        { status: 'packed', note: 'Packed in sack', office: 'Cairo' },
        { status: 'shipped', note: 'Sack departed Cairo via Air', office: 'Cairo' },
      ],
      arrived_destination: [
        { status: 'received_cairo', note: 'Parcel registered and payment confirmed', office: 'Cairo' },
        { status: 'packed', note: `Packed in sack SACK-KNO-250521-07`, office: 'Cairo' },
        { status: 'shipped', note: 'Sack departed Cairo via Air', office: 'Cairo' },
        { status: 'arrived_destination', note: 'Sack arrived at Kano office', office: 'Kano' },
      ],
      delivered: [
        { status: 'received_cairo', note: 'Parcel registered and payment confirmed', office: 'Cairo' },
        { status: 'packed', note: 'Packed in sack', office: 'Cairo' },
        { status: 'shipped', note: 'Sack departed Cairo via Air', office: 'Cairo' },
        { status: 'arrived_destination', note: 'Sack arrived at destination office', office: p.destination },
        { status: 'delivered', note: `Delivered to ${p.collector_name || 'receiver'}`, office: p.destination },
      ],
    };

    const events = timelines[p.status] || timelines['received_cairo'];
    for (const evt of events) {
      await db.execute({
        sql: `INSERT INTO tracking_timeline (parcel_id, status, note, office, updated_by) VALUES (?, ?, ?, ?, 2)`,
        args: [parcelId, evt.status, evt.note, evt.office]
      });
    }
  }

  // Sample payments
  const paymentRecords = [
    [1, 1, 1250, 'Cash', 'payment'],
    [2, 2, 950, 'Cash', 'payment'],
    [3, 3, 600, 'Cash', 'payment'],
    [4, 4, 1800, 'Bank Transfer', 'payment'],
    [5, 5, 500, 'Cash', 'payment'],
    [7, 6, 2500, 'Cash', 'payment'],
  ];

  for (const [cid, pid, amount, method, type] of paymentRecords) {
    await db.execute({
      sql: `INSERT INTO payments (customer_id, parcel_id, amount, payment_method, type, recorded_by) VALUES (?, ?, ?, ?, ?, 2)`,
      args: [cid, pid, amount, method, type]
    });
  }

  console.log('✅ Database seeded successfully');
  console.log('👤 Admin login: admin / admin123');
  console.log('👤 Cairo staff: cairo1 / staff123');
  console.log('👤 Kano staff:  kano1 / staff123');
  console.log('👤 Abuja staff: abuja1 / staff123');
}

seed().catch(console.error).finally(() => process.exit(0));
