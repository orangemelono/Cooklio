import * as nodemailer from 'nodemailer';

// Create a test email function
async function testEmail() {
  try {
    console.log('Creating transporter...');

    // Use environment variables for SMTP credentials
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    if (!smtpUser || !smtpPass) {
      console.error('SMTP credentials not found in environment variables. Please set SMTP_USER and SMTP_PASS.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // use false for port 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('Attempting to send test email...');

    const info = await transporter.sendMail({
      from: smtpUser,
      to: 'test@example.com', // Replace with your actual email to test
      subject: 'Test Email from Cooklio App',
      text: 'This is a test email to verify the SMTP configuration.',
      html: '<h1>This is a test email</h1><p>If you received this, your SMTP configuration is working!</p>',
    });

    console.log('Email sent successfully:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();