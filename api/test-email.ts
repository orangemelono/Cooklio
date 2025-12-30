import * as nodemailer from 'nodemailer';

// Create a test email function
async function testEmail() {
  try {
    console.log('Creating transporter...');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // use false for port 587
      auth: {
        user: '9efa20001@smtp-brevo.com',
        pass: 'REMOVED',
      },
    });

    console.log('Attempting to send test email...');
    
    const info = await transporter.sendMail({
      from: '9efa20001@smtp-brevo.com',
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