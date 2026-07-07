import mongoose from 'mongoose';
import 'dotenv/config';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/services/authService.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flowgen';

async function main() {
  console.log('Connecting to database at:', uri);
  await mongoose.connect(uri);
  
  console.log('Dropping database to clear all data...');
  await mongoose.connection.dropDatabase();
  console.log('Database cleared.');

  console.log('Seeding organizations and users...');
  
  // 1. Create Organization
  const org = await Organization.create({
    name: 'TechCorp',
    domain: 'techcorp',
    industry: 'Technology',
    plan: 'enterprise',
    address: '100 Innovation Way',
    city: 'San Francisco',
    country: 'USA',
    phone: '+1-555-0199',
    taxId: 'TX-99887766',
    verificationStatus: 'verified',
    membersCount: {
      hr: 1,
      employees: 1,
      interns: 1
    }
  });

  const passwordHash = await hashPassword('password123');

  // 2. Create Org Admin User
  const admin = await User.create({
    orgId: org._id,
    name: 'TechCorp Admin',
    personalEmail: 'admin.personal@techcorp.com',
    companyEmail: 'admin@techcorp.flowgen.app',
    password: passwordHash,
    role: ROLES.ORG_ADMIN,
    status: USER_STATUS.ACTIVE,
    department: 'Executive',
    designation: 'Organization Admin',
  });

  // Link Organization to Admin
  org.adminId = admin._id;
  await org.save();

  // 3. Create HR Manager User
  await User.create({
    orgId: org._id,
    name: 'Sarah Jenkins',
    personalEmail: 'sarah.jenkins@gmail.com',
    companyEmail: 'hr@techcorp.flowgen.app',
    password: passwordHash,
    role: ROLES.HR,
    status: USER_STATUS.ACTIVE,
    department: 'Human Resources',
    designation: 'HR Manager',
  });

  // 4. Create Employee User
  await User.create({
    orgId: org._id,
    name: 'John Doe',
    personalEmail: 'john.doe.personal@gmail.com',
    companyEmail: 'john.doe@techcorp.flowgen.app',
    password: passwordHash,
    role: ROLES.EMPLOYEE,
    status: USER_STATUS.ACTIVE,
    department: 'Engineering',
    designation: 'Software Engineer',
  });

  // 5. Create Intern User
  await User.create({
    orgId: org._id,
    name: 'Alex Intern',
    personalEmail: 'alex.intern.personal@gmail.com',
    companyEmail: 'intern@techcorp.flowgen.app',
    password: passwordHash,
    role: ROLES.INTERN,
    status: USER_STATUS.ACTIVE,
    department: 'Engineering',
    designation: 'Software Engineering Intern',
  });

  console.log('✅ Mock data seeded successfully:');
  console.log('  - Org Admin: admin@techcorp.flowgen.app / password123');
  console.log('  - HR Manager: hr@techcorp.flowgen.app / password123');
  console.log('  - Employee: john.doe@techcorp.flowgen.app / password123');
  console.log('  - Intern: intern@techcorp.flowgen.app / password123');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
