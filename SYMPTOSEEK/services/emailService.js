const nodemailer = require('nodemailer');

// The transporter uses the credentials from your .env file
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This should be your Google App Password
  },
});

/**
 * Sends a pre-formatted reminder email.
 * @param {string} userEmail - The recipient's email address.
 * @param {object} reminder - The reminder object (title, description, time, type).
 */
const sendReminderEmail = async (userEmail, reminder) => {
  const isAdvanceNotice = reminder.time.includes('in') && reminder.time.includes('minutes');
  const urgencyClass = isAdvanceNotice ? 'advance-notice' : 'immediate';
  const urgencyColor = isAdvanceNotice ? '#f59e0b' : '#10b981';
  const urgencyText = isAdvanceNotice ? 'Upcoming Reminder' : 'Time for Action';

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: isAdvanceNotice ? `⏰ Upcoming: ${reminder.title}` : `🔔 Reminder: ${reminder.title}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea, #7c3aed); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏥 SymptoSeek</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Your Health Companion</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <div style="background: ${urgencyColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 18px;">${urgencyText}</h2>
          </div>
          
          <div style="border-left: 4px solid ${urgencyColor}; padding-left: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 20px;">${reminder.title}</h3>
            <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0; font-size: 16px; color: #4a5568;"><strong>⏰ Time:</strong> ${reminder.time}</p>
              <p style="margin: 10px 0 0 0; font-size: 16px; color: #4a5568;"><strong>📋 Type:</strong> ${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}</p>
            </div>
            ${reminder.description ? `
              <div style="background: #edf2f7; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 0; font-size: 14px; color: #2d3748;"><strong>📝 Details:</strong></p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #4a5568;">${reminder.description}</p>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications" 
               style="display: inline-block; background: linear-gradient(135deg, #9333ea, #7c3aed); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; transition: transform 0.2s;">
              View All Notifications
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #a0aec0;">
              You received this reminder because you scheduled it in SymptoSeek.<br>
              To manage your notifications, visit the app or contact support.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${userEmail} for "${reminder.title}"`);
  } catch (error) {
    console.error(`Error sending email to ${userEmail}:`, error);
  }
};

module.exports = { sendReminderEmail };