// ─────────────────────────────────────────────────────────────
// Service — Email
// Handles all platform communications (SMTP/Nodemailer)
// ─────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');

/**
 * Basic Email Service
 * Note: Requires SMTP credentials in .env
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send common email
   */
  async sendMail({ to, subject, html }) {
    try {
      if (!process.env.SMTP_USER) {
        console.warn('⚠️ SMTP credentials not found. Email send skipped.');
        return;
      }

      await this.transporter.sendMail({
        from: `"HostelDekho" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('❌ Email failed to send:', error);
    }
  }

  /**
   * Notify property status change
   */
  async notifyPropertyStatus(user, property, status) {
    const isApproved = status === 'ACTIVE';
    const subject = isApproved 
      ? `🎉 Success! Your property '${property.title}' is now LIVE`
      : `⚠️ Update regarding your property listing: ${property.title}`;
    
    const html = `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <h2>Hello ${user.name},</h2>
        <p>Your property <strong>${property.title}</strong> has been ${isApproved ? '<span style="color: green;">APPROVED</span>' : '<span style="color: red;">REJECTED</span>'} by our moderation team.</p>
        ${isApproved 
          ? '<p>Your listing is now visible to thousands of potential tenants on HostelDekho!</p>' 
          : `<p>Unfortunately, your listing did not meet our criteria. Please review our guidelines and try again.</p>`}
        <br/>
        <p>Best regards,<br/>The HostelDekho Team</p>
      </div>
    `;

    await this.sendMail({ to: user.email, subject, html });
  }

  /**
   * Notify KYC status change
   */
  async notifyKycStatus(user, kyc, status) {
    const isApproved = status === 'APPROVED';
    const subject = isApproved ? '✅ KYC Verification Successful' : '🛑 KYC Verification Rejected';

    const html = `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>Hello ${user.name},</h2>
        <p>Your identity verification (KYC) has been ${isApproved ? '<strong>APPROVED</strong>' : '<strong>REJECTED</strong>'}.</p>
        ${!isApproved ? `<p>Reason: ${kyc.rejectionReason || 'Documents unclear or invalid.'}</p>` : ''}
        <p>Thank you for helping us maintain a safe community.</p>
      </div>
    `;

    await this.sendMail({ to: user.email, subject, html });
  }
}

module.exports = new EmailService();
