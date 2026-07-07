import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { hashPassword } from '../services/authService.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { generateSecurePassword } from '../utils/generatePassword.js';
import { AppError } from '../utils/AppError.js';

/**
 * Complete organization onboarding
 * Creates org + admin user
 */
export const completeOnboarding = async (req, res, next) => {
  try {
    const {
      organizationName,
      domain,
      industry,
      adminName,
      adminEmail,
      password,
    } = req.body;

    // Validate required fields
    if (!organizationName || !domain || !adminName || !adminEmail || !password) {
      throw new AppError('All fields are required', 400);
    }

    // Check if domain already exists
    const existingOrg = await Organization.findOne({ domain });
    if (existingOrg) {
      throw new AppError('Organization domain already exists', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ personalEmail: adminEmail });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create organization
    const organization = await Organization.create({
      name: organizationName,
      domain,
      industry: industry || 'Other',
      plan: 'free',
      membersCount: { hr: 0, employees: 0, interns: 0 },
    });

    // Create admin user
    const hashedPassword = await hashPassword(password);
    const companyEmail = `${adminName.toLowerCase().replace(/\s+/g, '.')}@${domain}.flowgen.app`;

    const admin = await User.create({
      orgId: organization._id,
      name: adminName,
      personalEmail: adminEmail,
      companyEmail,
      password: hashedPassword,
      role: ROLES.ORG_ADMIN,
      department: 'Executive',
      designation: 'Administrator',
      status: USER_STATUS.ACTIVE,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(adminName)}`,
    });

    // Link admin to organization
    organization.adminId = admin._id;
    await organization.save();

    // TODO: Send welcome email when email service is configured
    // await emailService.sendWelcomeEmail(admin, organization);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        organizationId: organization._id,
        organizationName: organization.name,
        adminId: admin._id,
        companyEmail,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite team member
 * Creates user with temporary password and sends invitation email
 */
export const inviteMember = async (req, res, next) => {
  try {
    const {
      name,
      personalEmail,
      role,
      department,
      designation,
      teamId,
    } = req.body;

    const orgId = req.user.organization;

    // Validate required fields
    if (!name || !personalEmail || !role) {
      throw new AppError('Name, email, and role are required', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ personalEmail });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Get organization
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }

    // Generate temporary password
    const tempPassword = generateSecurePassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Generate company email
    const companyEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@${organization.domain}.flowgen.app`;

    // Create user
    const user = await User.create({
      orgId,
      name,
      personalEmail,
      companyEmail,
      password: hashedPassword,
      role,
      department: department || 'General',
      designation: designation || role,
      teamId: teamId || null,
      managerId: req.user._id,
      status: USER_STATUS.ACTIVE,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });

    // Update organization member count
    if (role === ROLES.HR) {
      organization.membersCount.hr += 1;
    } else if (role === ROLES.EMPLOYEE) {
      organization.membersCount.employees += 1;
    } else if (role === ROLES.INTERN) {
      organization.membersCount.interns += 1;
    }
    await organization.save();

    // TODO: Send invitation email when email service is configured
    // await emailService.sendInvitationEmail(user, tempPassword, organization);

    res.status(201).json({
      success: true,
      message: 'Member invited successfully',
      data: {
        userId: user._id,
        name: user.name,
        companyEmail: user.companyEmail,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get onboarding status
 */
export const getOnboardingStatus = async (req, res, next) => {
  try {
    const orgId = req.user.organization;

    const organization = await Organization.findById(orgId);
    const userCount = await User.countDocuments({ orgId });
    const hasTeams = await require('../models/Team.js').default.exists({ orgId });
    const hasProjects = await require('../models/Project.js').default.exists({ orgId });

    const status = {
      organizationSetup: true,
      membersAdded: userCount > 1,
      teamsCreated: !!hasTeams,
      projectsCreated: !!hasProjects,
      completionPercentage: 0,
    };

    // Calculate completion
    const steps = Object.keys(status).filter(k => k !== 'completionPercentage');
    const completed = steps.filter(k => status[k]).length;
    status.completionPercentage = Math.round((completed / steps.length) * 100);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};
