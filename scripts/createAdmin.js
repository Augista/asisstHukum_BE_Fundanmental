require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log('❌ Admin user already exists:', adminEmail);
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = await prisma.user.create({
            data: {
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password:', adminPassword);
        console.log('⚠️  Please change the password after first login!');
        console.log('\nAdmin details:', admin);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
