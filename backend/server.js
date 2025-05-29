// backend/server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser'); // Or use express.json() and express.urlencoded()

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow requests from your frontend
// If using body-parser:
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// OR if using built-in Express parsers (Express 4.16+):
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


// Nodemailer Transporter Setup
// This example is for Gmail. Adjust for other providers.
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your email provider's service name
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // For other providers, you might need host, port, secure options:
    // host: 'smtp.example.com',
    // port: 587, // or 465 for SSL
    // secure: false, // true for 465, false for other ports
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Error with Nodemailer transporter config:', error);
    } else {
        console.log('Nodemailer transporter is ready to send emails.');
    }
});

// API Route to handle contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    console.log('Received contact form submission:', { name, email, message });


    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`, // Sender address (shows your email, but with the sender's name)
        to: process.env.RECIPIENT_EMAIL,          // Your email address to receive messages
        replyTo: email,                           // So you can reply directly to the sender
        subject: `New Contact Form Submission from ${name}`,
        html: `
            <p>You have a new contact form submission:</p>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
            </ul>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
        }
        console.log('Message sent: %s', info.messageId);
        return res.status(200).json({ success: true, message: 'Message sent successfully!' });
    });
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});