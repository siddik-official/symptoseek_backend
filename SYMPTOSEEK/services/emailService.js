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
 * @param {object} reminder - The reminder object (title, description, time).
 */
const sendReminderEmail = async (userEmail, reminder) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: `Reminder: ${reminder.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Just a friendly reminder!</h2>
        <p>It's time for your scheduled reminder:</p>
        <div style="border-left: 4px solidrgb(116, 30, 197); padding-left: 15px; margin: 20px 0;">
          <h3 style="margin: 0;">${reminder.title}</h3>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${reminder.time}</p>
          ${reminder.description ? `<p style="margin: 5px 0;"><strong>Details:</strong> ${reminder.description}</p>` : ''}
        </div>
        <p>You can manage your reminders in the SymptoSeek app.</p>
        <p>Have a great day!</p>
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